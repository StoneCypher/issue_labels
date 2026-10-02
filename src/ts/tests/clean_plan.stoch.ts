/**
 * Stochastic property tests for the clean step's docs deletion plan.
 *
 * Over random docs listings and preserve lists, the selection must keep
 * exactly the preserved names, delete everything else, and keep order.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DOCS_PRESERVE, selectDocsEntriesToRemove } from '../../build_js/clean_plan.js';

/** Plausible entry names, biased to include the preserved ones. */
const entryName = fc.oneof(
  fc.constantFrom(...DOCS_PRESERVE),
  fc.string({ minLength: 1, maxLength: 12 }),
);

describe('selectDocsEntriesToRemove (stochastic)', () => {

  it('never selects a preserved name under the default preserve list', () => {
    fc.assert(fc.property(fc.array(entryName), entries => {
      const doomed = selectDocsEntriesToRemove(entries);
      for (const kept of DOCS_PRESERVE) expect(doomed).not.toContain(kept);
    }));
  });

  it('selects exactly the non-preserved entries, in order', () => {
    fc.assert(fc.property(fc.array(entryName), fc.array(entryName), (entries, preserve) => {
      const doomed = selectDocsEntriesToRemove(entries, preserve);
      const keep = new Set(preserve);
      const expectedLen = entries.filter(e => !keep.has(e)).length;
      expect(doomed.length).toBe(expectedLen);
      let cursor = 0;
      for (const d of doomed) {
        expect(keep.has(d)).toBe(false);
        cursor = entries.indexOf(d, cursor) + 1;
        expect(cursor).toBeGreaterThan(0);
      }
    }));
  });

  it('does not mutate its input', () => {
    fc.assert(fc.property(fc.array(entryName), entries => {
      const before = [...entries];
      selectDocsEntriesToRemove(entries);
      expect(entries).toEqual(before);
    }));
  });

});
