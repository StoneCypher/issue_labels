/**
 * bake_colors.cjs -- apply a name -> hex color map (exported from the in-
 * browser viz via its "export colors" button) back onto the source taxonomy
 * at standard_issue_label.json.
 *
 * Usage: node bake_colors.cjs path/to/exported.json
 *
 * The input is the JSON the export button writes to the clipboard:
 *   { "Bug": "#ff008b", "Refactor": "#ff97ff", ... }
 *
 * After baking, refresh the HTML with `npm run viz:html` (or directly with
 * `node src/build_js/visualize_colors_3d.cjs`). Do NOT run `npm run viz` --
 * that re-runs the Node baker, which would overwrite the colors just written
 * here.
 */

const fs   = require('fs');
const path = require('path');
const LABEL_FILE = path.join(__dirname, '..', 'data', 'standard_issue_label.json');

const inPath = process.argv[2];
if (!inPath) {
  console.error('usage: node bake_colors.cjs path/to/exported.json');
  process.exit(1);
}

const map = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const labels = JSON.parse(fs.readFileSync(LABEL_FILE, 'utf8'));

let updated = 0, unchanged = 0;
const missing = [];
for (const l of labels) {
  const c = map[l.name];
  if (!c) { missing.push(l.name); continue; }
  if (l.color === c) { unchanged++; continue; }
  l.color = c;
  updated++;
}
const known = new Set(labels.map(l => l.name));
const extra = Object.keys(map).filter(n => !known.has(n));

const ser = o => '  { ' + Object.entries(o)
  .map(([k, v]) => JSON.stringify(k) + ': ' + JSON.stringify(v)).join(', ') + ' }';
const lines = labels.map(l => {
  const o = { name: l.name, category: l.category };
  if (l.subcategory)   { o.subcategory = l.subcategory; }
  o.description = l.description;
  if (l.color)         { o.color = l.color; }
  if (l.exempt)        { o.exempt = l.exempt; }
  if (l.exaggerated)   { o.exaggerated = l.exaggerated; }
  if (l.pin)           { o.pin = l.pin; }
  if (l.brand_color)   { o.brand_color = l.brand_color; }
  if (l.association)   { o.association = l.association; }
  if (l.saving_pin)    { o.saving_pin = l.saving_pin; }
  if (l.core)          { o.core = l.core; }
  if (l.constellation) { o.constellation = l.constellation; }
  return ser(o);
});
fs.writeFileSync(LABEL_FILE, '[\n' + lines.join(',\n') + '\n]\n');

const truncate = (xs, n) => xs.length <= n ? xs.join(', ')
  : xs.slice(0, n).join(', ') + ', ...(+' + (xs.length - n) + ')';

console.log('updated   :', updated);
console.log('unchanged :', unchanged);
if (missing.length) { console.log('missing   :', missing.length, '(' + truncate(missing, 5) + ')'); }
if (extra.length)   { console.log('extra     :', extra.length, '(' + truncate(extra, 5) + ')'); }
