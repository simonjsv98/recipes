// Unit cheat sheet: a full-screen panel opened from the thermometer in the banner.
(function(){
  const toC = f => Math.round((f-32)*5/9);
  const TEMPS = [
    [32,"Vatten fryser"],[100,"Jäsning, varmt"],[120,"Sous vide, rosa lax"],[145,"Fläsk och fisk klart"],[160,"Köttfärs klar"],[165,"Kyckling klar"],[212,"Vatten kokar"],
    [225,"Low and slow"],[250,""],[275,"Gas 1"],[300,"Gas 2"],[325,"Gas 3"],[350,"Gas 4, vanlig bakning"],[375,"Gas 5"],[400,"Gas 6, rostning"],[425,"Gas 7"],[450,"Gas 8"],[475,"Gas 9"],[500,"Pizza, bröd"],[550,"Hemmaugn på max"]
  ];
  const SECTIONS = [
    ["Volym, USA till metriskt",[["1 cup","237 ml, 2,4 dl"],["¾ cup","178 ml"],["⅔ cup","158 ml"],["½ cup","118 ml"],["⅓ cup","79 ml"],["¼ cup","59 ml"],["1 tbsp","15 ml, 1 msk"],["1 tsp","5 ml, 1 tsk"],["1 fl oz","30 ml"],["1 pint","473 ml"],["1 quart","946 ml"],["1 gallon","3,8 l"]]],
    ["Vikt",[["1 oz","28 g"],["4 oz, ¼ lb","113 g"],["8 oz, ½ lb","227 g"],["1 lb","454 g"],["1 stick smör","113 g"]]],
    ["Svenska mått",[["1 krm","1 ml"],["1 tsk","5 ml"],["1 msk","15 ml, 3 tsk"],["1 dl","100 ml"],["1 kkp","150 ml"]]]
  ];
  // Core temperatures: Livsmedelsverket for safety, Köket and Svenskt Kött for Swedish practice, Weber, ThermoWorks and USDA for the rest.
  const CORE = [
    ["kyckling",[
      ["Bröstfilé, utan ben","70 °C","Säker och fortfarande saftig"],
      ["Lårfilé, utan ben","70–75 °C","Säker vid 70, mörast vid 75"],
      ["Lår och klubba, med ben","80–82 °C","Mät intill benet"],
      ["Hel kyckling","80–82 °C","I låret intill benet"],
      ["Kycklingfärs","70 °C","Genomstekt"]
    ]],
    ["lax och fisk",[
      ["Lax, glasig","48–52 °C","Saftig och lite genomskinlig i mitten"],
      ["Lax, klar","52–55 °C","Ljusrosa och flagnar"],
      ["Vit fisk, torsk och sej","52–56 °C","Vit och flagnar"],
      ["Fisk, helt genomkokt","63 °C","USDA:s säkerhetsgräns"]
    ]],
    ["fläsk",[
      ["Fläskytterfilé, utan ben","65 °C","Ljusrosa"],
      ["Fläskfilé, utan ben","70 °C",""],
      ["Kotlett, med ben","70 °C","Mät i mitten, inte mot benet"],
      ["Fläskkarré, stek","80–85 °C","Mör och saftig"],
      ["Revben, low and slow","90–95 °C","Lossnar från benet"],
      ["Pulled pork, bog","93–95 °C","Låt vila inslagen innan du river"],
      ["Fläskfärs och korv","70 °C","Genomstekt"]
    ]],
    ["nöt och lamm",[
      ["Nöt, medium rare","52–54 °C","Rosa"],
      ["Nöt, medium","56–60 °C","Ljusrosa"],
      ["Nöt, well done","68–75 °C","Genomstekt"],
      ["Lammfilé och entrecôte","56–70 °C","56 rosa, 70 genomstekt"],
      ["Lammstek","60–70 °C","60 rosa, 70 genomstekt"],
      ["Köttfärs","70 °C","Genomstekt"]
    ]]
  ];
  const coreRow = (name,t,note) => `<div class="core-row"><span class="core-name">${name}${note?`<span class="core-note">${note}</span>`:""}</span><span class="core-t">${t}</span></div>`;
  const row = (a,b,c) => `<div class="unit-row"><span class="unit-a">${a}</span><span class="unit-b">${b}</span>${c===undefined?"":`<span class="unit-c">${c}</span>`}</div>`;

  const style = document.createElement("style");
  style.textContent = `
    .nav-right { justify-self: end; display: flex; margin-right: -10px; }
    .nav-right [data-nav-search] { margin-right: 0; }
    .unit-head { display: flex; align-items: center; justify-content: space-between; min-height: 56px; }
    .unit-head h2 { font: 500 1.15rem/1.2 var(--display); }
    .unit-row { display: grid; grid-template-columns: 5.2em 4.2em minmax(0, 1fr); gap: 8px; padding-block: 9px; border-bottom: 1px solid var(--line); font-variant-numeric: tabular-nums; }
    .unit-row .unit-a { font-weight: 600; }
    .unit-row .unit-c { color: var(--muted); font-size: .92rem; align-self: center; }
    .unit-pairs .unit-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .unit-section { margin-top: 28px; padding-bottom: 6px; }
    .unit-head + .scroll .unit-section:first-child { margin-top: 8px; }
    .core-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; padding-block: 9px; border-bottom: 1px solid var(--line); }
    .core-name { font-weight: 600; }
    .core-note { display: block; font-weight: 400; color: var(--muted); font-size: .92rem; margin-top: 2px; }
    .core-t { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .core-foot { color: var(--muted); font-size: .85rem; margin-top: 14px; padding-bottom: 32px; }
  `;
  document.head.appendChild(style);

  const panel = document.createElement("div");
  panel.id = "units-panel";
  panel.className = "search-panel";
  panel.hidden = true;
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-label","Enheter");
  panel.innerHTML = `<div class="gutter"><div class="wrap unit-head"><h2>Enheter</h2><button class="search-close" data-units-close>Stäng</button></div></div>
    <div class="scroll gutter"><div class="wrap">
      <p class="label unit-section">Fahrenheit till Celsius</p>
      ${TEMPS.map(([f,n])=>row(f+" °F",toC(f)+" °C",n)).join("")}
      ${SECTIONS.map(([name,rows])=>`<p class="label unit-section">${name}</p><div class="unit-pairs">${rows.map(r=>row(r[0],r[1])).join("")}</div>`).join("")}
      ${CORE.map(([name,rows])=>`<p class="label unit-section">Innertemperatur, ${name}</p>${rows.map(r=>coreRow(...r)).join("")}`).join("")}
      <p class="core-foot">Mät i den tjockaste delen. Temperaturen stiger 2–5 °C medan köttet vilar, så ta ut det lite innan. Källor: Livsmedelsverket, Köket, Svenskt Kött, Weber, ThermoWorks och USDA.</p>
    </div></div>`;
  document.body.appendChild(panel);
  // Keeps the swipe-back gesture from starting underneath the panel.
  ["touchstart","touchmove","touchend"].forEach(t => panel.addEventListener(t, e => e.stopPropagation(), {passive:true}));

  document.addEventListener("click", e => {
    if (e.target.closest("[data-nav-units]")) panel.hidden = false;
    else if (e.target.closest("[data-units-close]")) panel.hidden = true;
  });
  document.addEventListener("keydown", e => { if (e.key==="Escape") panel.hidden = true; });
})();
