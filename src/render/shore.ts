/**
 * The far shore.
 *
 * The board was a circuit floating in blue with no edge anywhere, and a blue
 * with no edge is not read as water — it is read as the colour behind the game.
 * Nothing in the frame said where the sea stopped, so nothing said it was a sea.
 *
 * This puts a coastline across the top, which is the one place it can go: the
 * plane recedes upwards, so the top of the frame is the far distance, and a
 * shoreline there is the same thing as a horizon. The camera's top margin was
 * widened to 104 to make room for it.
 *
 * Everything here is drawn in design space rather than through the camera. The
 * coast is not part of the circuit — it is the edge of the world the circuit
 * sits in — so it belongs to the frame, at the same size whatever the fit does
 * to the track. It goes in the cached layer with the rest of the scenery, which
 * is why it can afford this much detail: it is drawn once per circuit, not once
 * per frame.
 *
 * It is deliberately low contrast. Distance washes things out, the HUD sits in
 * front of part of it, and the one thing the player must never have to look
 * past is the traffic.
 */

import { ctx, DESIGN_W } from '../platform';

/**
 * Nominal waterline. The coast wanders either side of it.
 *
 * 54 put the whole skyline behind the HUD pills, which sit between y 8 and 44 —
 * the quay and the jetties read but the town above them was invisible. Pushing
 * the coast down to 66 costs a little of the open water between the shore and
 * the circuit and buys a band of roofline below the pills, which is the part
 * that says harbour.
 */
const COAST = 66;

/** Where the water meets the land at a given x. */
function coastY(x: number): number {
  return (
    COAST +
    Math.sin(x * 0.0195) * 6.5 +
    Math.sin(x * 0.0464 + 1.3) * 3.2 +
    Math.sin(x * 0.0107 + 0.6) * 4.5
  );
}

/** The coastline as a polyline, left to right. */
function coastline(): Array<{ x: number; y: number }> {
  const points = [];
  for (let x = -6; x <= DESIGN_W + 6; x += 6) points.push({ x, y: coastY(x) });
  return points;
}

/**
 * [x, width, height, kind] — kind 0 warehouse, 1 gabled shed, 2 silo block.
 *
 * Hand-placed rather than scattered: this is a skyline, and a skyline is a
 * rhythm. They are spaced so the gaps fall roughly where the HUD pills sit.
 */
const BUILDINGS: Array<[number, number, number, number]> = [
  [-8, 46, 30, 0],
  [44, 26, 20, 1],
  [74, 34, 38, 2],
  [116, 40, 24, 0],
  [162, 22, 32, 1],
  [190, 52, 28, 0],
  [248, 30, 36, 2],
  [284, 24, 22, 1],
  [312, 44, 30, 0],
  [360, 38, 26, 0]
];

/** [x, reach] — timber jetties running out into the water. */
const JETTIES: Array<[number, number]> = [[36, 26], [148, 20], [268, 30], [344, 18]];

/** Three cool greys. Neighbouring buildings must not share one. */
const BUILDING_TONES = ['#59636E', '#4C5660', '#646E77'];

/** Dockside containers: [x, y offset from the coast, width, colour]. */
const CONTAINERS: Array<[number, number, number, string]> = [
  [20, -14, 13, '#9C5442'], [34, -14, 13, '#3F6E74'], [20, -21, 13, '#A8843C'],
  [130, -13, 12, '#3F6E74'], [143, -13, 12, '#9C5442'],
  [296, -14, 13, '#A8843C'], [310, -14, 13, '#5A6E44'], [303, -21, 13, '#9C5442'],
  [196, -12, 11, '#3F6E74'], [208, -12, 11, '#A8843C']
];

function drawContainers(): void {
  for (const [x, dy, width, colour] of CONTAINERS) {
    const y = coastY(x + width / 2) - 8 + dy;
    ctx.fillStyle = 'rgba(16,26,36,0.30)';
    ctx.fillRect(x + 2, y + 2, width, 6);
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, width, 6);
    ctx.fillStyle = 'rgba(255,250,238,0.20)';
    ctx.fillRect(x, y, width, 1.4);
  }
}

