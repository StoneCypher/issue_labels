/**
 * visualize_colors_3d.cjs
 *
 * Generates docs/colors_3d.html -- an interactive 3D view of a multi-tier
 * color-spring layout in the RGB cube. The simulation runs LIVE in the
 * browser; the coefficient sliders retune it in real time.
 *
 * Three tiers, all reduced to forces on the label dots (the only integrated
 * bodies); subcategory and category "nodes" are the running means of their
 * labels:
 *   - each label springs toward its subcategory centroid;
 *   - each subcategory springs toward its category centroid, and repels its
 *     sibling subcategories;
 *   - categories repel one another.
 *
 * Also drawn: per-label name dots, subcategory + category centroid markers,
 * label->subcategory and subcategory->category links, and constellation
 * links (a label's `constellation` field names another label -- a 10% yellow
 * line, 70% while a cluster sharing a member is highlighted).
 *
 * Reads the taxonomy from standard_issue_label.json. Open colors_3d.html in a
 * browser. Run: node visualize_colors_3d.cjs
 */

const fs   = require('fs');
const path = require('path');

const SRC       = path.join(__dirname, '..', 'data', 'standard_issue_label.json');
const DST       = path.join(__dirname, '..', '..', 'docs', 'colors_3d.html');
const THREE_SRC = path.join(__dirname, '..', '..', 'node_modules', 'three');


// --- taxonomy -> category / subcategory / label metadata --------------------

const labels = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const catId = new Map(), catName = [];
labels.forEach(l => {
  if (!catId.has(l.category)) { catId.set(l.category, catId.size); catName.push(l.category); }
});

const subId = new Map(), subName = [], subCat = [];
const labelSub = labels.map(l => {
  const sk = l.category + '/' + (l.subcategory || '');
  if (!subId.has(sk)) {
    subId.set(sk, subId.size);
    subName.push(l.subcategory || l.category);
    subCat.push(catId.get(l.category));
  }
  return subId.get(sk);
});
const labelCat = labels.map(l => catId.get(l.category));
const nameToIdx = new Map(labels.map((l, i) => [l.name, i]));

// Pin source precedence (strongest first):
//   exaggerated > brand_color > pin > association > saving_pin.
// All five lock position; the distinct fields record WHY (deliberate shift to
// break out of a crowded cube region, brand identity, gradient scale, looser
// semantic association, or a sim-rescue anchor that captures where the label
// would have drifted on its own but pushes it just outside the muted center).
const hexToRgb = h => {
  const s = h.replace(/^#/, '');
  return [s.slice(0, 2), s.slice(2, 4), s.slice(4, 6)].map(p => parseInt(p, 16) / 255);
};
const effectivePin = l => {
  if (l.exaggerated) { return hexToRgb(l.exaggerated); }
  if (l.brand_color) { return hexToRgb(l.brand_color); }
  if (l.pin) {
    return ['r', 'g', 'b'].map(c => l.pin[c] !== undefined ? l.pin[c] / 255 : null);
  }
  if (l.association) { return hexToRgb(l.association); }
  if (l.saving_pin)  { return hexToRgb(l.saving_pin); }
  return [null, null, null];
};

const DATA = {
  labels: labels.map((l, i) => ({
    name: l.name,
    cat: labelCat[i],
    sub: labelSub[i],
    exempt: l.exempt === true,
    pin: effectivePin(l),
    seed: hexToRgb(l.color),
    con: l.constellation && nameToIdx.has(l.constellation) ? nameToIdx.get(l.constellation) : -1
  })),
  subs: subName.map((nm, s) => ({ name: nm, cat: subCat[s] })),
  cats: catName.map(nm => ({ name: nm }))
};


const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Color springs -- RGB cube</title>
<style>
  html,body{margin:0;height:100%;background:#101014;color:#ddd;
    font:13px/1.45 system-ui,-apple-system,sans-serif;overflow:hidden}
  #tip{position:fixed;pointer-events:none;background:#000c;border:1px solid #555;
    padding:6px 9px;border-radius:4px;display:none;white-space:nowrap;z-index:3}
  #panel{position:fixed;left:14px;top:14px;background:#000a;padding:9px 12px;
    border-radius:6px;z-index:2}
  #panel b{color:#fff}
  #ctrl{position:fixed;right:14px;top:14px;background:#000a;padding:10px 12px;
    border-radius:6px;z-index:2;width:260px;max-height:calc(100vh - 28px);overflow-y:auto}
  #ctrl h4{margin:0 0 6px;font-size:11px;color:#fff;letter-spacing:.05em;
    text-transform:uppercase}
  .row{margin:6px 0}
  .row label{display:flex;justify-content:space-between;font-size:11px;color:#bbb}
  .row label span:last-child{color:#9fd}
  .srow{display:flex;gap:5px;align-items:center;margin-top:2px}
  .srow input{flex:1;min-width:0;margin:0}
  #ctrl .rst{flex:none;background:#ffffff14;color:#9bd;border:1px solid #555;
    border-radius:3px;padding:0 6px;line-height:17px;margin:0;cursor:pointer}
  #ctrl .rst:hover{background:#ffffff33}
  #ctrl button{font:11px system-ui,sans-serif;background:#ffffff1a;color:#ddd;
    border:1px solid #666;border-radius:4px;padding:3px 9px;cursor:pointer;
    margin:6px 5px 0 0}
  #ctrl button:hover{background:#ffffff33}
  #ctrl button.on{background:#9fd3;border-color:#9fd;color:#fff}
  #swatch{display:inline-block;width:11px;height:11px;border-radius:2px;
    margin-right:6px;vertical-align:-1px;border:1px solid #ffffff44}
  .lbl{color:#fff;font:9px/1 system-ui,-apple-system,sans-serif;
    text-shadow:0 0 3px #000,0 0 2px #000,0 0 2px #000;
    pointer-events:none;white-space:nowrap;opacity:.10}
  .slbl{color:#fff;font:600 11px/1 system-ui,-apple-system,sans-serif;
    text-shadow:0 0 3px #000,0 0 3px #000,0 0 2px #000;
    pointer-events:none;white-space:nowrap;opacity:.28}
  .clbl{color:#fff;font:700 13px/1 system-ui,-apple-system,sans-serif;
    text-shadow:0 0 4px #000,0 0 3px #000,0 0 2px #000;
    pointer-events:none;white-space:nowrap;opacity:.5;text-transform:uppercase;
    letter-spacing:.03em}
  #list{position:fixed;left:14px;top:96px;background:#000a;padding:10px 12px;
    border-radius:6px;z-index:2;width:320px;max-height:calc(100vh - 110px);
    overflow-y:auto;column-count:2;column-gap:12px}
  #list .item{display:flex;align-items:center;gap:6px;padding:1px 3px;
    font-size:7.5px;line-height:1.5;border-radius:3px;cursor:default;
    break-inside:avoid;color:#ddd}
  #list .item:hover{background:#ffffff22;color:#fff}
  #list .chip{display:inline-block;width:10px;height:10px;border-radius:2px;
    flex:none;border:1px solid #ffffff33}
  #list .lbl-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>
