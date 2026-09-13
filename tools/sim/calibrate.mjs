/**
 * Calibrates the failure model against a target a human authored.
 *
 * COMBO RACERS ships star thresholds of [12, 26, 40]. Those numbers were set by
 * playing the game, so they are the closest thing this project has to ground
 * truth about what a real player scores: 12 is a first attempt, 26 is competent,
 * 40 is the mode being played well.
 *
 * If the personas land near that ladder, the error model is roughly the right
 * size and its *relative* verdicts on other configs can be trusted. If they do
 * not, nothing downstream of it means anything, so this runs first.
 *
 *   node --experimental-strip-types --import ./tools/sim/register.mjs tools/sim/calibrate.mjs
 */

import { createGame } from './env.mjs';
import { playBatch, PERSONA_ORDER } from './play.mjs';
import { PERSONAS } from './bot.mjs';

const TRIALS = Number(process.env.TRIALS || 30);
const STARS = { 1: 12, 2: 26, 3: 40 };

const api = await createGame();

console.log(`COMBO RACERS · ${TRIALS} 次/人格 · 星标 1★=${STARS[1]} 2★=${STARS[2]} 3★=${STARS[3]}\n`);
console.log('人格      最佳连击 中位  p25   p75   最好  撞车  超车  用时');
console.log('─'.repeat(66));

const rows = [];
for (const key of PERSONA_ORDER) {
  const result = playBatch(api, { modeId: 'combo-racers', persona: key, trials: TRIALS });
  rows.push({ key, result });
  const s = result.score;
  console.log(
    `${PERSONAS[key].label.padEnd(6)}  ${s.mean.toFixed(1).padStart(8)} ${s.median.toFixed(0).padStart(5)} ` +
    `${s.p25.toFixed(0).padStart(5)} ${s.p75.toFixed(0).padStart(5)} ${s.max.toFixed(0).padStart(5)} ` +
    `${result.crashes.toFixed(1).padStart(5)} ${result.passes.toFixed(0).padStart(5)} ` +
    `${result.runs[0].elapsed.toFixed(0).padStart(5)}`
  );
}

console.log('\n判定（中位数落在哪一档星）:');
for (const { key, result } of rows) {
  const median = result.score.median;
  let tier = '不到 1★';
  if (median >= STARS[3]) tier = '3★';
  else if (median >= STARS[2]) tier = '2★';
  else if (median >= STARS[1]) tier = '1★';
  console.log(`  ${PERSONAS[key].label.padEnd(6)} 中位 ${median.toFixed(0).padStart(3)} → ${tier}`);
}

console.log('\n期望: 新手≈不到1★~1★, 中等≈2★, 高手≈3★, 完美 应明显超过 3★');
