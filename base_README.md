# issue_labels v{{version}}

> Version {{version}} was built on {{built_text}} `{{built}}` from hash `{{gh_hash}}`.

A general-purpose **286-label issue taxonomy** for GitHub projects — 20 categories, 55 subcategories — paired with a 3D force-directed colorer that places each label as a point in the sRGB cube so visually-similar labels indicate semantically-related concerns.

<!-- Supported embeds: {{built}} {{built_text}} {{coverage}} {{docblockcount}} {{doccoverage}} {{gh_hash}} {{stochbranch}} {{stochcoverage}} {{stochfunc}} {{stochline}} {{stochtestcount}} {{testcasecount}} {{unitbranch}} {{unitfunc}} {{unitline}} {{unittestcount}} {{version}} -->





&nbsp;

&nbsp;

## What's in here

* `src/data/standard_issue_label.json` — the taxonomy itself, one label per line, in the canonical serialized form. This is the artifact most consumers want.
* `src/build_js/assign_label_colors.cjs` — headless Node baker. Runs a force simulation in the sRGB cube and writes each label's settled position back as its `color` field. Also emits `docs/colors_trajectory.json` (the animation samples).
* `src/build_js/visualize_colors_3d.cjs` — generator for `docs/colors_3d.html`, the in-browser three.js sim. Multi-tier springs (label → subcategory centroid → category centroid), constellation links, live sliders, spin rig, hover info, "export colors" button.
* `src/build_js/bake_colors.cjs` — takes a `{ name: "#hex", ... }` map (the in-browser export) and writes the new colors back into the taxonomy JSON, preserving the canonical serialization.

The 20 categories: Type · Infrastructure · Component · Status · Estimation · Meta · Needs · Quality · Language · Outreach · Documentation · Significance · Testing · Platform · AI · Stakeholder · Pipeline · Business · Localization · Legal.

&nbsp;

## Installing the taxonomy into a repo

If a repo already carries the taxonomy, copy the whole set in a single call:

```bash
gh label clone OWNER/SOURCE --repo OWNER/DEST --force
```

**Never create the labels one at a time in a loop.** At this size the per-label path takes about
ten minutes to accomplish exactly what the one `clone` above does instantly.

### Two gotchas that will silently corrupt the result

**Delete the stock labels _before_ cloning, not after.** A fresh GitHub repo ships with lowercase
defaults — `bug`, `enhancement`, `documentation`, `duplicate`, `good first issue`, `help wanted`,
`invalid`, `question`, `wontfix`, `dependencies` — and label names collide case-insensitively on
creation while being stored case-sensitively. Cloning into a repo that still holds `bug` will
**silently skip** `Bug`, with no error and no warning.

Deleting afterward is worse than useless. `gh issue edit --add-label "Bug"` resolves to the
existing lowercase `bug`, so a migration written as `--add-label "Bug" --remove-label "bug"`
removes the label and adds nothing — quietly stripping the type off every issue it touches.

**`gh label list` returns only 30 results by default.** Always pass `--limit 500`. Any conclusion
about which labels exist that was drawn without it was drawn from the first 30 of several hundred.

### Verify parity afterward

Do this every time. Both gotchas above fail silently, so the copy looking fine proves nothing.

```bash
gh label list --repo OWNER/SOURCE --limit 500 --json name -q '.[].name' | sort > /tmp/a.txt
gh label list --repo OWNER/DEST   --limit 500 --json name -q '.[].name' | sort > /tmp/b.txt
comm -3 /tmp/a.txt /tmp/b.txt   # empty output means the copy is exact
```

&nbsp;

## Usage

```bash
npm install
npm run viz        # bake colors (overwrites stored colors), then regenerate the HTML
npm run viz:html   # regenerate ONLY the HTML; preserves whatever's currently stored as `color`
npm run bake exported.json  # apply an in-browser export back to the taxonomy
```

The seed → live → export → bake loop:

1. `npm run viz` bakes a starting set of colors using the headless Node simulation.
2. Open `docs/colors_3d.html` in a browser. The in-browser sim runs more sophisticated physics (multi-tier springs, sub-sub floor, constellation links). The page's `seed()` randomizes positions per page-load (respecting per-channel pins), so the browser starts from a random state, not the stored `color`s.
3. Drag sliders, let it settle, click **export colors** — the result is on the clipboard as `{ name: "#hex" }`.
4. Save that to a file and run `npm run bake path/to/exported.json` to write it back into the JSON.
5. From here, **refresh the HTML with `npm run viz:html`** — NOT `npm run viz`. The latter re-runs the baker and overwrites the colors you just baked in.

&nbsp;

## Test status

<table>
  <tr>
    <th></th>
    <th>Count</th>
    <th>Statement</th>
    <th>Branch</th>
    <th>Func</th>
    <th>Line</th>
  </tr>
  <tr>
    <th>Unit</th>
    <td>{{unittestcount}}</td>
    <td>{{coverage}}<small>%</small></td>
    <td>{{unitbranch}}<small>%</small></td>
    <td>{{unitfunc}}<small>%</small></td>
    <td>{{unitline}}<small>%</small></td>
  </tr>
  <tr>
    <th>Stochastic</th>
    <td>{{stochtestcount}}</td>
    <td>{{coverage}}<small>%</small></td>
    <td>{{stochbranch}}<small>%</small></td>
    <td>{{stochfunc}}<small>%</small></td>
    <td>{{stochline}}<small>%</small></td>
  </tr>
</table>

<table>
  <tr>
    <th></th>
    <th>Docblock count</th>
    <th>{{doccoverage}}<small>%</small></th>
  </tr>
  <tr>
    <th>Docblock coverage</th>
    <td>{{docblockcount}}</td>
    <td>{{doccoverage}}<small>%</small></td>
  </tr>
</table>

* [Site](https://stonecypher.github.io/issue_labels/index.html)
* [Documentation](https://stonecypher.github.io/issue_labels/docs/index.html)
* [Builds](https://www.github.com/stonecypher/issue_labels/actions)
* [Source](https://www.github.com/stonecypher/issue_labels/)

<img alt="star_chart" src="https://starchart.cc/StoneCypher/issue_labels.svg" />

<table>
  <tr>
    <td><img alt="sunburst visualization" src="bundle_sunburst.png" /></td>
    <td><img alt="treemap visualization" src="bundle_treemap.png" /></td>
  </tr>
  <tr>
    <td><img alt="network visualization" src="bundle_network.png" /></td>
    <td><img alt="flamegraph visualization" src="bundle_flamegraph.png" /></td>
  </tr>
</table>
