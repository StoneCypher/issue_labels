/**
 * Unit tests for the clean step's deletion plan (issue #18).
 */

import { describe, it, expect } from 'vitest';
import {
  DOCS_DIR,
  DOCS_PRESERVE,
  TOP_LEVEL_WIPES,
  LEAVES_TO_CREATE,
  selectDocsEntriesToRemove,
} from '../../build_js/clean_plan.js';

/** The top-level entries of a freshly built docs/ plus the visualizer. */
const BUILT_DOCS = [
  '.nojekyll', 'README.md', 'bundle_flamegraph.png', 'bundle_network.png',
  'bundle_sunburst.png', 'bundle_treemap.png', 'colors_3d.html', 'docs',
  'favicon.png', 'index.css', 'index.html', 'index.iife.js',
  'index.iife.js.map', 'three', 'dist', 'colors_trajectory.json',
];

describe('clean_plan', () => {

  it('preserves the 3D visualizer files', () => {
    expect([...DOCS_PRESERVE].sort()).toEqual(['colors_3d.html', 'three']);
    const doomed = selectDocsEntriesToRemove(BUILT_DOCS);
    expect(doomed).not.toContain('colors_3d.html');
    expect(doomed).not.toContain('three');
  });

  it('still selects every other docs entry, in order', () => {
    expect(selectDocsEntriesToRemove(BUILT_DOCS)).toEqual(
      BUILT_DOCS.filter(n => n !== 'colors_3d.html' && n !== 'three')
    );
  });

  it('does not shield look-alike names', () => {
    const lookAlikes = ['colors_3d.html.bak', 'three-old', 'Three', 'colors_3d', 'three.js'];
    expect(selectDocsEntriesToRemove(lookAlikes)).toEqual(lookAlikes);
  });

  it('handles an empty or absent docs directory', () => {
    expect(selectDocsEntriesToRemove([])).toEqual([]);
  });

  it('honours a caller-supplied preserve list', () => {
    expect(selectDocsEntriesToRemove(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
    expect(selectDocsEntriesToRemove(['a', 'colors_3d.html'], [])).toEqual(['a', 'colors_3d.html']);
  });

  it('does not wipe docs wholesale but still recreates its build leaves', () => {
    expect(DOCS_DIR).toBe('docs');
    expect(TOP_LEVEL_WIPES).not.toContain('docs');
    expect([...TOP_LEVEL_WIPES].sort()).toEqual(
      ['build', 'coverage-typedoc', 'dist', 'src/ts/generated_code']
    );
    expect(LEAVES_TO_CREATE).toContain('docs/docs');
    expect(LEAVES_TO_CREATE).toContain('docs/dist');
  });

});
