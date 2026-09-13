/**
 * A driver that plays the game badly on purpose.
 *
 * Balance numbers taken from a perfect agent are worthless: a perfect agent sees
 * every car at once, decides instantly and never mistimes a press, so it will
 * clear anything a human cannot. Rather than tuning against that and then
 * guessing at a discount, the failure modes are modelled directly.
 *
 * Four of them, and they compound the way a real player's do:
 *
 *   reaction   Decisions fire on an interval, and each one reads the world as it
 *              was `reactionLag` ago. This alone is most of the gap: at 0.5s of
 *              lag a gap you aimed at has already closed.
 *   sight      Only traffic within `lookahead` road units exists. A human cannot
 *              plan around a car on the far side of the circuit.
 *   noise      A share of decisions pick a worse lane, or nothing at all.
 *   hands      A share of lane changes overshoot by one.
 *
 * Plus discipline (how reliably the throttle actually gets lifted when the gap
 * says it should) and panic (everything degrades for a moment after a crash).
 *
 * The bot only ever touches the game through synthetic taps on the real control
 * bar, so it drives through input.ts -> player.ts exactly as a thumb does. It
 * cannot reach into the simulation, and anything it "sees" is read from the same
 * exported state a devtools console would show.
 */

/** Control-bar centres in design space, from src/controls.ts. */
const THROTTLE_POINT = { x: 303, y: 774 };
/** The left button raises the lane index, the right button lowers it. */
const LANE_POINT = { up: { x: 58, y: 774 }, down: { x: 142, y: 774 } };

const THROTTLE_ID = 1;
const LANE_ID = 2;

const LANE_COUNT = 5;
/** Contact is decided within this lane distance, so anything closer is "the same lane". */
const SAME_LANE = 0.6;

export const PERSONAS = {
  novice: { label: '新手', reactionLag: 0.55, decisionInterval: 0.50, lookahead: 110, noise: 0.28, hands: 0.10, discipline: 0.15, panic: 2.0 },
  casual: { label: '休闲', reactionLag: 0.42, decisionInterval: 0.38, lookahead: 150, noise: 0.18, hands: 0.06, discipline: 0.35, panic: 1.5 },
  average: { label: '中等', reactionLag: 0.32, decisionInterval: 0.28, lookahead: 190, noise: 0.11, hands: 0.04, discipline: 0.55, panic: 1.2 },
  good: { label: '熟练', reactionLag: 0.24, decisionInterval: 0.21, lookahead: 240, noise: 0.06, hands: 0.02, discipline: 0.75, panic: 0.8 },
  expert: { label: '高手', reactionLag: 0.17, decisionInterval: 0.15, lookahead: 300, noise: 0.025, hands: 0.008, discipline: 0.90, panic: 0.4 },
  /** Not a person. The ceiling, kept only so a config's headroom is visible. */
  perfect: { label: '完美', reactionLag: 0, decisionInterval: 0.016, lookahead: 9999, noise: 0, hands: 0, discipline: 1, panic: 0 }
};

/**
 * When the road ahead is at least this clear, nobody has any reason to lift.
 * Overtakes are scored on distance alone, not on lane, so speed *is* the score
 * and coasting is almost always a mistake. An earlier version had the bot lift
 * whenever the gap got tight, which made the careful personas slower and
 * therefore lower-scoring than the careless ones — the model punishing skill.
 */
const SAFE_TTC = 1.15;
/**
 * Lifting only buys anything once there is nowhere left to go. Above this, a
 * competent driver keeps their foot in and changes lane instead; below it, the
 * gap is closing faster than a lane change can solve.
 */
const DANGER_TTC = 0.62;
/** Below this, a lane is treated as blocked however good it looks otherwise. */
const PANIC_TTC = 0.45;
/** A car this close behind in the target lane makes the change a side-swipe. */
const REAR_GAP = 26;
/** Changing lanes for a marginal gain is a human tell; require a real improvement. */
const STAY_BIAS = 0.35;

function wrap(value, total) {
  return ((value % total) + total) % total;
}

/** Forward gap from a to b around the loop, matching track.ts. */
function forwardGap(from, to, total) {
  return wrap(to - from, total);
}

/**
 * Snapshot of everything the driver is allowed to know. Taken every frame and
 * consumed `reactionLag` later, which is what makes the lag real rather than a
 * fudge factor applied to the outcome.
 */
function snapshot(game) {
  const cars = [];
  for (const car of game.aiCars) {
    if (!car.alive) continue;
    // laneTo and state are drawn on screen as a turn signal, so a driver can see
    // them; a car mid-signal is treated as occupying both lanes.
    cars.push({
      distance: car.distance,
      lane: car.visualLane,
      target: car.laneTo,
      signalling: car.state === 'WARNING' || car.state === 'CHANGING',
      speed: car.speed
    });
  }
  return {
    distance: game.player.distance,
    lane: game.player.lane,
    visualLane: game.player.visualLane,
    speed: game.player.speed,
    state: game.player.state,
    cars
  };
}

/**
 * Time until the player would reach the nearest car in `lane`, and how much room
 * there is behind. Infinity when the lane reads clear inside the sight limit.
 */