</head>
<body>
<div id="panel"><b>Color springs &mdash; RGB cube</b><br>
  multi-tier live sim &middot; drag to rotate &middot; scroll to zoom<br>
  <span id="status"></span></div>
<div id="ctrl"><h4>coefficients</h4></div>
<div id="tip"></div>
<div id="list"></div>
<script type="importmap">
{ "imports": {
  "three": "./three/three.module.js",
  "three/addons/": "./three/addons/"
}}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const DATA   = __DATA__;
const LABELS = DATA.labels;        // [{name, cat, sub, exempt, pin:[r,g,b|null], seed:[r,g,b], con}]
const SUBS   = DATA.subs;          // [{name, cat}]
const CATS   = DATA.cats;          // [{name}]
const N      = LABELS.length;
const NS     = SUBS.length;
const NC     = CATS.length;
const S      = 230;                // RGB cube edge length in scene units
const DARKBLUE = [0.05, 0.06, 0.42];
const YELLOW = [1.00, 0.85, 0.12];
const SUBLINE = [0.45, 0.45, 0.52];

// --- sim state --------------------------------------------------------------
const labelCat = LABELS.map(l => l.cat);
const labelSub = LABELS.map(l => l.sub);
const exempt   = LABELS.map(l => l.exempt);
const pinArr   = LABELS.map(l => l.pin);
const seedArr  = LABELS.map(l => l.seed);
const anchored = LABELS.map(l => l.pin.every(v => v !== null));

const labelsOfSub = Array.from({ length: NS }, () => []);
labelSub.forEach((s, i) => labelsOfSub[s].push(i));
const subsOfCat = Array.from({ length: NC }, () => []);
SUBS.forEach((sb, s) => subsOfCat[sb.cat].push(s));

// per-subcategory member-to-member spacing: the even pairwise gap for M members
// on a shell of radius LBL_MIN is LBL_MIN * sqrt(SPHERE_PACK / M), where
// SPHERE_PACK = 8*pi/sqrt(3) is the triangular surface-packing constant. The
// hard floor imposed in step() is 90% of that gap.
const SPHERE_PACK = 8 * Math.PI / Math.sqrt(3);
const subSpaceK = labelsOfSub.map(m => Math.sqrt(SPHERE_PACK / Math.max(m.length, 1)));
const catSpaceK = subsOfCat.map(ss => Math.sqrt(SPHERE_PACK / Math.max(ss.length, 1)));
const subMovable = labelsOfSub.map(m => m.some(i => !exempt[i]));
const subCount = labelsOfSub.map(m => m.length);
const catCount = subsOfCat.map(ss => ss.reduce((n, s) => n + subCount[s], 0));

const pos = new Array(N);
const force = new Array(N);
// seed unpinned channels from each label's baked .color so labels start near
// their previous equilibrium -- visible startup motion then shows only the
// genuine response to whatever has been changed since the last bake
function seed() {
  for (let i = 0; i < N; i++) {
    pos[i] = [0, 1, 2].map(k => pinArr[i][k] == null ? seedArr[i][k] : pinArr[i][k]);
  }
}
seed();

// "show only anchored" toggle: hide every label that has no pin / brand_color /
// association, so the structure imposed by the anchored points is visible
// without the noise of unanchored members drifting under cluster forces
let onlyAnchored = false;

// live coefficients, retuned by the sliders
const P = {
  DT: 0.9,
  K_CAT_REP: 0.018, CAT_CUT: 0.30,
  K_SUB_SPRING: 0.085, K_SUB_REP: 0.014, SUB_CUT: 0.42,
  K_LBL_SPRING: 0.090, K_LBL_REP: 0.009, LBL_CUT: 0.070,
  LBL_MIN: 0.050, SUB_MIN: 0.080, SUB_FLOOR: 0.90, LBL_FLOOR: 0.90
};

const clamp1 = v => v < 0 ? 0 : v > 1 ? 1 : v;
function repFactor(r, cut, k) { return r >= cut ? 0 : k * (cut - r) / (cut * r); }

/** Running means of the label positions for every subcategory and category. */
function centroids() {
  const subC = SUBS.map(() => [0, 0, 0]);
  const catC = CATS.map(() => [0, 0, 0]);
  for (let i = 0; i < N; i++) {
    const s = labelSub[i], c = labelCat[i], p = pos[i];
    subC[s][0] += p[0]; subC[s][1] += p[1]; subC[s][2] += p[2];
    catC[c][0] += p[0]; catC[c][1] += p[1]; catC[c][2] += p[2];
  }
  for (let s = 0; s < NS; s++) {
    const n = labelsOfSub[s].length;
    subC[s][0] /= n; subC[s][1] /= n; subC[s][2] /= n;
  }
  for (let c = 0; c < NC; c++) {
    let n = 0;
    for (const s of subsOfCat[c]) { n += labelsOfSub[s].length; }
    catC[c][0] /= n; catC[c][1] /= n; catC[c][2] /= n;
  }
  return { subC, catC };
}

