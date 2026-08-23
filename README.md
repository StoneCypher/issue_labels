# issue_labels v0.4.0

> Version 0.4.0 was built on Wednesday, June 3, 2026 at GMT-07:00 `1780496388187` from hash `bbace3a`.

A general-purpose **286-label issue taxonomy** for GitHub projects — 20 categories, 55 subcategories — paired with a 3D force-directed colorer that places each label as a point in the sRGB cube so visually-similar labels indicate semantically-related concerns.

<!-- Supported embeds: 1780496388187 Wednesday, June 3, 2026 at GMT-07:00 100 5 20 bbace3a {{stochbranch}} 100 {{stochfunc}} {{stochline}} 5 39 {{unitbranch}} {{unitfunc}} {{unitline}} 34 0.4.0 -->





&nbsp;

&nbsp;

## What's in here

* `src/data/standard_issue_label.json` — the taxonomy itself, one label per line, in the canonical serialized form. This is the artifact most consumers want.
* `src/build_js/assign_label_colors.cjs` — headless Node baker. Runs a force simulation in the sRGB cube and writes each label's settled position back as its `color` field. Also emits `docs/colors_trajectory.json` (the animation samples).
* `src/build_js/visualize_colors_3d.cjs` — generator for `docs/colors_3d.html`, the in-browser three.js sim. Multi-tier springs (label → subcategory centroid → category centroid), constellation links, live sliders, spin rig, hover info, "export colors" button.
* `src/build_js/bake_colors.cjs` — takes a `{ name: "#hex", ... }` map (the in-browser export) and writes the new colors back into the taxonomy JSON, preserving the canonical serialization.

The 20 categories: Type · Infrastructure · Component · Status · Estimation · Meta · Needs · Quality · Language · Outreach · Documentation · Significance · Testing · Platform · AI · Stakeholder · Pipeline · Business · Localization · Legal.

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

## Applying the taxonomy to another repository

`gh label clone` copies every label from this repository's tracker to another one in a single command:

```bash
gh label clone StoneCypher/issue_labels --repo <owner>/<target> --force
```

`--force` updates labels that already exist on the target instead of skipping them.

**The gotcha.** GitHub treats label names as case-insensitive for uniqueness, so a stock `bug` on the target blocks the taxonomy's `Bug` from being created. `--force` updates the existing label's colour and description but does **not** rename it — so the target ends up holding the right label under the wrong name, and the clone reports success either way.

A fresh GitHub repository ships with nine defaults that collide like this: `accessibility`, `bug`, `dependencies`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `javascript`, `question`. Repair them by renaming rather than deleting, which preserves any issue assignments the labels already carry:

```bash
gh label edit "bug" --name "Bug" --repo <owner>/<target>
```

Verify by diffing the two label sets. Every taxonomy label should be present on the target, so the first `comm` prints nothing:

```bash
gh label list --repo StoneCypher/issue_labels --limit 400 --json name --jq '.[].name' | sort > source.txt
gh label list --repo <owner>/<target>         --limit 400 --json name --jq '.[].name' | sort > target.txt
comm -23 source.txt target.txt   # missing from target — should be empty
comm -13 source.txt target.txt   # extra on target — the leftovers below
```

Three GitHub defaults have no taxonomy equivalent and survive the clone untouched: `documentation`, `invalid`, `wontfix`. The first of those looks like an omission and isn't — the taxonomy's documentation label is `Documentation and docgen`, so the short stock name is redundant rather than missing. Delete all three if the tracker should hold the taxonomy and nothing else:

```bash
gh label delete "documentation" --repo <owner>/<target> --yes
```

A clean result is `diff` on the two sorted label lists printing nothing at all.

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
    <td>34</td>
    <td>100<small>%</small></td>
    <td>{{unitbranch}}<small>%</small></td>
    <td>{{unitfunc}}<small>%</small></td>
    <td>{{unitline}}<small>%</small></td>
  </tr>
  <tr>
    <th>Stochastic</th>
    <td>5</td>
    <td>100<small>%</small></td>
    <td>{{stochbranch}}<small>%</small></td>
    <td>{{stochfunc}}<small>%</small></td>
    <td>{{stochline}}<small>%</small></td>
  </tr>
</table>

<table>
  <tr>
    <th></th>
    <th>Docblock count</th>
    <th>20<small>%</small></th>
  </tr>
  <tr>
    <th>Docblock coverage</th>
    <td>5</td>
    <td>20<small>%</small></td>
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
