/**
 * Sweeps how often traffic changes lane for no reason.
 *
 * The hypothesis being tested is not "fewer lane changes is nicer" — that is a
 * taste call the sim cannot make. It is that unmotivated cut-ins are *noise*:
 * they end runs for reasons the player could not have read, so they compress
 * the gap between a good driver and a bad one. If that is right, turning the
 * wander down should spread the persona ladder apart, not just raise it.
 */
import { createGame } from './env.mjs';
import { playBatch } from './play.mjs';
import { PERSONAS } from './bot.mjs';
import { DIFFICULTY_PROFILES } from '../../src/difficulty.ts';

const TRIALS = Number(process.env.TRIALS || 50);
const LADDER = ['novice', 'average', 'expert'];
const api = await createGame();

console.log(`COMBO RACERS · ${TRIALS} 次/格 · 敌车"无理由变道"概率扫描\n`);
console.log('乱窜概率   新手中位  中等中位  高手中位   高手÷新手   平均撞车(中等)');
console.log('─'.repeat(72));

for (const chance of [0.34, 0.20, 0.10, 0.04, 0]) {
  DIFFICULTY_PROFILES.master.aiWanderChance = chance;
  const medians = {};
  let averageCrashes = 0;
  for (const key of LADDER) {
    const result = playBatch(api, { modeId: 'combo-racers', persona: key, trials: TRIALS });
    medians[key] = result.score.median;
    if (key === 'average') averageCrashes = result.crashes;
  }
  const spread = medians.expert / Math.max(1, medians.novice);
  console.log(
    `${String(chance).padEnd(9)} ${String(medians.novice).padStart(8)} ${String(medians.average).padStart(9)} ` +
    `${String(medians.expert).padStart(9)} ${spread.toFixed(2).padStart(10)} ${averageCrashes.toFixed(1).padStart(15)}`
  );
}

console.log('\n「高手÷新手」越大，说明结果越取决于技术而不是运气。');
DIFFICULTY_PROFILES.master.aiWanderChance = 0.34;
