/**
 * export_labels_ts.cjs -- regenerate src/ts/labels.ts from the canonical
 * taxonomy at src/data/standard_issue_label.json.
 *
 * standard_issue_label.json is the INTERNAL authority. Its `color` is the raw
 * output of the force-directed physics sim (assign_label_colors.cjs) -- the
 * FIRST link in the chain -- and deliberately does NOT reflect the override
 * fields layered on top of it. labels.ts is the EXTERNAL authority: the
 * published projection that ships only { name, color, description }, where
 * `color` is the RESOLVED color after applying those overrides. The internal
 * file isn't shipped because outsiders would misread the raw physics colors
 * and the override bookkeeping.
 *
 * Resolution precedence (see assign_label_colors.cjs:106-115 -- keep in sync):
 *   exaggerated  (full hex) — a brand color deliberately nudged out of the
 *                muted-center cube so it satisfies the residency invariant;
 *                supersedes brand_color, which then survives only as a record
 *                of where the exaggeration came from
 *   brand_color  (full hex) — logo / brand identity (published when no
 *                exaggeration is needed, i.e. the brand color already clears
 *                the center)
 *   pin          (per-channel 0..255) — gradient anchors; channels the pin
 *                omits fall through to the physics value
 *   association  (full hex) — looser semantic cue
 *   saving_pin   (full hex) — sim-rescue anchor for a label that drifted into
 *                the muted center
 *   (none)       — the raw physics color ships as-is
 *
 * This rewrites ONLY the data rows, preserving the file's hand-maintained
 * header docblock and the `Label` interface verbatim.
 *
 * Usage: node src/build_js/export_labels_ts.cjs   (or: npm run export:labels)
 */

const fs   = require('fs');
const path = require('path');

const LABEL_FILE = path.join(__dirname, '..', 'data', 'standard_issue_label.json');
const TS_FILE    = path.join(__dirname, '..', 'ts', 'labels.ts');

/** Parse a #rrggbb string into an [r, g, b] triple of 0..255 ints. */
function hexToRgb(h) {
  const s = h.replace(/^#/, '');
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
}

/** Format an [r, g, b] triple (0..255, clamped) as a lowercase #rrggbb. */
function rgbToHex(rgb) {
  return '#' + rgb
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Resolve a label's PUBLISHED color: the override chain applied over the raw
 * physics `color`, first match winning. Full-hex overrides replace every
 * channel; a per-channel `pin` overrides only the channels it names and lets
 * the rest fall through to the physics value. With no override the physics
 * color ships unchanged. Output is always a normalized lowercase #rrggbb.
 */
function resolveColor(l) {
  if (l.exaggerated) { return rgbToHex(hexToRgb(l.exaggerated)); }
  if (l.brand_color) { return rgbToHex(hexToRgb(l.brand_color)); }
  if (l.pin) {
    const [r, g, b] = hexToRgb(l.color);
    return rgbToHex([
      l.pin.r !== undefined ? l.pin.r : r,
      l.pin.g !== undefined ? l.pin.g : g,
      l.pin.b !== undefined ? l.pin.b : b,
    ]);
  }
  if (l.association) { return rgbToHex(hexToRgb(l.association)); }
  if (l.saving_pin)  { return rgbToHex(hexToRgb(l.saving_pin)); }
  return rgbToHex(hexToRgb(l.color));
}

const labels   = JSON.parse(fs.readFileSync(LABEL_FILE, 'utf8'));
const existing = fs.readFileSync(TS_FILE, 'utf8');

// every published row needs a string name/description plus a physics color to
// resolve against; refuse rather than emit a row that won't type-check
const bad = labels.filter(l =>
  typeof l.name        !== 'string' ||
  typeof l.color       !== 'string' ||
  typeof l.description !== 'string');
if (bad.length) {
  console.error('refusing to export:', bad.length,
    'label(s) missing a string name/color/description');
  console.error('  e.g.', bad.slice(0, 5).map(l => l.name ?? '(unnamed)').join(', '));
  process.exit(1);
}

// preserve everything up to and including the array opener; replace the body
const openerRe = /^export const labels: readonly Label\[\] = \[\s*$/m;
const m = openerRe.exec(existing);
if (!m) {
  console.error('could not find the `export const labels` array opener in', TS_FILE);
  process.exit(1);
}
const header = existing.slice(0, m.index + m[0].length);

// one row per label; JSON.stringify gives correctly-escaped double-quoted
// values, and the last row carries no trailing comma
const rows = labels.map(l =>
  `  { name: ${JSON.stringify(l.name)}, color: ${JSON.stringify(resolveColor(l))}, `
  + `description: ${JSON.stringify(l.description)} }`);

fs.writeFileSync(TS_FILE, header + '\n' + rows.join(',\n') + '\n];\n');

console.log('exported  :', labels.length, 'labels ->', path.relative(process.cwd(), TS_FILE));
console.log('distinct  :', new Set(labels.map(resolveColor)).size, 'resolved colors');