/**
 * Rigidly translates every non-exempt label of subcategory s by (vx, vy, vz).
 * The translation is first clamped, as one rigid body, to whatever keeps every
 * member inside the cube. Clamping each member independently (with clamp1)
 * would instead deform the group -- members at a wall lag behind the rest,
 * which shifts the centroid in an unintended direction and never satisfies the
 * caller's hard floor, injecting spurious, self-sustaining cluster motion.
 */
function shiftSubcategory(s, vx, vy, vz) {
  const v = [vx, vy, vz];
  for (let k = 0; k < 3; k++) {
    let lo = -Infinity, hi = Infinity;
    for (const i of labelsOfSub[s]) {
      if (exempt[i] || pinArr[i][k] != null) { continue; }
      lo = Math.max(lo, -pos[i][k]);
      hi = Math.min(hi, 1 - pos[i][k]);
    }
    v[k] = Math.min(hi, Math.max(lo, v[k]));
  }
  for (const i of labelsOfSub[s]) {
    if (exempt[i]) { continue; }
    for (let k = 0; k < 3; k++) {
      if (pinArr[i][k] == null) { pos[i][k] += v[k]; }
    }
  }
}

function step() {
  const { subC, catC } = centroids();

  // tier 3: categories repel one another
  const catF = CATS.map(() => [0, 0, 0]);
  for (let a = 0; a < NC; a++) {
    for (let b = a + 1; b < NC; b++) {
      const dx = catC[a][0] - catC[b][0], dy = catC[a][1] - catC[b][1], dz = catC[a][2] - catC[b][2];
      const r = Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz, 1e-6));
      const f = repFactor(r, P.CAT_CUT, P.K_CAT_REP);
      if (f === 0) { continue; }
      catF[a][0] += dx * f; catF[a][1] += dy * f; catF[a][2] += dz * f;
      catF[b][0] -= dx * f; catF[b][1] -= dy * f; catF[b][2] -= dz * f;
    }
  }

  // tier 2: each subcategory springs toward a rest distance of SUB_MIN from the
  // REST of its category -- the mean of the other subcategories' labels,
  // excluding its own. Springing toward the full category centroid would be
  // self-referential: that target includes (and so chases) the subcategory's
  // own labels, the rest length never becomes satisfiable, and the unspent
  // spring force drives a runaway drift. The exclude-self centroid cannot be
  // chased. A subcategory that is its whole category has no "rest" to spring
  // toward, so it gets no spring force.
  const subF = SUBS.map((sb, s) => {
    const c = sb.cat;
    const f = [0, 0, 0];
    const nOther = catCount[c] - subCount[s];
    if (nOther > 0) {
      const ox = (catC[c][0] * catCount[c] - subC[s][0] * subCount[s]) / nOther;
      const oy = (catC[c][1] * catCount[c] - subC[s][1] * subCount[s]) / nOther;
      const oz = (catC[c][2] * catCount[c] - subC[s][2] * subCount[s]) / nOther;
      const ex = ox - subC[s][0], ey = oy - subC[s][1], ez = oz - subC[s][2];
      const er = Math.sqrt(ex * ex + ey * ey + ez * ez);
      if (er > 1e-6) {
        const pull = P.K_SUB_SPRING * (er - P.SUB_MIN) / er;
        f[0] = ex * pull; f[1] = ey * pull; f[2] = ez * pull;
      }
    }
    for (const s2 of subsOfCat[c]) {
      if (s2 === s) { continue; }
      const dx = subC[s][0] - subC[s2][0], dy = subC[s][1] - subC[s2][1], dz = subC[s][2] - subC[s2][2];
      const r = Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz, 1e-6));
      const rf = repFactor(r, P.SUB_CUT, P.K_SUB_REP);
      f[0] += dx * rf; f[1] += dy * rf; f[2] += dz * rf;
    }
    return f;
  });

  // tier 1: each label carries its category + subcategory force, springs to
  // its subcategory centroid, and repels its sibling labels
  for (let i = 0; i < N; i++) {
    if (exempt[i]) { continue; }
    const s = labelSub[i], c = labelCat[i], p = pos[i];
    const f = [catF[c][0] + subF[s][0], catF[c][1] + subF[s][1], catF[c][2] + subF[s][2]];
    f[0] += P.K_LBL_SPRING * (subC[s][0] - p[0]);
    f[1] += P.K_LBL_SPRING * (subC[s][1] - p[1]);
    f[2] += P.K_LBL_SPRING * (subC[s][2] - p[2]);
    for (const j of labelsOfSub[s]) {
      if (j === i || exempt[j]) { continue; }
      const dx = p[0] - pos[j][0], dy = p[1] - pos[j][1], dz = p[2] - pos[j][2];
      const r = Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz, 1e-6));
      const rf = repFactor(r, P.LBL_CUT, P.K_LBL_REP);
      f[0] += dx * rf; f[1] += dy * rf; f[2] += dz * rf;
    }
    force[i] = f;
  }
  for (let i = 0; i < N; i++) {
    if (exempt[i]) { continue; }
    for (let k = 0; k < 3; k++) {
      pos[i][k] = pinArr[i][k] == null
        ? clamp1(pos[i][k] + force[i][k] * P.DT) : pinArr[i][k];
    }
  }

  // rigid minimum distance: a label is never closer than LBL_MIN to its
  // subcategory centroid, so a cluster keeps its volume instead of
  // flattening when it is pressed against a cube wall
  for (let i = 0; i < N; i++) {
    if (exempt[i]) { continue; }
    const c = subC[labelSub[i]];
    let dd = [pos[i][0] - c[0], pos[i][1] - c[1], pos[i][2] - c[2]];
    let r = Math.sqrt(dd[0] * dd[0] + dd[1] * dd[1] + dd[2] * dd[2]);
    if (r >= P.LBL_MIN) { continue; }
    if (r < 1e-6) { continue; }
    const sc = P.LBL_MIN / r;
    for (let k = 0; k < 3; k++) {
      pos[i][k] = pinArr[i][k] == null ? clamp1(c[k] + dd[k] * sc) : pinArr[i][k];
    }
  }

  // hard floor on member-to-member distance: no two members of a subcategory
  // may sit closer than 90% of the even pairwise gap M of them would have
  for (let s = 0; s < NS; s++) {
    const mem = labelsOfSub[s];
    if (mem.length < 2) { continue; }
    const floor = P.LBL_FLOOR * P.LBL_MIN * subSpaceK[s];
    for (let a = 0; a < mem.length; a++) {
      for (let b = a + 1; b < mem.length; b++) {
        const i = mem[a], j = mem[b];
        if (exempt[i] && exempt[j]) { continue; }
        let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1], dz = pos[i][2] - pos[j][2];
        let r = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (r >= floor) { continue; }
        if (r < 1e-9) { dx = 1e-4; dy = 0; dz = 0; r = 1e-4; }
        const w = (exempt[i] ? 0 : 1) + (exempt[j] ? 0 : 1);
        const push = (floor - r) / w;
        const ux = dx / r, uy = dy / r, uz = dz / r;
        if (!exempt[i]) {
          pos[i][0] = pinArr[i][0] == null ? clamp1(pos[i][0] + ux * push) : pinArr[i][0];
          pos[i][1] = pinArr[i][1] == null ? clamp1(pos[i][1] + uy * push) : pinArr[i][1];
          pos[i][2] = pinArr[i][2] == null ? clamp1(pos[i][2] + uz * push) : pinArr[i][2];
        }
        if (!exempt[j]) {
          pos[j][0] = pinArr[j][0] == null ? clamp1(pos[j][0] - ux * push) : pinArr[j][0];
          pos[j][1] = pinArr[j][1] == null ? clamp1(pos[j][1] - uy * push) : pinArr[j][1];
          pos[j][2] = pinArr[j][2] == null ? clamp1(pos[j][2] - uz * push) : pinArr[j][2];
        }
      }
    }
  }

  // hard floor on subcategory-to-subcategory distance: within a category, no
  // two subcategory centroids may sit closer than 90% of the even pairwise gap
  // K of them would have on a shell of radius SUB_MIN
  const fresh = centroids();
  for (let c = 0; c < NC; c++) {
    const subs = subsOfCat[c];
    if (subs.length < 2) { continue; }
    const floor = P.SUB_FLOOR * P.SUB_MIN * catSpaceK[c];
    for (let a = 0; a < subs.length; a++) {
      for (let b = a + 1; b < subs.length; b++) {
        const s1 = subs[a], s2 = subs[b];
        const w1 = subMovable[s1] ? 1 : 0, w2 = subMovable[s2] ? 1 : 0;
        if (w1 + w2 === 0) { continue; }
        let dx = fresh.subC[s1][0] - fresh.subC[s2][0];
        let dy = fresh.subC[s1][1] - fresh.subC[s2][1];
        let dz = fresh.subC[s1][2] - fresh.subC[s2][2];
        let r = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (r >= floor) { continue; }
        if (r < 1e-9) { dx = 1e-4; dy = 0; dz = 0; r = 1e-4; }
        const push = (floor - r) / (w1 + w2);
        const mx = dx / r * push, my = dy / r * push, mz = dz / r * push;
        if (w1) { shiftSubcategory(s1, mx, my, mz); }
        if (w2) { shiftSubcategory(s2, -mx, -my, -mz); }
      }
    }
  }
}

