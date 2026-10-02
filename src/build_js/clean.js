/**
 * Wipes and recreates all build output directories in parallel.
 *
 * Replaces the previous npm `clean` script's serial `cd && rimraf && mkdir`
 * chain, which on Windows ran through a shell-emulation layer that made
 * each `cd` and `mkdir` slow and the script hard to read.
 *
 * The operation runs in three phases:
 *   1. Wipe the top-level output dirs in parallel (they are siblings, no
 *      nesting), and empty `docs/` except the tracked 3D visualizer
 *      (`docs/colors_3d.html`, `docs/three/`), which the build does not
 *      regenerate (issue #18)
 *   2. Re-create the required leaves in parallel (with recursive:true so
 *      intermediate parents like `build/rollup` are created)
 *   3. Remove the four root-level bundle PNGs in parallel
 *
 * Splitting wipe from create avoids the race where one parallel task
 * wipes a parent while another tries to create its child.
 *
 * @example
 *   // Invoked by the `clean` npm script:
 *   node src/build_js/clean.js
 *   // Wipes src/ts/generated_code, build, dist, coverage-typedoc, and all
 *   // of docs except colors_3d.html and three/, recreates the required
 *   // subdirs, and removes bundle_*.png at root.
 *
 * @see ./clean_plan.js
 */

import { rm, mkdir, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  TOP_LEVEL_WIPES,
  DOCS_DIR,
  LEAVES_TO_CREATE,
  FILES_TO_REMOVE,
  selectDocsEntriesToRemove,
} from './clean_plan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

const abs = relPath => join(PROJECT_ROOT, relPath);

/**
 * List the top-level entry names of a directory, or none if it is absent.
 *
 * @param {string} dir - Absolute directory path.
 * @returns {Promise<string[]>} Entry names; empty when `dir` does not exist.
 */
async function listOrEmpty(dir) {
  try {
    return await readdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/**
 * Delete every top-level entry of `docs/` except the preserved visualizer.
 *
 * @returns {Promise<void>} Resolves once all selected entries are removed.
 */
async function cleanDocs() {
  const docsAbs = abs(DOCS_DIR);
  const doomed = selectDocsEntriesToRemove(await listOrEmpty(docsAbs));
  await Promise.all(doomed.map(name => rm(join(docsAbs, name), { recursive: true, force: true })));
}

async function main() {
  await Promise.all([
    ...TOP_LEVEL_WIPES.map(p => rm(abs(p), { recursive: true, force: true })),
    cleanDocs(),
  ]);
  await Promise.all(LEAVES_TO_CREATE.map(p => mkdir(abs(p), { recursive: true })));
  await Promise.all(FILES_TO_REMOVE.map(p => rm(abs(p), { force: true })));
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
