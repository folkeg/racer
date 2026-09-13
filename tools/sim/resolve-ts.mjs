/**
 * ESM resolve hook: lets Node import the game's TypeScript source directly.
 *
 * The source uses extensionless relative specifiers ('./feel', '../tracks'),
 * which esbuild resolves at bundle time. Node does not, so this maps them onto
 * the .ts file or the directory's index.ts. Combined with Node's built-in type
 * stripping it means the simulator drives the real modules rather than a build
 * artefact, so a change in src/ is testable without a bundler.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/i.test(specifier) && context.parentURL) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    for (const candidate of [`${base}.ts`, `${base}/index.ts`]) {
      if (existsSync(candidate)) return next(pathToFileURL(candidate).href, context);
    }
  }
  return next(specifier, context);
}
