# Changelog

All notable changes to this project will be documented in this file.

1 merge



&nbsp;

&nbsp;

Published tags:







&nbsp;

&nbsp;

## [Untagged] - May 26, 2026 11:46:29 AM

Commit [bbace3aa349abc537a346b44e92ba97e6dd36781](https://github.com/StoneCypher/issue_labels/commit/bbace3aa349abc537a346b44e92ba97e6dd36781)

Author: `John Haugeland <stonecypher@gmail.com>`

  * feat: convert prototype.json to TypeScript labels export, drop stub
  * The 286-label taxonomy is now a first-class TypeScript export instead of
a flat JSON snapshot. Consumers can import the labels and the row type
through any of the four supported channels (ESM, CJS, IIFE, modern
module script).
  * Source:
- src/ts/labels.ts: `export const labels: readonly Label[]` plus the
  `Label` interface (name / color / description, all readonly)
- src/ts/index.ts: re-exports labels and Label
- src/ts/stub.ts and its three test files removed per its own DocBlock
- src/data/prototype.json deleted (the snapshot, now superseded)
  * Tests:
- src/ts/tests/labels.spec.ts: shape, uniqueness, hex format, plus a
  cube-residency invariant (every color outside the 25-75% inner cube)
- src/ts/tests/labels.stoch.ts: fast-check properties on random index
  sampling and distinct-index distinctness
  * Build:
- npm run build passes end-to-end on the existing pipeline
- 100% statement/branch/func/line coverage on labels.ts
- attw clean across node10, node16 CJS, node16 ESM, bundler
- Multi-format outputs preserved: dist/index.{mjs,cjs,iife.js} + .d.ts/.d.cts




&nbsp;

&nbsp;

## [Untagged] - May 26, 2026 9:24:51 AM

Commit [d056a0f518becb025c884dc867506c90e52844f9](https://github.com/StoneCypher/issue_labels/commit/d056a0f518becb025c884dc867506c90e52844f9)

Author: `John Haugeland <stonecypher@gmail.com>`

Merges [e3cbe76, afbbf00]

  * Merge pull request #1 from StoneCypher/feat_26-05-26_saving-pin-and-prototype
  * feat: add exaggerated/saving_pin pin sources, clear muted-center cube




&nbsp;

&nbsp;

## [Untagged] - May 26, 2026 9:21:34 AM

Commit [afbbf00750c2087f70b5edb4e1d296bf85de46a9](https://github.com/StoneCypher/issue_labels/commit/afbbf00750c2087f70b5edb4e1d296bf85de46a9)

Author: `John Haugeland <stonecypher@gmail.com>`

  * feat: add exaggerated/saving_pin sources, clear muted-center cube
  * Schema:
- New pin sources with precedence
  exaggerated > brand_color > pin > association > saving_pin
- exaggerated: deliberate brand shift to escape crowded cube regions
- saving_pin: lowest-priority rescue anchor for would-be center drifters
  * Visualizer:
- Live color chips in alphabetical left-side legend
- Yellow billboard ring highlights the matching dot on list hover
- Inner half-size dotted cube marks the 25-75% muted-center region with
  edges gradient-colored to match the outer cube
- "Only anchored" toggle hides unpinned dots so anchored structure is visible
- Seed unpinned channels from each label's baked .color (was Math.random)
  * Labels:
- iOS to #007AFF, Unity to #222C37, Edge to #3CCBF4 (resolve black-corner
  collision and Microsoft-blue collision)
- Critical pin nudged darker/redder; Quality and Size ladders re-interpolated
  with unknown folded into the gradient
- Effort 1/5 stripped of green; missing set to per-channel ladder average
- 7 brand-color exaggerations + 17 saving_pins lift inside-cube labels just
  past the cube wall
- New constellation chains for Effort (6 rungs) and the Quality ladder
  (extended)
  * Artifacts:
- src/data/prototype.json: flat name+color+description list with all 286
  labels outside the inner cube
- docs/inner_cube_exaggerations.html, docs/drifted_exaggerations.html:
  snapshot reports of inside-cube state




&nbsp;

&nbsp;

## [Untagged] - May 25, 2026 11:55:04 AM

Commit [e3cbe76207db95a7dbd2345f63599f59d1b6cf5b](https://github.com/StoneCypher/issue_labels/commit/e3cbe76207db95a7dbd2345f63599f59d1b6cf5b)

Author: `John Haugeland <stonecypher@gmail.com>`

  * show to the Dan (tm)




&nbsp;

&nbsp;

## [Untagged] - May 23, 2026 8:06:13 AM

Commit [c9014b82169334ad02ffb6e5edb458838d3e87b8](https://github.com/StoneCypher/issue_labels/commit/c9014b82169334ad02ffb6e5edb458838d3e87b8)

Author: `John Haugeland <stonecypher@gmail.com>`

  * fix(labels): trim 4 descriptions and de-comma 2 Effort names for GitHub
  * GitHub's label API rejects descriptions over 100 chars and names containing
commas. Trims descriptions on `Issue needs work`, `Stale`, `Slop`, `Backlog`
to under 100 chars while keeping the meaning, and swaps the comma in
`Effort: 4/5 - plan and divide, up to 1 month` and
`Effort: 5/5 - plan and divide, enormous` for a semicolon. Regenerated
docs/colors_3d.html to match. JSON written via the canonical serializer.
All 286 labels now sync cleanly via gh label create --force.




&nbsp;

&nbsp;

## [Untagged] - May 23, 2026 12:01:52 AM

Commit [d49f4c646649b92c4f3ccb8bd6a875682b78b19d](https://github.com/StoneCypher/issue_labels/commit/d49f4c646649b92c4f3ccb8bd6a875682b78b19d)

Author: `John Haugeland <stonecypher@gmail.com>`

  * chore: scaffold-prep edits from template init
  * Pre-existing modifications carried from issue_labels' initialization off
the TS-package template -- template-name swaps in rollup.config.js,
typedoc-options.cjs, and src/html/index.html, plus regenerated docs/, dist/,
coverage-stoch/, and .claude/settings.local.json. Bundled separately from
the extraction to keep that commit's history focused on the moved code.




&nbsp;

&nbsp;

## [Untagged] - May 22, 2026 11:54:14 PM

Commit [2f7ae79561c54d1da754bf5464c39658eed4d33e](https://github.com/StoneCypher/issue_labels/commit/2f7ae79561c54d1da754bf5464c39658eed4d33e)

Author: `John Haugeland <stonecypher@gmail.com>`

  * feat: extract issue-label taxonomy and 3D colorer from var_icons
  * Lifts the 286-label general-purpose taxonomy (20 categories, 55 subcategories)
and its force-directed RGB-cube colorer out of var_icons per the plan in
var_icons/EXTRACT_VIZ_TO_NEW_REPO.md. bake_colors.cjs's LABEL_FILE switched
from a hardcoded var_icons path to __dirname-relative. Adds viz / viz:html /
bake npm scripts and three@^0.184.0 devDep. Eslint Node-globals glob widened
from *.js to *.{js,cjs} so the moved CommonJS scripts lint cleanly; this
side-fix also benefits pre-existing .cjs build scripts. Verified end-to-end
via headless Chromium: sim runs, 286 labels render, export button round-trips
through bake_colors.cjs unchanged.




&nbsp;

&nbsp;

## [Untagged] - May 22, 2026 10:49:55 PM

Commit [0fb665971e0a2c57fc1983aeabdcd63eb399a158](https://github.com/StoneCypher/issue_labels/commit/0fb665971e0a2c57fc1983aeabdcd63eb399a158)

Author: `John Haugeland <stonecypher@gmail.com>`

  * Initial commit