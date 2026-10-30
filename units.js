// Unit cheat sheet: a full-screen panel opened from the thermometer in the banner.
(function(){
  const toC = f => Math.round((f-32)*5/9);
  const TEMPS = [225,250,275,300,325,350,375,400,425,450,475,500];
  const SECTIONS = [
    ["Volym, USA till metriskt",[["1 cup","237 ml, 2,4 dl"],["¾ cup","178 ml"],["⅔ cup","158 ml"],["½ cup","118 ml"],["⅓ cup","79 ml"],["¼ cup","59 ml"],["1 tbsp","15 ml, 1 msk"],["1 tsp","5 ml, 1 tsk"],["1 fl oz","30 ml"],["1 pint","473 ml"],["1 quart","946 ml"],["1 gallon","3,8 l"]]],
    ["Vikt",[["1 oz","28 g"],["4 oz, ¼ lb","113 g"],["8 oz, ½ lb","227 g"],["1 lb","454 g"],["1 stick smör","113 g"]]],
    ["Svenska mått",[["1 krm","1 ml"],["1 tsk","5 ml"],["1 msk","15 ml, 3 tsk"],["1 dl","100 ml"],["1 kkp","150 ml"]]]
  ];
  // Core temperatures from Swedish sources. The last field of each row names its sources (not shown):
  // lvs  livsmedelsverket.se/livsmedel-och-innehall/bakterier-virus-parasiter-och-mogelsvampar1/bakterier/salmonella
  // svk  svensktkott.se/wp-content/uploads/2020/03/SVK-1151-kottskolan-not-2024.pdf
  // koket  koket.se/vilken-temperatur-ska-kottet-ha, koket.se/sa-lyckas-du-med-laxen
  // landley  landleyskok.se/tips-trix/innertemperatur-och-styckningsdetaljer-for-kott-fagel-och-fisk
  // smakora  smakora.se/innertemperatur-tabell
  // lefesk  lefesk.se/blogs/recept/innertemperatur-lax-sa-vet-du-nar-laxen-ar-klar
  // hank  hankstruebbq.com/se/inner-temperatur
  // svkoket  sousvidekoket.se/flaskkarre-sous-vide
  // gards  gardssallskapet.se/kottguiden/tillaga/innertemperaturer
  const CORE = [
    ["kyckling",[
      ["Bröstfilé, utan ben","70 °C","Saftig och säker","koket landley hank lvs"],
      ["Bröstfilé, sous vide","60–65 °C","1,5–2,5 timmar beroende på tjocklek","svkoket"],
      ["Lårfilé, utan ben","75–80 °C","Mörast så, säker redan vid 70","smakora koket landley lvs"],
      ["Lår och klubba, med ben","80–82 °C","Mät intill benet","koket landley smakora"],
      ["Hel kyckling","82 °C","I låret intill benet","koket smakora landley"],
      ["Kycklingfärs","70–72 °C","Genomstekt","lvs smakora"]
    ]],
    ["lax och fisk",[
      ["Lax, glasig","40–45 °C","Saftig och blank i mitten","lefesk koket"],
      ["Lax, saftig","48–52 °C","Ljusrosa och flagnar","smakora landley koket"],
      ["Lax, genomstekt","56 °C","","smakora"],
      ["Vit fisk, torsk och sej","52–54 °C","Saftig och vit","smakora landley hank koket"],
      ["Vit fisk, genomstekt","56 °C","","smakora landley"]
    ]],
    ["fläsk",[
      ["Fläskfilé, rosa","60–62 °C","","smakora landley"],
      ["Fläskfilé, saftig","65–68 °C","Ljust rosa","smakora landley"],
      ["Fläskytterfilé","60–65 °C","Saftig","landley hank"],
      ["Kotlett, med ben","60–66 °C","Mät i mitten, inte mot benet","landley hank"],
      ["Fläskkarré, stek","65–70 °C","Saftig, traditionellt 75–85","landley smakora koket"],
      ["Fläskkarré, sous vide","62 °C","2 timmar för skivor upp till 3 cm","svkoket"],
      ["Revben, med ben","70–80 °C","Low and slow: lyft dem, är de klara spricker ytan","landley hank"],
      ["Pulled pork, bog eller karré","90–95 °C","Low and slow tills det går att dra isär","hank"],
      ["Fläskfärs och korv","70–72 °C","Genomstekt","lvs smakora landley"]
    ]],
    ["nöt och lamm",[
      ["Nöt, medium rare","52–54 °C","Rosa","svk"],
      ["Nöt, medium","56–60 °C","Ljusrosa","svk"],
      ["Nöt, well done","68–75 °C","Genomstekt","svk"],
      ["Lammfilé och lammracks","56–58 °C","Rosa","smakora landley hank"],
      ["Lammstek","56–60 °C","Rosa","landley smakora hank"],
      ["Lamm, genomstekt","70 °C","","smakora landley gards"],
      ["Köttfärs","70–72 °C","Genomstekt","lvs smakora"]
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
      <div class="unit-pairs">${TEMPS.map(f=>row(f+" °F",toC(f)+" °C")).join("")}</div>
      ${SECTIONS.map(([name,rows])=>`<p class="label unit-section">${name}</p><div class="unit-pairs">${rows.map(r=>row(r[0],r[1])).join("")}</div>`).join("")}
      ${CORE.map(([name,rows])=>`<p class="label unit-section">Innertemperatur, ${name}</p>${rows.map(([name,t,note])=>coreRow(name,t,note)).join("")}`).join("")}
      <p class="core-foot">Mät i den tjockaste delen. Temperaturen stiger några grader medan det vilar, så ta ut det lite innan. Källor: Livsmedelsverket, Svenskt Kött, Köket, Landleys Kök, Smakora, Le Fesk, Hank’s True BBQ och Sousvideköket.</p>
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
