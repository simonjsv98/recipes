# CLAUDE.md

Keep this file current. When the workflow, the structure or a standing preference changes, update it in the same change.

## Workflow

- The app is served by GitHub Pages from `main`. Finish changes in the session and merge them to `main` right away, so the app updates. No pull request is needed.
- Before merging something larger, save the current `main` as a backup branch named `backup/main-YYYY-MM-DD`.
- Check changes in a phone-width browser (390 px) with Playwright before merging.
- Talk to Simon in Swedish. The app's text is Swedish.

## Structure

- `build/kokslaget.html` is the source of the app. Edit this, not `index.html`.
- `build/recipes-data/batch-*.json` are the recipes as imported from Notion.
- `build/build-recipes.ps1` applies corrections and writes `index.html` and `recipes-data.js`. It needs PowerShell, which the cloud container does not have.
- `units.js` (the units panel behind the thermometer) and `extras.js` (portion factor, shopping list, latest recipes) are edited directly.

## Notion

The recipes come from the Notion pages COOK (`251e56f59722801b91d3f2726f9e4031`) and BAKE (`256e56f59722808b972bd9310334a824`). Each recipe's `id` in `recipes-data.js` is its Notion page id.

## Core temperatures in `units.js`

- Use Swedish or European sources only, no American ones.
- Prefer people who know good food (chefs, fishmongers, pitmasters) alongside Livsmedelsverket.
- Every number needs a source. The last field of each row in `CORE` names its sources; the keys are listed in the comment above it.