function laneOutlook(view, lane, lookahead, total) {
  let ttc = Infinity;
  let rear = Infinity;
  for (const car of view.cars) {
    const occupies = Math.abs(car.lane - lane) <= SAME_LANE ||
      (car.signalling && Math.abs(car.target - lane) <= SAME_LANE);
    if (!occupies) continue;

    const ahead = forwardGap(view.distance, car.distance, total);
    if (ahead <= lookahead) {
      const closing = view.speed - car.speed;
      // A car pulling away is not a threat, however close it is.
      if (closing > 1) ttc = Math.min(ttc, ahead / closing);
    }

    const behind = forwardGap(car.distance, view.distance, total);
    if (behind < rear) rear = behind;
  }
  return { ttc, rear };
}

export function createBot(api, personaKey, rng) {
  const persona = PERSONAS[personaKey];
  if (!persona) throw new Error(`unknown persona: ${personaKey}`);

  const { game, fire, touch } = api;
  const history = [];
  let sinceDecision = 0;
  let panicLeft = 0;
  let lastCollisionCount = 0;
  let throttleHeld = false;

  function setThrottle(on) {
    if (on === throttleHeld) return;
    if (on) fire('start', [touch(THROTTLE_ID, THROTTLE_POINT.x, THROTTLE_POINT.y)]);
    else fire('end', [touch(THROTTLE_ID, THROTTLE_POINT.x, THROTTLE_POINT.y)]);
    throttleHeld = on;
  }

  function tapLane(direction) {
    const point = direction > 0 ? LANE_POINT.up : LANE_POINT.down;
    fire('start', [touch(LANE_ID, point.x, point.y)]);
    fire('end', [touch(LANE_ID, point.x, point.y)]);
  }

  function decide(view, total) {
    const stressed = panicLeft > 0;
    const noise = stressed ? Math.min(0.85, persona.noise * 2.5) : persona.noise;
    const lookahead = stressed ? persona.lookahead * 0.7 : persona.lookahead;

    const current = Math.round(view.lane);
    const candidates = [];
    for (const step of [-1, 0, 1]) {
      const lane = current + step;
      if (lane < 0 || lane >= LANE_COUNT) continue;
      const outlook = laneOutlook(view, lane, lookahead, total);
      // A change into a lane with a car right behind trades a problem for a worse
      // one, so it is priced as if the lane were nearly blocked.
      const rearPenalty = step !== 0 && outlook.rear < REAR_GAP ? 0.25 : 1;
      candidates.push({
        step,
        ttc: outlook.ttc,
        value: Math.min(outlook.ttc, 12) * rearPenalty + (step === 0 ? STAY_BIAS : 0)
      });
    }

    let choice = candidates.reduce((best, entry) => (entry.value > best.value ? entry : best));

    // Noise: sometimes the wrong lane, sometimes frozen. Both are things people do.
    if (rng() < noise) {
      choice = rng() < 0.45
        ? { step: 0, ttc: candidates.find((entry) => entry.step === 0).ttc, value: 0 }
        : candidates[Math.floor(rng() * candidates.length)];
    }

    if (choice.step !== 0) {
      tapLane(choice.step);
      // Hands: the press that goes one lane too far.
      if (rng() < (stressed ? persona.hands * 2 : persona.hands)) tapLane(choice.step);
    }

    // Throttle is judged on the lane actually being entered. Lifting is only
    // worth anything when the gap is closing faster than the lane change can
    // fix, so above DANGER_TTC the foot stays in whatever the driver's skill.
    const chosenTtc = choice.ttc;
    if (chosenTtc >= SAFE_TTC || chosenTtc >= DANGER_TTC) {
      setThrottle(true);
    } else {
      // Discipline is the chance of acting on your own read. Below PANIC_TTC even
      // a careless driver reacts, because by then the car fills the screen.
      const obeys = chosenTtc < PANIC_TTC || rng() < persona.discipline;
      setThrottle(!obeys);
    }
  }

  return {
    persona,
    /** Call once per simulated frame, after the frame has been stepped. */
    tick(dt) {
      if (game.run.outcome !== 'running') return;

      if (game.player.collisionCount > lastCollisionCount) {
        lastCollisionCount = game.player.collisionCount;
        panicLeft = persona.panic;
      }
      panicLeft = Math.max(0, panicLeft - dt);

      const total = game.trackLength();
      history.push({ at: history.length * dt, view: snapshot(game) });
      // Only ever needs to reach back reactionLag; anything older is dead weight.
      const keep = Math.ceil(persona.reactionLag / dt) + 2;
      while (history.length > keep) history.shift();

      sinceDecision += dt;
      const interval = panicLeft > 0 ? persona.decisionInterval * 1.6 : persona.decisionInterval;

      // A sudden threat interrupts the scan. People do not wait out their own
      // planning rhythm when a car appears in front of them, and without this the
      // bot would sit through a cut-in it had already "seen", which showed up as
      // even the perfect agent crashing regularly.
      const lagFramesNow = Math.round(persona.reactionLag / dt);
      const seen = history[Math.max(0, history.length - 1 - lagFramesNow)].view;
      const here = laneOutlook(seen, Math.round(seen.lane), persona.lookahead, total);
      const startled = here.ttc < PANIC_TTC;

      if (sinceDecision < interval && !startled) return;
      sinceDecision = 0;

      // Crashed cars take no decisions; the freeze is part of the cost.
      if (game.player.state === 'CRASHED') {
        setThrottle(false);
        return;
      }

      decide(seen, total);
    },
    release() {
      setThrottle(false);
    }
  };
}
