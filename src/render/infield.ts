/**
 * The complex inside the circuit.
 *
 * The reference's simplest track is a single closed loop, structurally the same
 * as three of ours, and the difference is entirely what is inside it: a domed
 * hall, two big rotundas, a cluster of tents, a row of pit sheds — and a service
 * road threading through and joining them up. Ours was bare ground with a few
 * objects sprinkled on it.
 *
 * The service road turned out to be the part that matters most. It is what says
 * these buildings can be *reached*, that they belong to one facility and were
 * put there on purpose. Without it even good buildings read as models placed on
 * a board; with it, three crude ones read as a place.
 *
 * The infield is found, not declared: the points of open ground that fall inside
 * the centre line, which is a question a ray cast can answer and a level designer
 * should not have to. Circuits whose interior is a set of narrow slots rather
 * than one room — Long Bay's folds — simply yield nothing here, which is the
 * right answer for them.
 */

import { ctx, DESIGN_W } from '../platform';
import { activeTrackId, pathAtOffset } from '../track';
import type { TrackId } from '../tracks';
import { lateralUnit, project } from './camera';
import { drawArt } from './art';
import { modelWidth } from '../assets';
import { SHADOW_X, SHADOW_Y } from './light';
import { claimGround, freeGround, releaseGround } from './props';
import { BOARD_BOTTOM, BOARD_TOP } from './scenery';
import { groundTexture } from './sprites';
import { surfaceFor } from './surface';

export type StructureKind =
  | 'hall' | 'dome' | 'tank' | 'pavilion' | 'lagoon' | 'containers' | 'lawn'
  | 'factory' | 'works' | 'shed' | 'tower' | 'tanks';

/**
 * The ones that are ground rather than building, and so get no hardstanding
 * under them. A lagoon on a concrete pad would be a swimming pool.
 */
const GROUND_KINDS: StructureKind[] = ['lagoon', 'lawn'];

interface Structure {
  x: number;
  y: number;
  kind: StructureKind;
  /** Half-width in plane units. Sized by the room actually available. */
  reach: number;
}

/** A structure needs this much clearance before it is worth placing one. */
const MIN_REACH = 26;
/** Run-off plus breathing room, which no structure may eat into. */
const APRON_ALLOWANCE = 34;
/** And the infield needs this many free points to be a room rather than a slot. */
const MIN_ROOM = 10;

let cachedTrack: TrackId | null = null;
let cached: Structure[] = [];
let cachedOutfield: Structure[] = [];

