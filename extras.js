// Portion factor, tappable ingredient words, latest recipes and shopping list.
// Wraps the app's render functions, so the recipe data and core navigation stay untouched.
(function(){
  const store2 = {
    get(k,d){ try { const v = localStorage.getItem(k); return v===null ? d : JSON.parse(v); } catch(e){ return d; } },
    set(k,v){ try { localStorage.setItem(k,JSON.stringify(v)); } catch(e){} }
  };
  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const FRAC = {"½":.5,"¼":.25,"¾":.75,"⅓":1/3,"⅔":2/3,"⅛":.125};

  /* Portion factor */
  const fmt = n => {
    const r = n>=100 ? Math.round(n) : n>=10 ? Math.round(n*10)/10 : Math.round(n*100)/100;
    return String(r).replace(".",",");
  };
  const NUM = /(\d+(?:[.,]\d+)?)?\s?([½¼¾⅓⅔⅛])|(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|\d+(?:[.,]\d+)?(?!\s?%)(?![\d,.])/g;
  function scaleAmount(text,f){
    if (f===1) return text;
    return text.replace(NUM,(m,whole,fr,mw,mn,md,n,d) => {
      let v;
      if (fr) v = (whole?parseFloat(whole.replace(",",".")):0)+FRAC[fr];
      else if (mw) v = +mw + mn/md;
      else if (n) v = n/d;
      else v = parseFloat(m.replace(",","."));
      return fmt(v*f);
    });
  }
  const getFactor = id => store2.get("factor:"+id,1);
  function applyScale(root){
    if (!recipe) return;
    const f = getFactor(recipe.id);
    root.querySelectorAll(".ing .amt").forEach(a => {
      if (a.dataset.o===undefined) a.dataset.o = a.textContent;
      a.textContent = scaleAmount(a.dataset.o,f);
    });
  }
  function factorHtml(id){
    const f = getFactor(id), preset = [.5,1,2].includes(f);
    return `<div class="factor" id="factor">
      <span class="label">Portioner</span>
      <div class="factor-row">
        ${[.5,1,2].map(v=>`<button class="chip ${f===v?"on":""}" data-factor="${v}">${String(v).replace(".",",")}x</button>`).join("")}
        <label class="chip chip-input ${preset?"":"on"}"><input id="factor-input" inputmode="decimal" placeholder="Annat" aria-label="Egen faktor" value="${preset?"":String(f).replace(".",",")}"><span>x</span></label>
      </div>
      <p class="factor-note" ${f===1?"hidden":""}>Mängderna i ingredienslistan är omräknade. Tal i stegens text ändras inte.</p>
    </div>`;
  }
  function setFactor(f){
    store2.set("factor:"+recipe.id,f);
    const row = document.getElementById("factor");
    row.querySelectorAll("[data-factor]").forEach(b=>b.classList.toggle("on",+b.dataset.factor===f));
    row.querySelector(".chip-input").classList.toggle("on",![.5,1,2].includes(f));
    row.querySelector(".factor-note").hidden = f===1;
    applyScale(document.getElementById("page"));
    if (!sheet.hidden) applyScale(sheet);
  }

  /* Tappable words */
  const SKIP = new Set("och med av eller till utan samt ev gärna färsk färska finriven riven rivet skivad skivade hackad hackade finhackad smulad torkad torkade neutral stor stora liten litet små vit vita röd röda grön gröna svart nymalen".split(" "));
  function ingredientKeys(r){
    const list = [];
    r.groups.forEach(g => g.items.forEach(it => {
      const clean = it[1].replace(/&amp;/g,"&").split(/[,(]/)[0];
      const keys = words(clean).filter(w=>w.length>=3 && !SKIP.has(w));
      if (keys.length) list.push({keys,amt:it[0],name:it[1],group:g.name});
    }));
    return list;
  }
  const stem = w => w.replace(/(orna|arna|erna|en|et|na|n)$/,"");
  function wordMatches(w,key){
    if (w===key) return true;
    if (w.length<3) return false;
    if (w.startsWith(key) && key.length>=4 && w.length-key.length<=4) return true;
    const s = stem(w);
    if (s.length>=4 && (key.startsWith(s) && key.length-s.length<=3)) return true;
    if (s.length>=3 && key.endsWith(s) && key.length>s.length) return true;
    return false;
  }
  function markWords(r){
    const list = ingredientKeys(r);
    if (!list.length) return;
    document.querySelectorAll("#page .step .text").forEach(el => {
      const walker = document.createTreeWalker(el,NodeFilter.SHOW_TEXT), nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        const html = esc(node.nodeValue).replace(/[\p{L}]+/gu, m => {
          if (m.length<3) return m;
          const w = norm(m);
          const hits = list.map((x,i)=>x.keys.some(k=>wordMatches(w,k))?i:-1).filter(i=>i>=0);
          return hits.length ? `<span class="ing-word" data-hits="${hits.join(",")}">${m}</span>` : m;
        });
        if (html!==esc(node.nodeValue)){
          const span = document.createElement("span");
          span.innerHTML = html;
          node.replaceWith(span);
        }
      });
    });
  }
  const pop = document.createElement("div");
  pop.className = "ing-pop gutter";
  pop.hidden = true;
  document.body.appendChild(pop);
  function showPop(el){
    const list = ingredientKeys(recipe), f = getFactor(recipe.id);
    const rows = el.dataset.hits.split(",").map(i=>list[+i]);
    pop.innerHTML = `<div class="wrap ing-pop-box">${rows.map(x=>`<div class="ing ${x.amt?"":"noamt"}">${x.amt?`<span class="amt">${scaleAmount(x.amt,f)}</span>`:""}<span>${x.name}${x.group?` <span class="ing-pop-group">${x.group}</span>`:""}</span></div>`).join("")}</div>`;
    pop.hidden = false;
  }

  /* Latest */
  function remember(id){
    store2.set("recent",[id,...store2.get("recent",[]).filter(x=>x!==id)].slice(0,4));
  }
  function latestHtml(){
    const items = store2.get("recent",[]).map(id=>RECIPES.find(r=>r.id===id)).filter(Boolean);
    if (!items.length) return "";
    return `<div class="latest"><p class="label">Senast</p><ul class="recipes">${items.map(r=>`<li><button data-open="${r.id}"><span>${r.title}</span><span class="mark">›</span></button></li>`).join("")}</ul></div>`;
  }

  /* Shopping list */
  let shop = store2.get("shop",[]);
  const saveShop = () => { store2.set("shop",shop); updateBadges(); };
  function addToShop(r){
    const f = getFactor(r.id);
    r.groups.forEach(g=>g.items.forEach(it=>{
      shop.push({id:Date.now()+"-"+Math.random().toString(36).slice(2,7),amt:scaleAmount(it[0],f),name:it[1],src:r.title,done:false});
    }));
    saveShop();
  }
  const plain = s => s.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
  // Same ingredient in the same unit is added together; everything else keeps its own line.
  function exportText(){
    const merged = new Map(), lines = [];
    shop.filter(x=>!x.done).forEach(x => {
      const m = x.amt.match(/^(\d+(?:[.,]\d+)?)\s?([\p{L}]*)$/u);
      const key = norm(x.name);
      if (m && key){
        const k = key+"|"+m[2].toLowerCase();
        const v = parseFloat(m[1].replace(",","."));
        if (merged.has(k)) merged.get(k).v += v;
        else { const e = {v,unit:m[2],name:x.name}; merged.set(k,e); lines.push(e); }
      } else lines.push({raw:(x.amt?x.amt+" ":"")+x.name});
    });
    return lines.map(l=>"- "+plain(l.raw || `${fmt(l.v)}${l.unit?" "+l.unit:""} ${l.name}`)).join("\n");
  }
  const shopPanel = document.createElement("div");
  shopPanel.id = "shop-panel";
  shopPanel.className = "search-panel";
  shopPanel.hidden = true;
  shopPanel.innerHTML = `<div class="gutter"><div class="wrap unit-head"><h2>Inköpslista</h2><button class="search-close" data-shop-close>Stäng</button></div></div>
    <div class="scroll gutter"><div class="wrap" id="shop-body"></div></div>`;
  document.body.appendChild(shopPanel);
  ["touchstart","touchmove","touchend"].forEach(t => shopPanel.addEventListener(t, e => e.stopPropagation(), {passive:true}));
  let confirmClear = false, exportFallback = "";
  function renderShop(){
    const groups = [...new Set(shop.map(x=>x.src))];
    const open = shop.filter(x=>!x.done).length;
    document.getElementById("shop-body").innerHTML = `
      <form class="shop-add" id="shop-add"><input id="shop-new" class="search" placeholder="Lägg till en vara" aria-label="Lägg till en vara" autocomplete="off"><button class="chip" type="submit">Lägg till</button></form>
      ${shop.length ? `<div class="shop-actions">
          <button class="ing-btn" data-shop-copy>Kopiera som text</button>
          ${navigator.share?`<button class="chip" data-shop-share>Dela</button>`:""}
        </div>
        <p class="factor-note">${open} kvar. Avbockade varor kommer inte med i texten.</p>` : `<p class="no-hits">Listan är tom. Öppna ett recept och tryck på "Lägg i inköpslista".</p>`}
      ${exportFallback?`<textarea id="shop-text" class="shop-text" readonly>${esc(exportFallback)}</textarea>`:""}
      ${groups.map(g=>`<p class="label unit-section">${g}</p>${shop.filter(x=>x.src===g).map(x=>`<div class="shop-item ${x.done?"done":""}">
          <button class="shop-check" data-shop-toggle="${x.id}" aria-pressed="${x.done}"><span class="box"></span><span>${x.amt?`<b>${x.amt}</b> `:""}${x.name}</span></button>
          <button class="shop-remove" data-shop-remove="${x.id}" aria-label="Ta bort">×</button>
        </div>`).join("")}`).join("")}
      ${shop.length?`<button class="link shop-clear" data-shop-clear>${confirmClear?"Tryck igen för att tömma listan":"Töm listan"}</button>`:""}`;
    if (exportFallback){ const t = document.getElementById("shop-text"); t.focus(); t.select(); }
  }
  function updateBadges(){
    const n = shop.filter(x=>!x.done).length;
    document.querySelectorAll("[data-nav-shop] .badge").forEach(b => { b.textContent = n; b.hidden = !n; });
  }

  /* Decorating each rendered page */
  const CART = `<button class="icon-btn" data-nav-shop aria-label="Inköpslista"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg><span class="badge" hidden></span></button>`;
  function addNavButton(){
    const right = document.querySelector("#app .nav-right");
    if (right && !right.querySelector("[data-nav-shop]")) right.insertAdjacentHTML("afterbegin",CART);
    updateBadges();
  }
  function decorateRecipe(){
    if (!recipe) return;
    const page = document.getElementById("page");
    const groups = page.querySelectorAll(":scope .wrap > .group");
    if (groups.length && page.querySelector(".ing")){
      const label = [...page.querySelectorAll(".block-label")].find(l=>l.textContent==="Ingredienser");
      label.insertAdjacentHTML("beforebegin",factorHtml(recipe.id));
      groups[groups.length-1].insertAdjacentHTML("afterend",`<button class="chip shop-btn" data-shop-add>Lägg i inköpslista</button>`);
    }
    applyScale(page);
    markWords(recipe);
    remember(recipe.id);
  }

  const wrap = (name,after) => {
    const orig = window[name];
    window[name] = function(){ const out = orig.apply(this,arguments); after(); return out; };
  };
  wrap("showRecipe",() => { pop.hidden = true; decorateRecipe(); addNavButton(); });
  wrap("showNode",() => { pop.hidden = true; addNavButton(); });
  wrap("showStart",() => {
    const tiles = document.querySelector(".home-tiles");
    if (tiles) tiles.insertAdjacentHTML("beforeend",latestHtml());
    addNavButton();
  });
  wrap("openSheet",() => applyScale(sheet));

  document.addEventListener("click", e => {
    const word = e.target.closest(".ing-word");
    if (word){ e.stopPropagation(); showPop(word); return; }
    pop.hidden = true;
  }, true);
  document.addEventListener("click", async e => {
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.factor){ const input = document.getElementById("factor-input"); input.value = ""; setFactor(+d.factor); }
    else if ("shopAdd" in d){ addToShop(recipe); b.textContent = "Tillagt i inköpslistan"; }
    else if ("navShop" in d){ confirmClear = false; exportFallback = ""; renderShop(); shopPanel.hidden = false; }
    else if ("shopClose" in d) shopPanel.hidden = true;
    else if (d.shopToggle){ const x = shop.find(i=>i.id===d.shopToggle); x.done = !x.done; saveShop(); renderShop(); }
    else if (d.shopRemove){ shop = shop.filter(i=>i.id!==d.shopRemove); saveShop(); renderShop(); }
    else if ("shopClear" in d){
      if (confirmClear){ shop = []; confirmClear = false; exportFallback = ""; saveShop(); } else confirmClear = true;
      renderShop();
    }
    else if ("shopCopy" in d){
      const text = exportText();
      try { await navigator.clipboard.writeText(text); b.textContent = "Kopierat"; setTimeout(()=>{ if (b.isConnected) b.textContent = "Kopiera som text"; },1500); }
      catch(err){ exportFallback = text; renderShop(); }
    }
    else if ("shopShare" in d){
      try { await navigator.share({title:"Inköpslista",text:exportText()}); } catch(err){}
    }
  });
  document.addEventListener("input", e => {
    if (e.target.id!=="factor-input") return;
    const v = parseFloat(e.target.value.replace(",","."));
    if (v>0 && v<=1000) setFactor(v);
    else if (!e.target.value) setFactor(1);
  });
  document.addEventListener("submit", e => {
    if (e.target.id!=="shop-add") return;
    e.preventDefault();
    const input = document.getElementById("shop-new"), v = input.value.trim();
    if (!v) return;
    shop.push({id:Date.now()+"-"+Math.random().toString(36).slice(2,7),amt:"",name:esc(v),src:"Egna varor",done:false});
    saveShop(); renderShop();
    document.getElementById("shop-new").focus();
  });
  document.addEventListener("keydown", e => { if (e.key==="Escape"){ shopPanel.hidden = true; pop.hidden = true; } });

  const style = document.createElement("style");
  style.textContent = `
    .factor { margin-top: 28px; }
    .factor-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .chip { min-height: 44px; padding-inline: 16px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 22px; font-weight: 500; font-size: 1rem; background: none; color: var(--ink); font-family: inherit; }
    .chip.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
    .chip-input { padding-inline: 12px; gap: 2px; }
    .chip-input input { width: 3.4em; border: 0; background: none; color: inherit; font: inherit; outline: none; text-align: right; }
    .chip-input input::placeholder { color: var(--muted); }
    .factor-note { color: var(--muted); font-size: .88rem; margin-top: 8px; }
    .shop-btn { margin-top: 16px; }
    .ing-word { border-bottom: 1.5px dotted var(--muted); }
    .ing-pop { position: fixed; left: 0; right: 0; bottom: calc(92px + env(safe-area-inset-bottom, 0px)); z-index: 12; pointer-events: none; }
    .ing-pop-box { background: var(--ink); color: var(--bg); border-radius: 14px; padding: 10px 16px; }
    .ing-pop-box .ing { padding-block: 3px; }
    .ing-pop-group { opacity: .65; font-size: .85em; }
    .latest { flex: none; padding-top: 12px; }
    .latest .label { padding-bottom: 10px; }
    .tile { min-height: 210px; }
    @media (orientation: landscape) { .home-tiles { flex-wrap: wrap; } .tile { flex: 1 1 40%; } .latest { flex: 1 1 100%; } }
    [data-nav-shop] { position: relative; }
    .badge { position: absolute; top: 4px; right: 2px; min-width: 16px; height: 16px; padding-inline: 4px; border-radius: 8px; background: #E63B1F; color: #fff; font-size: 11px; line-height: 16px; font-weight: 600; text-align: center; }
    .shop-add { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
    .shop-add .search { flex: 1; min-width: 0; margin: 0; }
    .shop-actions { display: flex; gap: 8px; margin-top: 14px; }
    .shop-actions .ing-btn { flex: 1; min-height: 52px; }
    .shop-text { width: 100%; min-height: 160px; margin-top: 12px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; font: inherit; font-size: 16px; background: var(--surface); color: var(--ink); }
    .shop-item { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--line); }
    .shop-check { flex: 1; min-width: 0; display: flex; gap: 12px; align-items: flex-start; padding-block: 11px; }
    .shop-check b { font-weight: 600; }
    .box { flex: none; width: 20px; height: 20px; margin-top: 3px; border: 1.5px solid var(--muted); border-radius: 6px; }
    .shop-item.done .box { background: var(--ink); border-color: var(--ink); }
    .shop-item.done .shop-check > span:last-child { opacity: .4; text-decoration: line-through; }
    .shop-remove { flex: none; width: 40px; height: 44px; text-align: center; font-size: 1.4rem; color: var(--muted); }
    .shop-clear { margin-block: 18px 32px; }
  `;
  document.head.appendChild(style);

  // The first page was drawn before this file loaded.
  if (recipe) showRecipe(recipe);
  else if (trail.length===1) showNode();
  else addNavButton();
})();
