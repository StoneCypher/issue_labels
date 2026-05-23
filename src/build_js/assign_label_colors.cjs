/**
 * assign_label_colors.cjs
 *
 * Assigns a hex `color` to every label in standard_issue_label.json with a
 * force-directed layout in the sRGB cube.
 *
 *   - Labels are grouped into clusters (`category` + `subcategory`).
 *   - Cluster centroids repel each other with a SHORT-RANGE force, so clusters
 *     pack and fill the cube.
 *   - Within a cluster, members repel one another and spring to the cluster
 *     centroid -- so a cluster's members fan out around its centre.
 *   - Colour pinning and sim-exemption are independent. A label's `pin` object
 *     fixes any subset of channels (e.g. `{ "b": 255 }` locks blue to 255);
 *     pinned channels are held fixed every step while the rest move.
 *   - A label marked `exempt` takes NO part in the sim (no spring, no
 *     repulsion). A cluster whose members are ALL exempt is left out of the
 *     centroid grid entirely.
 *
 * Writes standard_issue_label.json (colours) and colors_trajectory.json (the
 * animation: label and centroid positions sampled from random start to settled).
 *
 * Run: node assign_label_colors.cjs
 */

const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'standard_issue_label.json');
const TRAJ = path.join(__dirname, '..', '..', 'docs', 'colors_trajectory.json');

const ITERS     = 900;     // layout iteration ceiling
const SAMPLE    = 12;      // record a trajectory frame every SAMPLE iterations
const DT        = 0.9;     // integration step
const CUT       = 0.34;    // centroid repulsion cutoff (short range)
const K_REP     = 0.026;   // centroid repulsion strength
const MEM_CUT   = 0.090;   // intra-cluster member repulsion cutoff (short range)
const K_MEM     = 0.011;   // intra-cluster member repulsion strength
const K_SPRING  = 0.050;   // member -> centroid spring strength




/** Clamps an sRGB triple into the cube [0,1]^3. */
function clampCube([r, g, b]) {
  return [r, g, b].map(v => Math.max(0, Math.min(1, v)));
}


/** Formats an sRGB triple (each 0..1) as `#rrggbb`. */
function rgbToHex(p) {
  return '#' + p.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16).padStart(2, '0')).join('');
}


/** Short-range linear repulsion magnitude factor for distance `r` under `cut`. */
function repFactor(r, cut, k) {
  return r >= cut ? 0 : k * (cut - r) / (cut * r);
}




/**
 * Runs the force-directed assignment, rewrites standard_issue_label.json, and
 * writes colors_trajectory.json for the animation.
 */
