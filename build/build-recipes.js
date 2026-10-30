// Merges the imported recipes, applies the audit corrections and rebuilds the app in the repo folder.
// Run with: node build/build-recipes.js
const fs = require("fs");
const path = require("path");
const src = __dirname;
const repo = path.dirname(__dirname);
const read = f => fs.readFileSync(f, "utf8").replace(/^﻿/, "");
const all = [];
for (let n = 1; n <= 6; n++) all.push(...JSON.parse(read(`${src}/recipes-data/batch-${n}.json`)));
const byId = {}; for (const r of all) byId[r.id] = r;
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

// Link-to-page blocks in Notion, identified through backlinks: source, text the link follows ('' = own note), target
const links = [
  ["3d9e56f5972280bb997fdfde6e80562f","intro","2d8e56f59722804ba3c2e698fdab230b"],
  ["3a8e56f597228071b654ddb7f5ce4d81","Se metod i sidan nedan","3a8e56f5972280b7944de3907e0398dd"],
  ["2bbe56f5972280ecb19ce8191e334428","intro","2bbe56f5972280b1a5b1ff972f566fae"],
  ["2bbe56f59722805593edff631bb0713a","Servera med potatismos","2bbe56f59722805d91c9e7fe5c0f82ae"],
  ["3eae56f59722800f8ccccf71c81a7ec0","Servera med potatismos","2bbe56f59722805d91c9e7fe5c0f82ae"],
  ["2b6e56f5972280eda612d7a9c8dcb3f4","Servera med polenta","2b6e56f59722804b9d91c7e6a5c6d4c3"],
  ["2e1e56f5972280ceab5cfb45fdcb85f7","Första gången jag gjorde detta","2e1e56f597228056bd85ed563949841a"],
  ["2e1e56f59722809e956fe62d9f8762f6","Vaniljsås till servering","2d8e56f59722804ba3c2e698fdab230b"],
  ["2b6e56f5972280aa937ae8caee6872d3","","2b6e56f5972280e78d89e8e5adb48749"],
  ["2dbe56f59722803380fdfb70a2ab49a0","","2dbe56f5972280f09abbc0cc77ee98ea"],
  ["3d8e56f5972280f38057c7af5321ccc5","Tillaga laxen gärna enligt","303e56f5972280a9a9d6cb724f2341b2"]
];
for (const [from, text, to] of links) {
  const r = byId[from], token = `[[${to}|${byId[to].title}]]`;
  let done = false;
  const attach = lines => lines.map(s => { if (!done && s.includes(text)) { done = true; return `${s}\n${token}`; } return s; });
  if (text === "intro") { r.intro = `${r.intro ?? ""}\n${token}`; done = true; }
  else if (text === "") { r.notes = [...(r.notes || []), { heading: null, lines: [token] }]; done = true; }
  else {
    for (const m of r.method || []) m.steps = attach(m.steps || []);
    for (const n of r.notes || []) if (n) n.lines = attach(n.lines || []);
    if (!done) { r.notes = [...(r.notes || []), { heading: null, lines: [`${text}\n${token}`] }]; console.log(`LINK TEXT NOT FOUND, added as note: ${r.title} / ${text}`); }
  }
}

// Peposa: the four sub-bullets belong to step 3
const p = byId["2b6e56f5972280eda612d7a9c8dcb3f4"], s = p.method[0].steps;
const i = s.findIndex(x => same(x, "Förbered resten av ingredienserna."));
if (i >= 0) p.method[0].steps = [...s.slice(0, i), s[i] + "\n– " + s.slice(i + 1, i + 5).join("\n– "), ...s.slice(i + 5)];
else console.log("PEPOSA STEP NOT FOUND");

// Napolitansk Pizza: restore the lost Topping heading
for (const g of byId["39de56f59722808a9ee6dfabc6772a2c"].groups || []) if (same(g.name, "Vit bas 4 st")) g.name = "Topping – Vit bas 4 st";

// Fractions as decimals and a space between number and unit are written in Notion, not here.
const E = s => s == null ? s : String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
// Sub-items of another ingredient in Notion
const nested = ["150 g egenmalt", "300 g vete special", "0,5 dl vatten."];
const out = all.map(r => {
  const groups = (r.groups || []).filter(Boolean).map(g => ({ name: E(g.name), items: (g.items || []).map(([a = "", b = ""]) => {
    a = String(a ?? ""); b = String(b ?? ""); let m;
    if (!a && (m = b.match(/^(\d[\d,./–-]*\s?(?:g|kg|ml|cl|dl|l|msk|tsk|krm|st)(?![\p{L}\p{N}_]))\s*(.*)$/iu))) { a = m[1]; b = m[2]; }
    if (nested.some(x => same(x, `${a} ${b}`.trim())) && ["2b6e56f5972280e78d89e8e5adb48749", "2dbe56f5972280a4b3c7e41a1f144645"].includes(r.id)) a = `– ${a}`;
    return [E(a), E(b)];
  }) }));
  const method = (r.method || []).filter(Boolean).map(m => ({ name: E(m.name), steps: (m.steps || []).map(E) }));
  const notes = (r.notes || []).filter(Boolean).map(n => ({ heading: E(n.heading), lines: (n.lines || []).map(E) }));
  return { id: r.id, notion: `https://app.notion.com/p/${r.id}`, title: E(r.title), intro: E(r.intro), plan: E(r.plan), groups, method, notes };
});
// Escapes like the original PowerShell build, so the output stays byte for byte the same.
const json = JSON.stringify(out).replace(/[<>&']/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
fs.writeFileSync(`${repo}/recipes-data.js`, `const RECIPES = ${json};\n`);
let html = read(`${src}/kokslaget.html`).replace(/\/\/ Texts are copied[\s\S]*?\n\];\r?\n/, "");
if (!html.includes("recipes-data.js")) html = html.replaceAll("<script>\n", `<script src="recipes-data.js"></script>\n<script>\n`);
const pre = `<!doctype html>\n<html lang="sv">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="noindex, nofollow">\n<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>\n\n`;
fs.writeFileSync(`${repo}/index.html`, pre + html);
console.log(`built ${out.length} recipes; inline data gone: ${!html.includes("const RECIPES")}`);