// --- constellations: connected components of the con-link graph -----------
const parent = Array.from({ length: N }, (_, i) => i);
function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
const conEdges = [];
LABELS.forEach((l, i) => {
  if (l.con >= 0) { conEdges.push([i, l.con]); parent[find(i)] = find(l.con); }
});
const compSubs = new Map();          // component root -> Set of subcategory indices
conEdges.forEach(([a, b]) => {
  for (const i of [a, b]) {
    const r = find(i);
    if (!compSubs.has(r)) { compSubs.set(r, new Set()); }
    compSubs.get(r).add(labelSub[i]);
  }
});

// --- three.js scene ---------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101014);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 4000);
camera.position.set(280, 230, 320);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const key = new THREE.DirectionalLight(0xffffff, 0.5);
key.position.set(1, 1, 1);
scene.add(key);

const toScene = (r, g, b) => [(r - 0.5) * S, (g - 0.5) * S, (b - 0.5) * S];

// RGB-cube wireframe: each edge a gradient between its two corner colors
const corners = [];
for (let x = 0; x <= 1; x++) {
  for (let y = 0; y <= 1; y++) {
    for (let z = 0; z <= 1; z++) { corners.push([x, y, z]); }
  }
}
const cubePos = [], cubeCol = [];
for (let i = 0; i < 8; i++) {
  for (let j = i + 1; j < 8; j++) {
    const a = corners[i], b = corners[j];
    if (Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]) !== 1) { continue; }
    for (const c of [a, b]) {
      cubePos.push((c[0]-0.5)*S, (c[1]-0.5)*S, (c[2]-0.5)*S);
      cubeCol.push(c[0], c[1], c[2]);
    }
  }
}
const cubeGeo = new THREE.BufferGeometry();
cubeGeo.setAttribute('position', new THREE.Float32BufferAttribute(cubePos, 3));
cubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(cubeCol, 3));
scene.add(new THREE.LineSegments(cubeGeo, new THREE.LineBasicMaterial({ vertexColors: true })));

