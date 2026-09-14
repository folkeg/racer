// Bundles src/main.ts into the game.js that WeChat and index.html actually load.
//
// The mini game runtime expects a single plain script at the project root, so the
// output format is a self-contained IIFE. Its exports are attached to a global
// (HarborLoop) purely so tests and the devtools console can inspect state.

import { build, context } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const watch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/main.ts'],
  outfile: 'game.js',
  bundle: true,
  format: 'iife',
  globalName: 'HarborLoop',
  target: 'es2017',
  charset: 'utf8',
  legalComments: 'none',
  banner: {
    js: '// GENERATED FILE - do not edit. Source lives in src/; rebuild with `npm run build`.'
  }
};

/**
 * Stamps the bundle's hash into index.html's script tag.
 *
 * Browsers cache game.js hard, and the local preview is served over plain HTTP
 * with no cache headers, so "I rebuilt it and nothing changed" has been a
 * recurring and expensive confusion — several rounds of this project were spent
 * looking at a stale bundle and drawing conclusions from it. A query string that
 * changes with the contents makes that impossible: a rebuilt bundle is a new URL.
 *
 * WeChat loads game.js from the package by its real path and never sees this, so
 * it costs nothing there.
 */
async function stampIndex() {
  const html = await readFile('index.html', 'utf8');
  const hash = createHash('sha1').update(await readFile('game.js')).digest('hex').slice(0, 8);
  const stamped = html.replace(
    /<script src="game\.js(?:\?[^"]*)?"><\/script>/,
    `<script src="game.js?b=${hash}"></script>`
  );
  if (stamped !== html) await writeFile('index.html', stamped);
  return hash;
}

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching src/ -> game.js');
} else {
  await build(options);
  console.log(`built game.js (${await stampIndex()})`);
}
