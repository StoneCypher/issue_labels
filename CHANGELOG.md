# Changelog

All notable changes to this project will be documented in this file.

4 merges; Changelogging the last 10 commits; Full changelog at [CHANGELOG.long.md](CHANGELOG.long.md)



&nbsp;

&nbsp;

Published tags:







&nbsp;

&nbsp;

## [Untagged] - Oct 2, 2026 4:22:14 PM

Commit [2d8e5761b4ba7eb26478dc32b24c3416c5514a03](https://github.com/StoneCypher/issue_labels/commit/2d8e5761b4ba7eb26478dc32b24c3416c5514a03)

Author: `John Haugeland <stonecypher@gmail.com>`

Merges [3674bc2, 64dfb54]

  * Merge pull request #15 from StoneCypher/fix_26-10-02_label-descriptions
  * fix(taxonomy): make the Frontend label description project-neutral




&nbsp;

&nbsp;

## [Untagged] - Oct 2, 2026 4:13:45 PM

Commit [64dfb54cdda4f87b23ea66a052843efeff685db4](https://github.com/StoneCypher/issue_labels/commit/64dfb54cdda4f87b23ea66a052843efeff685db4)

Author: `John Haugeland <stonecypher@gmail.com>`

  * fix(taxonomy): make the Frontend label description project-neutral




&nbsp;

&nbsp;

## [Untagged] - Sep 7, 2026 10:54:11 AM

Commit [3674bc2434fc19dfc19114f75cc1ef281c05dd3e](https://github.com/StoneCypher/issue_labels/commit/3674bc2434fc19dfc19114f75cc1ef281c05dd3e)

Author: `John Haugeland <stonecypher@gmail.com>`

Merges [edf294a, 340bdc1]

  * Merge pull request #13 from StoneCypher/docs_26-09-07_reserved-color-box
  * docs: describe the reserved color box for repo-specific labels




&nbsp;

&nbsp;

## [Untagged] - Sep 7, 2026 9:50:38 AM

Commit [340bdc1f8ad47f62f4f353803ddd75bcfea9c9b9](https://github.com/StoneCypher/issue_labels/commit/340bdc1f8ad47f62f4f353803ddd75bcfea9c9b9)

Author: `John Haugeland <stonecypher@gmail.com>`

  * docs: mirror the reserved color box section into the generated README




&nbsp;

&nbsp;

## [Untagged] - Sep 7, 2026 9:50:27 AM

Commit [3b3bdb9f15253a96977b8b36d5e163cbc2dec06b](https://github.com/StoneCypher/issue_labels/commit/3b3bdb9f15253a96977b8b36d5e163cbc2dec06b)

Author: `John Haugeland <stonecypher@gmail.com>`

  * docs: describe the reserved color box for repo-specific labels




&nbsp;

&nbsp;

## [Untagged] - Aug 23, 2026 7:31:16 AM

Commit [5d110fa902355b0d3aedc24b588b70a937ddcc47](https://github.com/StoneCypher/issue_labels/commit/5d110fa902355b0d3aedc24b588b70a937ddcc47)

Author: `John Haugeland <stonecypher@gmail.com>`

  * docs: document cloning the taxonomy to another tracker
  * Adds instructions for `gh label clone`, which copies all 286 labels to
another repository in one command.
  * Records the failure mode that makes it worth documenting: GitHub treats
label names as case-insensitive for uniqueness, so a target's stock
`bug` blocks the taxonomy's `Bug`. `--force` updates the existing
label's colour and description but does not rename it, and the clone
reports success either way -- the nine stock defaults that collide end
up correct in every respect except their names. Repair is a rename
rather than a delete, which preserves issue assignments.
  * Also records that `documentation`, `invalid` and `wontfix` have no
taxonomy equivalent. The documentation concept is carried by
`Documentation and docgen`, so the short stock label is redundant
rather than missing -- a distinction that reads as an omission
otherwise.




&nbsp;

&nbsp;

## [Untagged] - Aug 18, 2026 2:23:57 PM

Commit [8a683dae17e4499720d9206a926520271c859cb7](https://github.com/StoneCypher/issue_labels/commit/8a683dae17e4499720d9206a926520271c859cb7)

Author: `John Haugeland <stonecypher@gmail.com>`

  * docs: document how to install the taxonomy into a repo
  * The README explained how to generate and colour the taxonomy but never how to apply it, so the fast path kept getting rediscovered — or not. Documents gh label clone as a single call, and records two failure modes that are silent in both directions: GitHub matches label names case-insensitively on creation while storing them case-sensitively, so cloning into a repo that still has the stock lowercase defaults skips their capitalised equivalents without error; and a delete-then-migrate ordering strips type labels off every issue it touches, because --add-label resolves to the surviving lowercase label that --remove-label then deletes. Also notes that gh label list defaults to 30 results, and gives a parity check to run afterward, since both failure modes look like success.
  * Written into base_README.md and mirrored into the generated README.md.




&nbsp;

&nbsp;

## [Untagged] - Jun 3, 2026 7:39:16 AM

Commit [e43efccb58bb68b17e287c9e133f6c78ce979538](https://github.com/StoneCypher/issue_labels/commit/e43efccb58bb68b17e287c9e133f6c78ce979538)

Author: `John Haugeland <stonecypher@gmail.com>`

  * feat(labels): resolve color override chain in the published export
  * The published labels.ts is the external authority but is generated from
the internal standard_issue_label.json, whose `color` is the raw physics
output and deliberately does not reflect the override fields. The export
must resolve those overrides; it previously copied the raw physics color,
shipping muted-center colors that violated the cube-residency invariant.
  * - add src/build_js/export_labels_ts.cjs (npm run export:labels): rewrites
  labels.ts from standard_issue_label.json, resolving overrides in the
  precedence order exaggerated > brand_color > pin > association >
  saving_pin, falling back to the raw physics color
- fix bake_colors.cjs: its serializer dropped the exaggerated and
  saving_pin fields on rewrite; now preserves them, matching
  assign_label_colors.cjs
- add saving_pin to Trivial priority (#c061b2) and Stale (#4ec044); both
  had no override and the physics landed them in the muted center, so
  they failed the 25-75% cube-residency invariant
- correct the labels.ts docblock provenance: prototype.json was dropped,
  so it is now documented as generated from standard_issue_label.json
- drop orphaned generated-docs assets (docs/colors_3d.html, docs/three/)
  that no build step emits any longer
  * Bump 0.3.0 -> 0.4.0 and regenerate build artifacts.




&nbsp;

&nbsp;

## [Untagged] - May 27, 2026 9:11:28 AM

Commit [edf294a3f0cf0498120e4e45d3c8aad5662c74b9](https://github.com/StoneCypher/issue_labels/commit/edf294a3f0cf0498120e4e45d3c8aad5662c74b9)

Author: `John Haugeland <stonecypher@gmail.com>`

Merges [d056a0f, bbace3a]

  * Merge pull request #2 from StoneCypher/feat_26-05-26_labels-typescript-export
  * feat: convert prototype.json to TypeScript labels export, drop stub




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