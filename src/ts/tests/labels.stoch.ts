
import * as fc from 'fast-check';
import { labels } from '../labels.js';

describe('labels: stochastic invariants', () => {

  /**
   * Random index sampling never produces a malformed row. Catches subtle
   * issues that would surface only on certain entries (e.g. a non-hex
   * color buried at index 173 that a deterministic loop might mask if it
   * short-circuits early in another test).
   */
  test('stoch: a randomly chosen label is well-formed', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: labels.length - 1 }), (i: number) => {
        const l = labels[i];
        expect(l).toBeDefined();
        expect(typeof l!.name).toBe('string');
        expect(/^#[0-9a-f]{6}$/i.test(l!.color)).toBe(true);
        expect(typeof l!.description).toBe('string');
      })
    );
  });

  /**
   * No two randomly chosen distinct indices share a name. (Sanity: the
   * uniqueness invariant in labels.spec.ts is exhaustive; this is the
   * fuzzing companion.)
   */
  test('stoch: distinct indices have distinct names', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: labels.length - 1 }),
        fc.integer({ min: 0, max: labels.length - 1 }),
        (a: number, b: number) => {
          if (a === b) { return; }
          expect(labels[a]!.name).not.toBe(labels[b]!.name);
        }
      )
    );
  });

});
