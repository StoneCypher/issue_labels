# Changelog

All notable changes to this project will be documented in this file.

Changelogging the last 10 commits; Full changelog at [CHANGELOG.long.md](CHANGELOG.long.md)



&nbsp;

&nbsp;

Published tags:







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