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
- `build/build-recipes.js` applies corrections and writes `index.html` and `recipes-data.js`. Run `node build/build-recipes.js` after changing `kokslaget.html` or the recipe data, and commit the rebuilt files with the change.
- `files/` holds files a recipe links to, such as a printed PDF. In recipe text `[[files/name.pdf|Text]]` becomes a link in the app; in Notion link to `https://simonjsv98.github.io/recipes/files/name.pdf`.
- A note whose lines read `Lördag 10:00 · Deg — full text` (day optional, ` · ` and ` — ` exact) shows as a timeline with short titles, followed by the full schedule. The space between two times grows with the time between them (square root, capped) and gaps of 45 min or more show their length. Write schedules that way in Notion too.
- `units.js` (the units panel behind the thermometer) and `extras.js` (portion factor, fold-out ingredients under each method step, shopping list, latest recipes) are edited directly.
- In the lists, regions and recipes show their Notion emoji in front of the name. A recipe's emoji is stored as `icon` in the batch files; a region's as `icon` on its node in `TREE`. Each recipe row also shows the total time from its Tid/Planering line (`metaFor`), when there is one.

## Notion

The recipes come from the Notion pages COOK (`251e56f59722801b91d3f2726f9e4031`) and BAKE (`256e56f59722808b972bd9310334a824`). Each recipe's `id` in `recipes-data.js` is its Notion page id. Only COOK, BAKE and FEAST (`40be56f5972281afb7a3fec5e581c09f`) are synced; the PLANNING page under COOK (Recipe Bank, Inköpslista and so on) stays in Notion and is not part of the app.

FEAST holds one page per holiday meal (for example Allahelgonamiddag) with links to recipes that live under COOK or BAKE. A recipe is never moved there. In the app tree such a link is `[title, id, "link"]`: it shows as "Länk till COOK › USA › Proteins", opening it keeps the recipe in its own place, and the recipe shows "Ingår i Allahelgonamiddag".

Notion is the source of truth for how the text is written. Formatting fixes are made in Notion, and in the batch files to match, not in the build script:
- A space between number and unit: `800 g`, `3 msk`, `0,5 L`, `2 h`, `40 s`, `1 pk`, `180 °C`.
- Fractions as decimals with a comma: `0,5`, `1,5`, `0,25`, `0,33`. Scores such as `8/10` stay.
- No estimated time tacked onto a method step ("Vispa smör och socker, cirka 10 minuter."). It reads as how long to do the action. Estimates for planning belong in the Tid/Planering line. A time stays in a step only when it is how long the action itself takes ("Grädda cirka 15 minuter", "Låt sjuda cirka 2 timmar"). Waiting and process times also stay ("Låt svalna cirka 10 minuter", "bryn köttet i omgångar, cirka 20 minuter", "ta fram ägg ur kylen i god tid, cirka 30 minuter"). Simon has approved this judgement.

## Converting recipes

- Amounts in grams first, with the source's own unit in parentheses: `140 g majsmjöl (1 cup)`, `6 g salt (1 tsp)`. Never convert cups to dl.
- Fractions become decimals there too: `0,25 cup`, `0,67 cup`.
- Temperatures in °C and sizes in cm.
- New recipes go into Notion first (under COOK or BAKE, usually in WIP), then into the batch data and the app.

## Core temperatures in `units.js`

- Use Swedish or European sources only, no American ones.
- Prefer people who know good food (chefs, fishmongers, pitmasters) alongside Livsmedelsverket.
- Every number needs a source. The last field of each row in `CORE` names its sources; the keys are listed in the comment above it.