// inner half-size dotted cube spans 25%..75% on each RGB axis -- a static
// reference for the muted middle region of the color cube. Each edge is a
// vertex-color gradient between its two corners' actual RGB coordinates,
// matching the outer cube's gradient styling.
const innerCorners = [];
for (const x of [0.25, 0.75]) {
  for (const y of [0.25, 0.75]) {
    for (const z of [0.25, 0.75]) { innerCorners.push([x, y, z]); }
  }
}
const innerCubePos = [], innerCubeCol = [];
for (let i = 0; i < 8; i++) {
  for (let j = i + 1; j < 8; j++) {
    const a = innerCorners[i], b = innerCorners[j];
    const span = Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]) + Math.abs(a[2]-b[2]);
    if (Math.abs(span - 0.5) > 1e-9) { continue; }          // only edges, not diagonals
    for (const c of [a, b]) {
      innerCubePos.push((c[0]-0.5)*S, (c[1]-0.5)*S, (c[2]-0.5)*S);
      innerCubeCol.push(c[0], c[1], c[2]);                  // each endpoint colored as its RGB coordinate
    }
  }
}
const innerCubeGeo = new THREE.BufferGeometry();
innerCubeGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerCubePos, 3));
innerCubeGeo.setAttribute('color', new THREE.Float32BufferAttribute(innerCubeCol, 3));
const innerCube = new THREE.LineSegments(innerCubeGeo,
  new THREE.LineDashedMaterial({ vertexColors: true, dashSize: 1.5, gapSize: 2,
    transparent: true, opacity: 0.7 }));
innerCube.computeLineDistances();                           // required by LineDashedMaterial
scene.add(innerCube);

/** Builds a vertex-colored LineSegments with count segments. */
function makeLines(count, opacity, order) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(Math.max(count, 1) * 6), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Math.max(count, 1) * 6), 3));
  const seg = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity, depthWrite: false }));
  seg.renderOrder = order;
  scene.add(seg);
  return geo;
}
const subCatGeo = makeLines(NS, 0.55, -1);        // subcategory -> category
const dotGeoL   = makeLines(N, 0.15, -0.6);       // label -> subcategory
const conGeoL   = makeLines(conEdges.length, 1, -0.4);   // constellation links

// colored dots + name labels
const sphereGeo = new THREE.SphereGeometry(2.55, 18, 14);
const borderGeo = new THREE.SphereGeometry(2.80, 18, 14);
const borderMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
const dots = [];
for (let i = 0; i < N; i++) {
  const m = new THREE.Mesh(sphereGeo,
    new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true }));
  m.add(new THREE.Mesh(borderGeo, borderMat));
  const div = document.createElement('div');
  div.className = 'lbl';
  div.textContent = LABELS[i].name;
  const lab = new CSS2DObject(div);
  lab.position.set(0, 5, 0);
  m.add(lab);
  m.userData = { div, info: LABELS[i].name + '  ·  ' + CATS[LABELS[i].cat].name,
    kind: 'label', sub: labelSub[i], cat: labelCat[i] };
  scene.add(m);
  dots.push(m);
}

// subcategory + category centroid markers
function makeMarkers(items, radius, cls, kind, wSeg = 14, hSeg = 10) {
  const geo = new THREE.SphereGeometry(radius, wSeg, hSeg);
  return items.map((it, idx) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0xc7c7cf, wireframe: true, transparent: true }));
    const div = document.createElement('div');
    div.className = cls;
    div.textContent = it.name;
    const lab = new CSS2DObject(div);
    lab.position.set(0, radius + 4, 0);
    m.add(lab);
    m.userData = { div, info: it.name, kind, idx };
    scene.add(m);
    return m;
  });
}
const subMarks = makeMarkers(SUBS, 1.7, 'slbl', 'sub');
// category markers: an invisible sphere serves as the hover-pick target, and
// wears a wireframe whose edges are half static grey and half (a random,
// frame-stable selection) the running mean color of the category's labels.
function makeCatMarkers() {
  const sphere = new THREE.SphereGeometry(3.4, 6, 5);
  const wfBase = new THREE.WireframeGeometry(sphere);
  const edgeCount = wfBase.attributes.position.count / 2;
  const GREY = [0.78, 0.78, 0.81];
  return CATS.map((cat, c) => {
    const m = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ visible: false }));

    const geo = wfBase.clone();
    const col = new Float32Array(geo.attributes.position.count * 3);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const wire = new THREE.LineSegments(geo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true }));
    m.add(wire);

    // shuffle the edge indices and keep half -- fixed for the whole session
    const order = Array.from({ length: edgeCount }, (_, e) => e);
    for (let e = edgeCount - 1; e > 0; e--) {
      const r = Math.floor(Math.random() * (e + 1));
      [order[e], order[r]] = [order[r], order[e]];
    }
    const colored = order.slice(0, Math.floor(edgeCount / 2));
    const tinted = new Set(colored);
    for (let e = 0; e < edgeCount; e++) {              // grey edges never change
      if (tinted.has(e)) { continue; }
      col.set(GREY, e * 6); col.set(GREY, e * 6 + 3);
    }

    const div = document.createElement('div');
    div.className = 'clbl';
    div.textContent = cat.name;
    const lab = new CSS2DObject(div);
    lab.position.set(0, 7.4, 0);
    m.add(lab);
    m.userData = { div, info: cat.name, kind: 'cat', idx: c, wire, colored };
    scene.add(m);
    return m;
  });
}
const catMarks = makeCatMarkers();
// a single-subcategory category's ball coincides with its lone subcategory
// marker -- redundant, so hide it
catMarks.forEach((m, c) => { if (subsOfCat[c].length === 1) { m.visible = false; } });
const pickTargets = dots.concat(subMarks, catMarks.filter(m => m.visible));

// list-hover highlight: a billboarded bright-yellow ring that follows the
// dot of whichever list item is currently being hovered. depthTest off and
// a high renderOrder keep it readable even when the dot sits behind others.
const ringCanvas = document.createElement('canvas');
ringCanvas.width = 128; ringCanvas.height = 128;
const ringCtx = ringCanvas.getContext('2d');
ringCtx.strokeStyle = '#ffff20';
ringCtx.lineWidth = 8;
ringCtx.beginPath();
ringCtx.arc(64, 64, 54, 0, Math.PI * 2);
ringCtx.stroke();
const ringSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: new THREE.CanvasTexture(ringCanvas),
  color: 0xffff00, transparent: true, depthTest: false }));