/** Ray cast against the centre line. */
function inside(x: number, y: number, path: ReturnType<typeof pathAtOffset>): boolean {
  let hit = false;
  for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
    const a = path[i];
    const b = path[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

/**
 * Places large structures in whichever half of the board is asked for.
 *
 * The same search serves inside and outside the circuit. Outside is thinner —
 * the fit leaves 26 units to the frame — so it gets a lower bar for what counts
 * as room and a shorter list, but the failure mode is the same and correct: a
 * side with nowhere to stand yields nothing rather than something jammed in.
 */
function buildStructures(
  wantInside: boolean,
  kinds: StructureKind[],
  minReach: number,
  limit: number
): Structure[] {
  const path = pathAtOffset(0);
  const room = freeGround().filter((spot) => inside(spot.x, spot.y, path) === wantInside);
  if (room.length < MIN_ROOM) return [];
  if (kinds.length === 0) return [];

  // Deepest ground first: a big thing belongs where there is room for it.
  const ranked = [...room].sort((a, b) => b.clearance - a.clearance);
  const placed: Structure[] = [];

  for (const spot of ranked) {
    if (placed.length >= limit) break;
    if (spot.clearance < minReach) break;
    // Keep them apart, or the complex becomes one blob.
    const clash = placed.some((other) => {
      const dx = other.x - spot.x;
      const dy = other.y - spot.y;
      return Math.hypot(dx, dy) < other.reach + spot.clearance * 0.9 + 18;
    });
    if (clash) continue;

    // Room to the frame counts as much as room to the track.
    //
    // Sizing on clearance alone put a dome and a lawn half off the board: the
    // deepest open ground outside a circuit is usually in the corners of the
    // frame, where there is plenty of distance to the tarmac and almost none to
    // the edge. A structure that is cut in half by the screen is worse than no
    // structure.
    const edgeRoom = Math.min(
      spot.x,
      DESIGN_W - spot.x,
      spot.y - BOARD_TOP,
      BOARD_BOTTOM - spot.y
    );
    // The apron counts as the circuit's, not as spare ground.
    //
    // Clearance is measured to the tarmac, and the run-off now reaches up to 26
    // units past it, so sizing straight off clearance let a rotunda sit with its
    // wall against the edge of the racing — which is the one place a building
    // has no business being. What is available is what is left after the apron
    // and a margin.
    const usable = spot.clearance - APRON_ALLOWANCE;
    const reach = Math.min(usable * 0.8, edgeRoom * 0.78, 46);
    if (reach < minReach * 0.62) continue;

    placed.push({
      x: spot.x,
      y: spot.y,
      kind: kinds[placed.length % kinds.length],
      reach
    });
  }
  return placed;
}

function ensure(): void {
  if (cachedTrack === activeTrackId) return;
  const surface = surfaceFor(activeTrackId);
  releaseGround();
  cached = buildStructures(true, surface.structures, MIN_REACH, 3);
  cachedOutfield = buildStructures(false, surface.outfield, 21, 2);
  // Claim what has been built on, so nothing is scattered on top of it later.
  for (const structure of [...cached, ...cachedOutfield]) {
    claimGround(structure.x, structure.y, structure.reach * 1.15);
  }
  cachedTrack = activeTrackId;
}

function structures(): Structure[] {
  ensure();
  return cached;
}

function outfieldStructures(): Structure[] {
  ensure();
  return cachedOutfield;
}

/** Where the service road runs, and the pads the buildings stand on. */
function drawServiceRoad(placed: Structure[]): void {
  if (placed.length < 2) return;
  const paint = surfaceFor(activeTrackId).road;
  // A road's ends are buildings. It was running into the lagoon, because ground
  // features were in the waypoint list along with everything else, and a road
  // that stops in a pond is not a road.
  const served = placed.filter((structure) => !GROUND_KINDS.includes(structure.kind));
  if (served.length < 2) return;
  const order = [...served].sort((a, b) => a.y - b.y);

  const stroke = (width: number, colour: string | CanvasPattern): void => {
    ctx.save();
    ctx.beginPath();
    const first = project(order[0].x, order[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < order.length; i++) {
      const p = project(order[i].x, order[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = colour;
    ctx.lineWidth = width * lateralUnit();
    ctx.stroke();
    ctx.restore();
  };

  // Narrower than it was, with an edge and a material.
  //
  // It went in as three plain strokes and came out as a grey stick laid across
  // the infield — the same failure the run-off had before it was given a grain:
  // a flat fill between two textured surfaces does not read as a surface at all.
  // For the thing whose entire job is to say "these buildings can be reached",
  // that was worth catching.
  stroke(19, 'rgba(8,14,20,0.16)');
  stroke(16, paint.apronEdge);
  stroke(13, paint.apron);

  const grain = groundTexture(ctx, paint.tile);
  if (grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    stroke(13, grain);
    ctx.restore();
  }

  // A broken centre line. A road without one is a paved strip; it is the single
  // cheapest mark that says vehicles use this and which way they go.
  ctx.save();
  ctx.setLineDash([7 * lateralUnit(), 6 * lateralUnit()]);
  stroke(0.9, 'rgba(240,236,224,0.42)');
  ctx.restore();

  // Pads where it arrives, so the buildings stand on it rather than beside it.
  //
  // Tight, and with an edge. The first version drew them at 1.32 by 0.86 of the
  // structure's reach and they overlapped into one lumpy grey smear across the
  // middle of the works yard — a pad with no edge is not a pad. They are also
  // square where the world is: a yard is set out with a rule, and round
  // hardstanding in an industrial site looks as wrong as a rectangular dune.
  const squared = !surfaceFor(activeTrackId).island.planted;
  for (const structure of placed) {
    if (GROUND_KINDS.includes(structure.kind)) continue;
    const p = project(structure.x, structure.y);
    const r = structure.reach * lateralUnit();
    const w = r * 1.12;
    const h = r * 0.72;

    const shape = (): void => {
      ctx.beginPath();
      if (squared) ctx.rect(p.x - w, p.y - h, w * 2, h * 2);
      else ctx.ellipse(p.x, p.y, w, h, 0, 0, Math.PI * 2);
    };

    ctx.fillStyle = paint.apronEdge;
    shape();
    ctx.fill();
    ctx.fillStyle = paint.apron;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(0.93, 0.9);
    ctx.translate(-p.x, -p.y);
    shape();
    ctx.fill();
    if (grain) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = grain;
      shape();
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * How brightly a sloping facet catches the light, from the way it faces.
 *
 * Every pitched roof on the board is built from facets, and a facet's shade is
 * the one thing that makes a roof read as a roof from above rather than as a
 * flat polygon: the slope towards the sun is bright, the one away from it is
 * dark, and the two in between sit at the ends of the range. The light points up
 * and to the left, which is the opposite of the way every shadow here falls.
 */
function facetShade(nx: number, ny: number): number {
  const length = Math.hypot(nx, ny) || 1;
  const lit = (nx / length) * -SHADOW_X + (ny / length) * -SHADOW_Y;
  return (lit + 1) / 2;
}

function mixShade(base: [number, number, number], shade: number, spread: number): string {
  const k = 1 + (shade - 0.5) * spread;
  const channel = (v: number): number => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${channel(base[0])},${channel(base[1])},${channel(base[2])})`;
}

/**
 * A pitched roof: facets running from each edge of a footprint up to a peak.
 *
 * This is what a tent looks like from above. The first version drew a single
 * triangle with a lighter half — which is a tent drawn in *side elevation*, on a
 * board that looks straight down. It was not badly drawn, it was the wrong
 * projection, and no amount of shading would have rescued it.
 */
function pitchedRoof(
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation: number,
  base: [number, number, number],
  spread: number
): void {
  const corner = (i: number): { x: number; y: number } => {
    const angle = rotation + (i / sides) * Math.PI * 2;
    return { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius * 0.72 };
  };
  // The peak sits over the middle of the footprint, not above it.
  //
  // Offsetting it upwards to suggest height was the wrong lever and it sheared
  // every tent sideways — from directly overhead a pyramid is symmetrical, and
  // what says it is tall is the shading of its slopes and the shadow it throws,
  // not a displaced apex.
  for (let i = 0; i < sides; i++) {
    const a = corner(i);
    const b = corner(i + 1);
    const midX = (a.x + b.x) / 2 - x;
    const midY = (a.y + b.y) / 2 - y;
    ctx.fillStyle = mixShade(base, facetShade(midX, midY), spread);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(40,44,48,0.22)';
  ctx.lineWidth = Math.max(0.5, radius * 0.04);
  for (let i = 0; i < sides; i++) {
    const a = corner(i);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

/**
 * A cast shadow on the ground. `w` and `h` are radii, not extents — which is
 * worth saying because treating them as extents put a shadow under each marquee
 * as wide as the marquee itself, and a shadow that size reads as the object
 * floating over a dark pool rather than standing on the ground.
 */
function shade(x: number, y: number, w: number, h: number, alpha: number): void {
  ctx.fillStyle = `rgba(10,16,22,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x + SHADOW_X * w * 0.42, y + SHADOW_Y * w * 0.42, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** The rendered models, and which structure kind draws each. */
const MODEL_FOR: Partial<Record<StructureKind, string>> = {
  factory: 'factory',
  works: 'works',
  shed: 'shed',
  tower: 'water-tower',
  tanks: 'tank'
};

function drawStructure(structure: Structure): void {
  const p = project(structure.x, structure.y);
  const r = structure.reach * lateralUnit();
  const x = p.x;
  const y = p.y;

  // A rendered model is drawn at the size it actually is, not at the size the
  // spot happens to allow — that is the whole point of carrying the manifest.
  const model = MODEL_FOR[structure.kind];
  if (model) {
    const world = surfaceFor(activeTrackId);
    const width = modelWidth(model) * lateralUnit();
    if (drawArt(model, x, y, width, {
      shadow: 0.32,
      tint: world.artTint,
      tintStrength: 0.12,
      desaturate: 0
    })) return;
  }

  switch (structure.kind) {
    case 'dome': {
      // A rotunda from above, not a ball.
      //
      // It was a sphere gradient with a terminator down one side, which is what
      // a ball looks like lit from the front — and this camera looks straight
      // down, where a domed roof shows as concentric courses and radial ribs
      // meeting at a lantern. The light shifts the highlight off centre; it does
      // not cut the shape in half.
      shade(x, y + r * 0.26, r * 1.02, r * 0.5, 0.34);

      ctx.fillStyle = '#6E747C';
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      const courses = 3;
      for (let i = 0; i < courses; i++) {
        const t = 1 - i / courses;
        ctx.fillStyle = i % 2 === 0 ? '#D2D0C8' : '#A8A69E';
        ctx.beginPath();
        ctx.ellipse(x, y - r * 0.05 * i, r * 0.94 * t, r * 0.84 * t, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Six ribs, not twelve. At this size twelve of them come out as teeth and
      // the building reads as a gear; the ribs are meant to say "panelled roof",
      // and past about six they stop saying anything but "cog".
      ctx.strokeStyle = 'rgba(70,76,84,0.30)';
      ctx.lineWidth = Math.max(0.6, r * 0.04);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + 0.4;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * r * 0.24, y + Math.sin(angle) * r * 0.2);
        ctx.lineTo(x + Math.cos(angle) * r * 0.9, y + Math.sin(angle) * r * 0.8);
        ctx.stroke();
      }

      // Off-centre highlight, towards the light.
      const gloss = ctx.createRadialGradient(
        x - r * 0.38, y - r * 0.42, r * 0.05, x - r * 0.2, y - r * 0.2, r * 0.95
      );
      gloss.addColorStop(0, 'rgba(255,253,246,0.5)');
      gloss.addColorStop(1, 'rgba(255,253,246,0)');
      ctx.fillStyle = gloss;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.94, r * 0.84, 0, 0, Math.PI * 2);
      ctx.fill();

      // The lantern on top.
      ctx.fillStyle = '#8E9298';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.2, r * 0.19, r * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,252,244,0.7)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.04, y - r * 0.24, r * 0.11, r * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      // And the drum it stands on, a course you can see the top of.
      ctx.strokeStyle = 'rgba(52,58,64,0.5)';
      ctx.lineWidth = Math.max(1, r * 0.07);
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'hall': {
      const w = r * 1.85;
      const h = r * 1.05;
      shade(x, y + h * 0.2, w * 0.6, h * 0.5, 0.32);
      ctx.fillStyle = '#4E5660';
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
      // A ridged roof: three bays, lit along their tops.
      for (let i = 0; i < 3; i++) {
        const bay = h / 3;
        ctx.fillStyle = i % 2 === 0 ? '#5E6872' : '#545E68';
        ctx.fillRect(x - w / 2, y - h / 2 + i * bay, w, bay);
        ctx.fillStyle = 'rgba(238,244,250,0.16)';
        ctx.fillRect(x - w / 2, y - h / 2 + i * bay, w, bay * 0.22);
      }
      ctx.strokeStyle = 'rgba(14,20,26,0.5)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      break;
    }
    case 'tank': {
      // A cylinder, not a disc.
      //
      // Drawn as a top face with a wall below it rather than as one circle: from
      // this angle a tall tank shows its side, and without that side it reads as
      // a grey coin lying on the ground. The wall is the same trick the deck and
      // the islands use — extrude towards the camera, shade away from the light.
      const rr = r * 0.66;
      const wall = rr * 0.62;
      shade(x, y + wall, rr * 0.95, rr * 0.42, 0.34);

      const side = ctx.createLinearGradient(x - rr, y, x + rr, y);
      side.addColorStop(0, '#4E4A42');
      side.addColorStop(0.4, '#7A7468');
      side.addColorStop(1, '#3E3A34');
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(x - rr, y);
      ctx.lineTo(x - rr, y + wall);
      ctx.arc(x, y + wall, rr, Math.PI, 0, true);
      ctx.lineTo(x + rr, y);
      ctx.closePath();
      ctx.fill();

      const top = ctx.createLinearGradient(x - rr, y - rr, x + rr, y + rr);
      top.addColorStop(0, '#C2BCAE');
      top.addColorStop(0.55, '#9A9488');
      top.addColorStop(1, '#6E685E');
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.ellipse(x, y, rr, rr * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(228,222,208,0.45)';
      ctx.lineWidth = rr * 0.08;
      ctx.beginPath();
      ctx.ellipse(x, y, rr * 0.62, rr * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'lagoon': {
      // The saturated anchor.
      //
      // Every world came out monochrome — the beach was eleven shades of sand
      // and the works yard eleven of grey — and the reference's boards are held
      // together by one big high-chroma shape, the acid-green infield grass. One
      // strongly coloured area does more for a picture than any amount of
      // additional grey detail, and it has to be large: a small bright thing is
      // an accent, a large one is the thing the eye hangs the scene on.
      // Deep in the middle, shallow at the rim, and the sea's own tile over the
      // top of it. Without that tile it was a flat turquoise disc — a plastic
      // paddling pool, the same plain-fill failure as everything else, and the
      // more saturated the colour the more obvious it was.
      // An outline, not an ellipse.
      //
      // A perfect ellipse of water is a swimming pool however it is shaded, and
      // that is what made it look inert: nothing natural has a constant radius.
      // Three harmonics of wobble on the radius is enough to break it, and the
      // shape stays the same from run to run because the phases are fixed.
      const water = (scale: number): void => {
        ctx.beginPath();
        const steps = 44;
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * Math.PI * 2;
          const wobble = 1 + 0.10 * Math.sin(t * 3 + 0.7) + 0.06 * Math.sin(t * 5 + 2.1)
            + 0.04 * Math.sin(t * 7 + 4.3);
          const px = x + Math.cos(t) * r * 1.12 * scale * wobble;
          const py = y + Math.sin(t) * r * 0.76 * scale * wobble;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      };
      ctx.fillStyle = '#E6D6A8';
      water(1.16);
      ctx.fill();
      ctx.fillStyle = '#58C0C4';
      water(1);
      ctx.fill();
      ctx.fillStyle = '#27889A';
      water(0.82);
      ctx.fill();
      ctx.fillStyle = '#1C6C7E';
      water(0.58);
      ctx.fill();
      const ripples = groundTexture(ctx, 'water');
      if (ripples) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = ripples;
        water(1);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.6;
      water(1);
      ctx.stroke();
      break;
    }
    case 'lawn': {
      // Rim, fill, grain — the same three steps every other piece of ground on
      // this board gets. It went in as a flat green ellipse and read as a blob
      // of paint, which is the third time a plain fill has been laid between two
      // textured surfaces and failed the same way. Any piece of ground needs an
      // edge and a material; there is no exception for a small one.
      const lawn = (scale: number): void => {
        ctx.beginPath();
        ctx.ellipse(x, y, r * 1.25 * scale, r * 0.88 * scale, -0.15, 0, Math.PI * 2);
      };
      ctx.fillStyle = '#4E6B2C';
      lawn(1);
      ctx.fill();
      ctx.fillStyle = '#7FB23F';
      lawn(0.93);
      ctx.fill();
      const blades = groundTexture(ctx, 'grass');
      if (blades) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = blades;
        lawn(0.93);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'containers': {
      // Not a grid.
      //
      // Twelve equal rectangles in even rows read as a colour picker, which is
      // what they looked like — the regularity was meant to say "industry is set
      // out with a rule" and instead said "generated". A real stack is rows of
      // different lengths with gaps where one has been taken away, some doubled
      // up, all of them long boxes rather than squares.
      const hues = ['#B4573A', '#2F7E86', '#B8912F', '#4E6E3A', '#8A4A4A', '#3F6E74'];
      const rows = [
        [0, 3, 0], [0.06, 2, 1], [-0.04, 4, 0], [0.1, 2, 2]
      ];
      const unit = r * 0.46;
      rows.forEach(([skew, count, gapAt], row) => {
        for (let i = 0; i < count; i++) {
          if (i === gapAt) continue;
          const cx = x - r * 0.9 + i * unit * 1.06 + skew * r;
          const cy = y - r * 0.46 + row * unit * 0.42;
          const w = unit * 0.94;
          const h = unit * 0.34;
          const doubled = (row + i) % 3 === 0;
          ctx.fillStyle = 'rgba(10,14,18,0.32)';
          ctx.fillRect(cx + 2, cy + 2.5, w, h);
          if (doubled) {
            ctx.fillStyle = hues[(row * 3 + i + 2) % hues.length];
            ctx.fillRect(cx - 1.5, cy - 2, w, h);
          }
          ctx.fillStyle = hues[(row * 3 + i) % hues.length];
          ctx.fillRect(cx, cy, w, h);
          // Ribbing along the top face, which is what a container has.
          ctx.fillStyle = 'rgba(255,250,238,0.16)';
          ctx.fillRect(cx, cy, w, h * 0.26);
          ctx.fillStyle = 'rgba(10,14,18,0.18)';
          for (let rib = 1; rib < 4; rib++) ctx.fillRect(cx + (w / 4) * rib, cy, 0.8, h);
        }
      });
      break;
    }
    case 'pavilion': {
      // Set out in rows, and not touching.
      //
      // Five of them on a ring at 0.58 of the reach, each 0.42 across, overlapped
      // into a heap of crumpled paper. Marquees at a meeting are pitched in
      // lines with room to walk between them, and the gaps are most of what says
      // there are several rather than one lumpy thing.
      // Three, and drawn rather than built out of triangles.
      //
      // Five at 0.3 of the reach came out twelve pixels across, and at twelve
      // pixels the shading across four facets averages into one tone — what was
      // left was a square with an X in it, which is a napkin. The drawing has
      // the same four slopes and does not depend on me getting the contrast
      // right at any particular size.
      const size = r * 0.34;
      const rows = [
        [-1, -0.85], [0.05, -1.05], [-0.45, 0.5]
      ];
      const marquees = ['tent-red', 'tent-blue', 'tent-red'];
      rows.forEach(([cx, cy], i) => {
        const tx = x + cx * size * 2.1;
        const ty = y + cy * size * 2.1;
        const world = surfaceFor(activeTrackId);
        if (drawArt(marquees[i], tx, ty, size * 2.4, {
          shadow: 0.3,
          tint: world.artTint,
          tintStrength: world.artTintStrength
        })) return;
        shade(tx, ty + size * 0.42, size * 0.58, size * 0.26, 0.26);
        pitchedRoof(tx, ty, size, 4, Math.PI / 4, [236, 232, 222], 0.9);
      });
      break;
    }
  }
}

export function drawInfield(): void {
  const placed = structures();
  if (placed.length > 0) {
    drawServiceRoad(placed);
    for (const structure of [...placed].sort((a, b) => a.y - b.y)) drawStructure(structure);
  }

  // And whatever stands outside the circuit. No service road out here: these are
  // across the track from the facility, not part of it, and a road that ran to
  // them would have to cross the racing line.
  const outside = outfieldStructures();
  for (const structure of [...outside].sort((a, b) => a.y - b.y)) drawStructure(structure);
}
