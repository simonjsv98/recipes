# RECIPES

My recipes from Notion, for reading in the kitchen on my phone. Served by GitHub Pages from the repo root.

## Making changes

- `build/kokslaget.html` is the source of the app. Edit this, not `index.html`.
- `build/recipes-data/batch-*.json` are the recipes as imported from Notion.
- `build/build-recipes.ps1` applies corrections and writes `index.html` and `recipes-data.js`. Run it with PowerShell.
- `units.js` and `extras.js` are edited directly.