ringSprite.scale.set(14, 14, 1);
ringSprite.visible = false;
ringSprite.renderOrder = 1000;
scene.add(ringSprite);

// --- hover ------------------------------------------------------------------
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const tip = document.getElementById('tip');
const tipSwatch = document.createElement('span');
tipSwatch.id = 'swatch';
const tipText = document.createTextNode('');
tip.append(tipSwatch, tipText);
let focusSub = null, focusCat = null;
let listHoverIdx = -1;                                      // active list-row idx, -1 if none

addEventListener('pointermove', e => {
  if (e.target.closest('#list')) { return; }   // list owns its own hover state
  ndc.x = (e.clientX / innerWidth) * 2 - 1;
  ndc.y = -(e.clientY / innerHeight) * 2 + 1;
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(pickTargets, false)[0];
  focusSub = focusCat = null;
  if (hit) {
    const u = hit.object.userData;
    if (u.kind === 'label') { focusSub = u.sub; }
    else if (u.kind === 'sub') { focusSub = u.idx; }
    else { focusCat = u.idx; }
    tip.style.display = 'block';
    tip.style.left = (e.clientX + 14) + 'px';
    tip.style.top  = (e.clientY + 14) + 'px';
    tipSwatch.style.background = u.kind === 'label'
      ? '#' + hit.object.material.color.getHexString() : '#c7c7cf';
    tipText.textContent = u.info;
  } else {
    tip.style.display = 'none';
  }
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});

// --- left-side alphabetical legend -----------------------------------------
// Each item: a LIVE color chip + the label name. The chip's background is
// rewritten in render() from the current pos[i], so the list tracks the
// running sim. Hovering an item drives focusSub (same as hovering its dot in
// 3D) and sets listHoverIdx, which makes the yellow billboard ring pop up
// around the matching dot.
const listEl = document.getElementById('list');
const order = [...Array(N).keys()].sort((a, b) =>
  LABELS[a].name.localeCompare(LABELS[b].name, undefined, { sensitivity: 'base' }));