function drawBuilding(x: number, width: number, height: number, kind: number, index: number): void {
  const base = coastY(x + width / 2) - 6;
  const top = base - height;

  // Cast shadow on the ground, down-light like everything else.
  ctx.fillStyle = 'rgba(18,30,42,0.28)';
  ctx.fillRect(x + 3, base - 3, width, 5);

  // Buildings are cooler and darker than the ground they stand on. When they
  // were the same grey as the land the skyline came out as one smear: at this
  // size and behind this much haze, silhouette is the only thing that carries,
  // and silhouette needs a tonal step to exist at all.
  ctx.fillStyle = BUILDING_TONES[index % BUILDING_TONES.length];
  ctx.fillRect(x, top, width, height);

  // Roof, a shade lighter than the wall, so the box has a top.
  ctx.fillStyle = 'rgba(186,198,206,0.30)';
  ctx.fillRect(x, top, width, Math.min(6, height * 0.3));

  // Near face: the wall the camera can see, which is the one at the bottom.
  ctx.fillStyle = 'rgba(28,40,52,0.34)';
  ctx.fillRect(x, base - 5, width, 5);

  // Lit top edge.
  ctx.fillStyle = 'rgba(255,247,228,0.22)';
  ctx.fillRect(x, top, width, 2);

  if (kind === 1) {
    // A gable, which is just a roof with a different silhouette from this angle.
    ctx.fillStyle = '#6B7480';
    ctx.beginPath();
    ctx.moveTo(x - 2, top + 2);
    ctx.lineTo(x + width / 2, top - 6);
    ctx.lineTo(x + width + 2, top + 2);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 2) {
    // Silos: three cylinders, so the skyline is not all boxes.
    for (let i = 0; i < 3; i++) {
      const cx = x + 6 + i * ((width - 12) / 2);
      ctx.fillStyle = '#909AA2';
      ctx.beginPath();
      ctx.arc(cx, top + 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,250,236,0.18)';
      ctx.beginPath();
      ctx.arc(cx - 1.4, top + 2.6, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Window bands, the cheapest thing that says "occupied".
    ctx.fillStyle = 'rgba(226,238,246,0.16)';
    for (let i = 0; i < 3; i++) {
      const wy = top + 6 + i * 7;
      if (wy > base - 8) break;
      ctx.fillRect(x + 3, wy, width - 6, 2.2);
    }
  }
}

/** The dockside gantry. One is a landmark; two would be a pattern. */
function drawCrane(x: number): void {
  const base = coastY(x) - 4;
  ctx.strokeStyle = '#9AA3A8';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9, base);
  ctx.lineTo(x - 4, base - 30);
  ctx.moveTo(x + 9, base);
  ctx.lineTo(x + 4, base - 30);
  ctx.stroke();

  ctx.fillStyle = '#C8A44E';
  ctx.fillRect(x - 22, base - 36, 46, 5);
  ctx.strokeStyle = 'rgba(200,164,78,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x - 16, base - 31);
  ctx.lineTo(x - 16, base - 20);
  ctx.stroke();
}

function drawJetty(x: number, reach: number): void {
  const base = coastY(x);
  // The deck has to be wide enough to read as something you could walk on. At
  // 10 units with piles standing 2 units proud on each side, the whole thing
  // came out as one fat post in the water.
  const HALF = 7;
  ctx.fillStyle = 'rgba(16,28,40,0.32)';
  ctx.fillRect(x - HALF + 2, base + 3, HALF * 2, reach);
  ctx.fillStyle = '#9A8968';
  ctx.fillRect(x - HALF, base, HALF * 2, reach);

  // Planking, across the deck.
  ctx.fillStyle = 'rgba(58,48,34,0.30)';
  for (let py = base + 3; py < base + reach; py += 4) ctx.fillRect(x - HALF, py, HALF * 2, 1);
  ctx.fillStyle = 'rgba(255,246,224,0.22)';
  ctx.fillRect(x - HALF, base, HALF * 2, 1.6);

  // Piles under the outer corners, and the near end dropped into the water.
  ctx.fillStyle = '#443B2E';
  ctx.fillRect(x - HALF, base + reach, HALF * 2, 2.2);
  for (let i = 1; i <= 2; i++) {
    const py = base + (reach / 2.4) * i;
    ctx.fillRect(x - HALF - 1.6, py, 1.6, 2.8);
    ctx.fillRect(x + HALF, py, 1.6, 2.8);
  }
}

export function drawShore(): void {
  const coast = coastline();

  // The land itself, from the top of the frame down to the waterline.
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  for (const point of coast) ctx.lineTo(point.x, point.y);
  ctx.lineTo(DESIGN_W + 6, -4);
  ctx.closePath();
  ctx.fillStyle = '#6C7368';
  ctx.fill();

  ctx.save();
  ctx.clip();
  BUILDINGS.forEach(([x, width, height, kind], index) => drawBuilding(x, width, height, kind, index));
  drawCrane(224);
  drawContainers();
  ctx.restore();

  // The quay wall, and the foam at its foot. Same two courses the deck and the
  // islands get, for the same reason: an edge with no thickness is a drawing.
  ctx.beginPath();
  for (let i = 0; i < coast.length; i++) {
    const point = coast[i];
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  for (let i = coast.length - 1; i >= 0; i--) ctx.lineTo(coast[i].x, coast[i].y + 6);
  ctx.closePath();
  ctx.fillStyle = '#3A4550';
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < coast.length; i++) {
    const point = coast[i];
    if (i === 0) ctx.moveTo(point.x, point.y + 6);
    else ctx.lineTo(point.x, point.y + 6);
  }
  ctx.strokeStyle = 'rgba(232,244,248,0.55)';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.stroke();

  for (const [x, reach] of JETTIES) drawJetty(x, reach);

  // Distance haze, strongest at the top of the frame. This is what puts the
  // shore behind the water rather than on top of it.
  const haze = ctx.createLinearGradient(0, 0, 0, COAST + 16);
  haze.addColorStop(0, 'rgba(132,162,182,0.26)');
  haze.addColorStop(0.7, 'rgba(132,162,182,0.09)');
  haze.addColorStop(1, 'rgba(126,156,176,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, DESIGN_W, COAST + 16);
}
