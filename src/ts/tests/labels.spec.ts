
import { labels, type Label } from '../labels.js';

describe('labels: shape and integrity', () => {

  test('the array exists and is non-empty', () => {
    expect(Array.isArray(labels)).toBe(true);
    expect(labels.length).toBeGreaterThan(0);
  });

  test('every row has the three required string fields', () => {
    for (const l of labels) {
      expect(typeof l.name).toBe('string');
      expect(typeof l.color).toBe('string');
      expect(typeof l.description).toBe('string');
      expect(l.name.length).toBeGreaterThan(0);
      expect(l.description.length).toBeGreaterThan(0);
    }
  });

  test('every color is a valid #rrggbb hex string', () => {
    const re = /^#[0-9a-f]{6}$/i;
    for (const l of labels) {
      expect(l.color).toMatch(re);
    }
  });

  test('label names are unique', () => {
    const seen = new Set<string>();
    for (const l of labels) {
      expect(seen.has(l.name)).toBe(false);
      seen.add(l.name);
    }
    expect(seen.size).toBe(labels.length);
  });

  test('Label type accepts a well-formed literal', () => {
    const sample: Label = { name: 'x', color: '#000000', description: 'y' };
    expect(sample.name).toBe('x');
  });

});


describe('labels: cube residency invariant', () => {

  /**
   * Every label color lives outside the 25%..75% inner cube, by design
   * (the visualizer reserves the muted center as the "no info" zone).
   * If this ever fails, a label has been added or updated whose color
   * landed in the muted middle without an exaggeration / saving_pin push.
   */
  test('no label color sits inside the 25%..75% inner cube', () => {
    const inside: string[] = [];
    for (const l of labels) {
      const r = parseInt(l.color.slice(1, 3), 16);
      const g = parseInt(l.color.slice(3, 5), 16);
      const b = parseInt(l.color.slice(5, 7), 16);
      // inner cube spans [64, 191] inclusive in 0..255 space
      // (boundaries 0.25 * 255 = 63.75 and 0.75 * 255 = 191.25)
      if (r >= 64 && r <= 191 && g >= 64 && g <= 191 && b >= 64 && b <= 191) {
        inside.push(`${l.name} @ ${l.color}`);
      }
    }
    expect(inside).toEqual([]);
  });

});