const chips = new Array(N);
for (const i of order) {
  const div = document.createElement('div');
  div.className = 'item';
  const chip = document.createElement('span');
  chip.className = 'chip';
  // initial color from baked seed; render() overwrites every frame
  const sc = LABELS[i].seed;
  chip.style.background = '#' + sc.map(v =>
    Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  chips[i] = chip;
  const nm = document.createElement('span');
  nm.className = 'lbl-name';
  nm.textContent = LABELS[i].name;
  div.append(chip, nm);
  div.addEventListener('pointerenter', e => {
    focusSub = labelSub[i];
    focusCat = null;
    listHoverIdx = i;
    tip.style.display = 'block';
    tip.style.left = (e.clientX + 14) + 'px';
    tip.style.top  = (e.clientY + 14) + 'px';
    tipSwatch.style.background = chip.style.background;     // live: render() writes it
    tipText.textContent = LABELS[i].name + '  ·  ' + CATS[LABELS[i].cat].name;
  });
  div.addEventListener('pointermove', e => {
    tip.style.left = (e.clientX + 14) + 'px';
    tip.style.top  = (e.clientY + 14) + 'px';
  });
  listEl.append(div);
}
// pointerleave on the container, not each item, so moving between adjacent
// items doesn't flicker through a null focus state
listEl.addEventListener('pointerleave', () => {
  focusSub = null;
  listHoverIdx = -1;
  tip.style.display = 'none';
});

// --- controls panel ---------------------------------------------------------
const SLIDERS = [
  ['DT', 0, 2, 0.05, 'Time step'],
  ['K_CAT_REP', 0, 0.1, 0.002, 'Category repulsion'],
  ['CAT_CUT', 0, 1.4, 0.02, 'Category range'],
  ['K_SUB_SPRING', 0, 0.2, 0.005, 'Subcategory spring'],
  ['K_SUB_REP', 0, 0.08, 0.002, 'Subcategory repulsion'],
  ['SUB_CUT', 0, 0.6, 0.01, 'Subcategory range'],
  ['SUB_MIN', 0, 0.3, 0.005, 'Subcategory minimum'],
  ['SUB_FLOOR', 0, 1.5, 0.05, 'Subcategory floor'],
  ['K_LBL_SPRING', 0, 0.2, 0.005, 'Label spring'],
  ['K_LBL_REP', 0, 0.05, 0.001, 'Label repulsion'],
  ['LBL_CUT', 0, 0.3, 0.005, 'Label range'],
  ['LBL_MIN', 0, 0.2, 0.005, 'Label minimum'],
  ['LBL_FLOOR', 0, 1.5, 0.05, 'Member floor']
];
const ctrl = document.getElementById('ctrl');
const DEFAULTS = { ...P };
const resetFns = [];
for (const [keyName, min, max, stepv, desc] of SLIDERS) {
  const row = document.createElement('div');
  row.className = 'row';
  const lab = document.createElement('label');
  const nm = document.createElement('span');
  nm.textContent = desc + ' (' + keyName + ')';
  const dec = Math.max(0, Math.ceil(-Math.log10(stepv) - 1e-9));
  const val = document.createElement('span');
  lab.append(nm, val);
  const sld = document.createElement('div');
  sld.className = 'srow';
  const inp = document.createElement('input');
  inp.type = 'range';
  inp.min = min; inp.max = max; inp.step = stepv;
  const rst = document.createElement('button');
  rst.className = 'rst';
  rst.textContent = '↺';
  rst.title = 'reset ' + keyName + ' to ' + DEFAULTS[keyName];
  const sync = () => { inp.value = P[keyName]; val.textContent = P[keyName].toFixed(dec); };
  inp.addEventListener('input', () => {
    P[keyName] = parseFloat(inp.value);
    val.textContent = P[keyName].toFixed(dec);
  });
  const reset = () => { P[keyName] = DEFAULTS[keyName]; sync(); };
  rst.addEventListener('click', reset);
  resetFns.push(reset);
  sld.append(inp, rst);
  row.append(lab, sld);
  ctrl.append(row);
  sync();
}
let running = true, steps = 0;
const reseedBtn = document.createElement('button');
reseedBtn.textContent = 'reseed';
reseedBtn.addEventListener('click', () => { seed(); steps = 0; running = true; pauseBtn.textContent = 'pause'; });
const pauseBtn = document.createElement('button');
pauseBtn.textContent = 'pause';
pauseBtn.addEventListener('click', () => {
  running = !running;
  pauseBtn.textContent = running ? 'pause' : 'run';
});
const resetAllBtn = document.createElement('button');
resetAllBtn.textContent = 'reset all';
resetAllBtn.addEventListener('click', () => { resetFns.forEach(fn => fn()); });

// export the live label colors as a compact name -> hex map, ready to be
// baked back into standard_issue_label.json via ~/.claude/bake_colors.cjs
const exportBtn = document.createElement('button');
exportBtn.textContent = 'export colors';
exportBtn.addEventListener('click', async () => {
  const map = {};
  for (let i = 0; i < N; i++) {
    const p = pos[i];
    const hex = '#' + [p[0], p[1], p[2]]
      .map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
    map[LABELS[i].name] = hex;
  }
  const text = JSON.stringify(map, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    exportBtn.textContent = 'copied!';
    setTimeout(() => { exportBtn.textContent = 'export colors'; }, 1500);
  } catch {
    // fallback when the page is not on a secure origin: pop the JSON into a
    // new tab so the user can copy it manually
    const w = open('', '_blank');
    if (w) { w.document.title = 'label colors'; w.document.body.innerText = text; }
  }
});
const onlyAnchoredBtn = document.createElement('button');
onlyAnchoredBtn.textContent = 'only anchored';
onlyAnchoredBtn.title = 'show only labels with a pin, brand_color, or association';
onlyAnchoredBtn.addEventListener('click', () => {
  onlyAnchored = !onlyAnchored;
  onlyAnchoredBtn.classList.toggle('on', onlyAnchored);
});
ctrl.append(reseedBtn, pauseBtn, resetAllBtn, exportBtn, onlyAnchoredBtn);

// slow persistent spin of the whole scene
const spinHdr = document.createElement('h4');
spinHdr.textContent = 'spin';
spinHdr.style.marginTop = '1em';
ctrl.append(spinHdr);

// rotation speed slider -- the base per-frame rate every spin profile scales
let spinSpeed = 0.0025;
const spinRow = document.createElement('div');
spinRow.className = 'row';
const spinLab = document.createElement('label');
const spinNm = document.createElement('span');
spinNm.textContent = 'Rotation speed';
const spinValEl = document.createElement('span');
spinValEl.textContent = spinSpeed.toFixed(4);
spinLab.append(spinNm, spinValEl);
const spinSrow = document.createElement('div');
spinSrow.className = 'srow';
const spinInp = document.createElement('input');
spinInp.type = 'range';
spinInp.min = 0; spinInp.max = 0.01; spinInp.step = 0.0005;
spinInp.value = spinSpeed;
spinInp.addEventListener('input', () => {
  spinSpeed = parseFloat(spinInp.value);
  spinValEl.textContent = spinSpeed.toFixed(4);
});
spinSrow.append(spinInp);
spinRow.append(spinLab, spinSrow);
ctrl.append(spinRow);

// spin profiles: per-axis weights scaled by spinSpeed. The "-ish" variants
// tumble -- 20% of the rate on a secondary axis and 5% on the tertiary,
// cycling x -> y -> z.
let spin = [0, 0, 0];
const SPINS = [
  ['x',   [1, 0, 0]],
  ['x+',  [1, 0.2, 0.05]],
  ['y',   [0, 1, 0]],
  ['y+',  [0.05, 1, 0.2]],
  ['z',   [0, 0, 1]],
  ['z+',  [0.2, 0.05, 1]],
  ['off', [0, 0, 0]]
];
const spinBtns = [];
const spinBtnBox = document.createElement('div');
spinBtnBox.style.display = 'flex';
spinBtnBox.style.flexWrap = 'wrap';
for (const [spinLabel, spinVec] of SPINS) {
  const b = document.createElement('button');
  b.textContent = spinLabel;
  if (spinLabel === 'off') { b.style.marginLeft = 'auto'; }   // push "off" to the right edge
  b.addEventListener('click', () => {
    spin = spinVec;
    for (const o of spinBtns) { o.classList.toggle('on', o === b); }
  });
  spinBtns.push(b);
  spinBtnBox.append(b);
}
ctrl.append(spinBtnBox);
spinBtns[spinBtns.length - 1].classList.add('on');   // "off" is engaged initially

const statusEl = document.getElementById('status');

/** Hue in degrees of an sRGB triple, or -1 for a grey color. */
function rgbHue(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d < 1e-6) { return -1; }
  let h;
  if (mx === r)      { h = ((g - b) / d) % 6; }
  else if (mx === g) { h = (b - r) / d + 2; }
  else               { h = (r - g) / d + 4; }
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** True when label i is in the currently-focused subcategory or category. */
function inFocus(i) {
  if (focusSub !== null) { return labelSub[i] === focusSub; }
  if (focusCat !== null) { return labelCat[i] === focusCat; }
  return true;
}

function setSeg(geo, idx, p0, p1, col) {
  const o = idx * 6;
  const pa = geo.attributes.position.array, ca = geo.attributes.color.array;
  pa[o] = p0[0]; pa[o+1] = p0[1]; pa[o+2] = p0[2];
  pa[o+3] = p1[0]; pa[o+4] = p1[1]; pa[o+5] = p1[2];
  for (let j = 0; j < 6; j += 3) { ca[o+j] = col[0]; ca[o+j+1] = col[1]; ca[o+j+2] = col[2]; }
}

function render() {
  const { subC, catC } = centroids();
  const subS = subC.map(p => toScene(p[0], p[1], p[2]));
  const catS = catC.map(p => toScene(p[0], p[1], p[2]));
  const hueAcc = SUBS.map(() => [0, 0]);

  for (let c = 0; c < NC; c++) {
    const m = catMarks[c];
    m.position.set(...catS[c]);
    m.userData.wire.material.opacity = focusCat === c ? 0.9 : focusCat === null ? 0.5 : 0.35;
    if (!m.visible) { continue; }
    const avg = catC[c];   // mean of the category's label colors == its centroid
    const ca = m.userData.wire.geometry.attributes.color;
    for (const e of m.userData.colored) {
      ca.setXYZ(e * 2, avg[0], avg[1], avg[2]);
      ca.setXYZ(e * 2 + 1, avg[0], avg[1], avg[2]);
    }
    ca.needsUpdate = true;
  }
  for (let s = 0; s < NS; s++) {
    subMarks[s].position.set(...subS[s]);
    const lit = (focusSub === null && focusCat === null)
      || focusSub === s || focusCat === SUBS[s].cat;
    subMarks[s].material.opacity = lit ? 0.85 : 0.3;
    setSeg(subCatGeo, s, subS[s], catS[SUBS[s].cat], lit ? SUBLINE : [0.16, 0.16, 0.2]);
  }
  for (let i = 0; i < N; i++) {
    const rgb = pos[i], sp = toScene(rgb[0], rgb[1], rgb[2]);
    // live chip + dot position update -- always, regardless of suppression
    // (the chip should track the sim even when its dot is hidden, and the
    // ring sprite needs an up-to-date position when its label is suppressed)
    chips[i].style.background = '#' + rgb.map(v =>
      Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
    dots[i].position.set(...sp);
    const suppressed = onlyAnchored && !anchored[i];
    dots[i].visible = !suppressed;
    dots[i].userData.div.style.display = suppressed ? 'none' : '';
    if (suppressed) {
      setSeg(dotGeoL, i, sp, sp, [0, 0, 0]);
      continue;
    }
    dots[i].material.color.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
    const foc = inFocus(i);
    dots[i].material.opacity = foc ? 1 : 0.45;
    dots[i].userData.div.style.opacity = (foc && (focusSub !== null || focusCat !== null)) ? '0.85' : '';
    const hue = rgbHue(rgb[0], rgb[1], rgb[2]);
    if (hue >= 0) {
      const rad = hue * Math.PI / 180;
      hueAcc[labelSub[i]][0] += Math.cos(rad);
      hueAcc[labelSub[i]][1] += Math.sin(rad);
    }
    const k = foc ? 1 : 0.4;
    const lc = exempt[i] ? DARKBLUE : rgb;
    setSeg(dotGeoL, i, sp, subS[labelSub[i]], [lc[0]*k, lc[1]*k, lc[2]*k]);
  }
  for (let s = 0; s < NS; s++) {
    let h = Math.atan2(hueAcc[s][1], hueAcc[s][0]) * 180 / Math.PI;
    if (h < 0) { h += 360; }
    subMarks[s].userData.div.style.color = 'hsl(' + h.toFixed(0) + ', 100%, 90%)';
  }
  for (let e = 0; e < conEdges.length; e++) {
    const a = conEdges[e][0], b = conEdges[e][1];
    const subs = compSubs.get(find(a));
    let shares = false;
    if (focusSub !== null) { shares = subs.has(focusSub); }
    else if (focusCat !== null) {
      for (const s of subs) { if (SUBS[s].cat === focusCat) { shares = true; break; } }
    }
    const al = shares ? 0.70 : 0.10;
    setSeg(conGeoL, e,
      toScene(pos[a][0], pos[a][1], pos[a][2]),
      toScene(pos[b][0], pos[b][1], pos[b][2]),
      [YELLOW[0]*al, YELLOW[1]*al, YELLOW[2]*al]);
  }
  for (const g of [subCatGeo, dotGeoL, conGeoL]) {
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
  }
  // list-hover yellow ring follows the chosen dot (or hides when none)
  if (listHoverIdx >= 0) {
    ringSprite.visible = true;
    ringSprite.position.copy(dots[listHoverIdx].position);
  } else {
    ringSprite.visible = false;
  }
  statusEl.textContent = 'step ' + steps + (running ? '' : '  (paused)');
}

(function loop() {
  requestAnimationFrame(loop);
  if (running) { step(); steps++; }
  render();
  scene.rotation.x += spin[0] * spinSpeed;
  scene.rotation.y += spin[1] * spinSpeed;
  scene.rotation.z += spin[2] * spinSpeed;
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
})();
</script>
</body>
</html>
`;




fs.mkdirSync(path.dirname(DST), { recursive: true });
fs.writeFileSync(DST, HTML.replace('__DATA__', JSON.stringify(DATA)));

// copy the three.js modules the page imports into docs/three/ (from node_modules)
const docsThree = path.join(path.dirname(DST), 'three');
const copies = [
  ['build/three.module.js', 'three.module.js'],
  ['build/three.core.js', 'three.core.js'],
  ['examples/jsm/controls/OrbitControls.js', 'addons/controls/OrbitControls.js'],
  ['examples/jsm/renderers/CSS2DRenderer.js', 'addons/renderers/CSS2DRenderer.js']
];
for (const [from, to] of copies) {
  const dst = path.join(docsThree, to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(path.join(THREE_SRC, from), dst);
}

console.log(`visualize_colors_3d: multi-tier live sim -> ${DST}`);
console.log(`visualize_colors_3d: ${DATA.labels.length} labels, ${DATA.subs.length} subcategories, `
  + `${DATA.cats.length} categories, ${DATA.labels.filter(l => l.con >= 0).length} constellation links`);
console.log(`visualize_colors_3d: three.js modules copied to ${docsThree}`);