function main() {

  const labels = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const n = labels.length;

  // clusters
  const clusterId = new Map();
  const cluster = [], clusterCat = [], clusterName = [];
  labels.forEach(l => {
    const ck = l.category + (l.subcategory ? '/' + l.subcategory : '');
    if (!clusterId.has(ck)) {
      clusterId.set(ck, clusterId.size);
      clusterCat.push(l.category);
      clusterName.push(ck);
    }
    cluster.push(clusterId.get(ck));
  });
  const nClusters = clusterId.size;

  // exemption (springs): an exempt label takes no part in the force sim
  const exempt = labels.map(l => l.exempt === true);

  // colour pinning: pin[i] is [r, g, b], each entry a fixed value in 0..1 or
  // null. Pinned channels are held fixed; null channels are sim-driven.
  const pin = labels.map(l => ['r', 'g', 'b'].map(c =>
    l.pin && l.pin[c] !== undefined ? l.pin[c] / 255 : null));

  // a cluster is all-exempt (out of the grid) when every member is exempt
  const memberIdx = Array.from({ length: nClusters }, () => []);
  cluster.forEach((c, i) => memberIdx[c].push(i));
  const clusterExempt = memberIdx.map(m => m.every(i => exempt[i]));

  // static centroid (mean of pinned channels) for all-exempt clusters
  const pinCentroid = memberIdx.map((m, c) => {
    if (!clusterExempt[c]) { return null; }
    const s = [0, 0, 0];
    m.forEach(i => { for (let k = 0; k < 3; k++) { s[k] += pin[i][k] ?? 0.5; } });
    return s.map(v => v / m.length);
  });

  // seeded RNG (time-based -- a fresh layout each run)
  let rng = Date.now() & 0x7fffffff;
  const rand = () => (rng = (rng * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  // positions: pinned channels start fixed, the rest random
  const pos = labels.map((l, i) =>
    pin[i].map(v => v !== null ? v : rand()));

  /** Cluster centroids: mean of non-exempted members, or the pinned centroid. */
  function centroids() {
    const s = Array.from({ length: nClusters }, () => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) {
      if (exempt[i]) { continue; }
      const c = s[cluster[i]];
      c[0] += pos[i][0]; c[1] += pos[i][1]; c[2] += pos[i][2]; c[3]++;
    }
    return s.map((c, ci) => c[3] > 0
      ? [c[0] / c[3], c[1] / c[3], c[2] / c[3]] : pinCentroid[ci]);
  }

  const frames = [], cenFrames = [];
  const round = v => Math.round(v * 1000) / 1000;
  const snapshot = cen => {
    frames.push(pos.map(p => p.map(round)));
    cenFrames.push(cen.map(p => p.map(round)));
  };

  for (let step = 0; step < ITERS; step++) {

    const cen = centroids();
    if (step % SAMPLE === 0) { snapshot(cen); }

    // centroid repulsion -> a per-cluster force (grid clusters only)
    const cForce = Array.from({ length: nClusters }, () => [0, 0, 0]);
    for (let a = 0; a < nClusters; a++) {
      if (clusterExempt[a]) { continue; }
      for (let b = a + 1; b < nClusters; b++) {
        if (clusterExempt[b]) { continue; }
        const dx = cen[a][0] - cen[b][0], dy = cen[a][1] - cen[b][1], dz = cen[a][2] - cen[b][2];
        const r = Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz, 1e-6));
        let f = repFactor(r, CUT, K_REP);
        if (f === 0) { continue; }
        cForce[a][0] += dx * f; cForce[a][1] += dy * f; cForce[a][2] += dz * f;
        cForce[b][0] -= dx * f; cForce[b][1] -= dy * f; cForce[b][2] -= dz * f;
      }
    }

    // per non-exempted member: cluster drift + spring + intra-cluster repulsion
    const force = pos.map((p, i) => {
      if (exempt[i]) { return null; }
      const c = cluster[i], ce = cen[c];
      const f = cForce[c].slice();
      f[0] += K_SPRING * (ce[0] - p[0]);
      f[1] += K_SPRING * (ce[1] - p[1]);
      f[2] += K_SPRING * (ce[2] - p[2]);
      for (const j of memberIdx[c]) {
        if (j === i || exempt[j]) { continue; }
        const dx = p[0] - pos[j][0], dy = p[1] - pos[j][1], dz = p[2] - pos[j][2];
        const r = Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz, 1e-6));
        const rf = repFactor(r, MEM_CUT, K_MEM);
        f[0] += dx * rf; f[1] += dy * rf; f[2] += dz * rf;
      }
      return f;
    });

    for (let i = 0; i < n; i++) {
      if (exempt[i]) { continue; }
      const moved = clampCube([
        pos[i][0] + force[i][0] * DT,
        pos[i][1] + force[i][1] * DT,
        pos[i][2] + force[i][2] * DT
      ]);
      // hold pinned channels fixed while the free channels follow the forces
      pos[i] = moved.map((v, k) => pin[i][k] !== null ? pin[i][k] : v);
    }
  }
  snapshot(centroids());                                   // final settled state

  // assign colours
  labels.forEach((l, i) => { l.color = rgbToHex(pos[i]); });

  // rewrite, preserving one-object-per-line format and key order
  const ser = o => '  { ' + Object.entries(o)
    .map(([k, v]) => JSON.stringify(k) + ': ' + JSON.stringify(v)).join(', ') + ' }';
  const lines = labels.map(l => {
    const o = { name: l.name, category: l.category };
    if (l.subcategory)   { o.subcategory = l.subcategory; }
    o.description = l.description;
    o.color = l.color;
    if (l.exempt)        { o.exempt = l.exempt; }
    if (l.pin)           { o.pin = l.pin; }
    if (l.core)          { o.core = l.core; }
    if (l.constellation) { o.constellation = l.constellation; }
    return ser(o);
  });
  fs.writeFileSync(FILE, '[\n' + lines.join(',\n') + '\n]\n');

  // trajectory for the animation
  fs.mkdirSync(path.dirname(TRAJ), { recursive: true });
  fs.writeFileSync(TRAJ, JSON.stringify({
    labels: labels.map((l, i) => ({
      name: l.name, category: l.category, cluster: cluster[i], exempt: exempt[i]
    })),
    clusters: clusterName.map((nm, c) => ({ name: nm, exempt: clusterExempt[c] })),
    frames,
    centroidFrames: cenFrames
  }));

  console.log('clusters             :', nClusters,
    '(' + clusterExempt.filter(Boolean).length + ' all-exempted, off-grid)');
  console.log('labels colored       :', n,
    '(' + exempt.filter(Boolean).length + ' exempt, '
    + pin.filter(p => p.some(v => v !== null)).length + ' channel-pinned) | distinct:',
    new Set(labels.map(l => l.color)).size);
  console.log('trajectory           :', frames.length, 'frames written to', TRAJ);

}

main();
