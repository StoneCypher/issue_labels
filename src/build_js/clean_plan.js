/**
 * Pure planning data and helpers for the `clean` build step.
 *
 * Kept separate from clean.js so the decision of what to delete can be
 * unit-tested without touching the filesystem (importing clean.js runs it).
 *
 * @see ./clean.js
 */

/**
 * Directories wiped wholesale, relative to the project root.
 *
 * `docs` is deliberately absent: it holds tracked, hand-run artifacts that
 * the build does not regenerate, so it is cleaned entry by entry instead.
 *
 * @see DOCS_DIR
 */
export const TOP_LEVEL_WIPES = Object.freeze([
  'src/ts/generated_code',
  'build',
  'dist',
  'coverage-typedoc',
]);

/** The docs output directory, relative to the project root. */
export const DOCS_DIR = 'docs';

/**
 * Top-level entries of `docs/` that clean must never delete.
 *
 * These are the 3D color visualizer: `colors_3d.html` and the three.js
 * modules it imports from `three/`. Both are tracked in git and produced
 * only by the hand-run `npm run viz` / `npm run viz:html`, not by the
 * build, so deleting them left the working tree dirty after every build
 * (issue #18).
 */
export const DOCS_PRESERVE = Object.freeze([
  'colors_3d.html',
  'three',
]);

/**
 * Leaf directories recreated after wiping, relative to the project root.
 * `recursive: true` creates intermediate parents such as `build/rollup`.
 */
export const LEAVES_TO_CREATE = Object.freeze([
  'src/ts/generated_code',
  'build/rollup/visualizations',
  'dist',
  'docs/dist',
  'docs/docs',
  'coverage-typedoc',
]);

/** Root-level files removed by clean (bundle visualizer PNGs). */
export const FILES_TO_REMOVE = Object.freeze([
  'bundle_sunburst.png',
  'bundle_treemap.png',
  'bundle_network.png',
  'bundle_flamegraph.png',
]);

/**
 * Choose which top-level entries of `docs/` clean should delete.
 *
 * Every entry is selected except those named in `preserve`. Matching is by
 * exact entry name, so a preserved name never shields a look-alike such as
 * `colors_3d.html.bak` or `three-old`.
 *
 * @param {readonly string[]} entries - Names directly inside `docs/`, as
 *   returned by `readdir` (no path separators).
 * @param {readonly string[]} [preserve=DOCS_PRESERVE] - Entry names to keep.
 * @returns {string[]} The entries to delete, in their original order.
 *
 * @example
 *   selectDocsEntriesToRemove(['index.html', 'three', 'docs', 'colors_3d.html']);
 *   // => ['index.html', 'docs']
 *
 * @see DOCS_PRESERVE
 */
export function selectDocsEntriesToRemove(entries, preserve = DOCS_PRESERVE) {
  const keep = new Set(preserve);
  return entries.filter(name => !keep.has(name));
}
