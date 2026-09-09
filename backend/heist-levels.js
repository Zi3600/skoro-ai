/* ------------------------------------------------------------------ *
 *  doekoeverzamelaar — de leerlijn
 *
 *  Honderd levels, gegroepeerd per hoofdstuk. De meeste zijn een
 *  UITLEGLEVEL: één element krijgt zijn eigen level, met een lesje
 *  erboven (les.wat / les.hoe / les.punten / les.fout) en daarna een
 *  opdracht waarin je datzelfde element meteen gebruikt.
 *
 *  Een level met een "element" is zo'n uitlegles. Levels zonder
 *  "element" zijn oefenlevels: die combineren wat je net leerde.
 *
 *  Nakijken gebeurt op de server (heist-check.js). De eis-soorten:
 *    tag / selector / attr / nesting / tekst / tagTekst / verschillend
 *    css / cssRuw / geen / geenRuwe / ruweTelling
 *
 *  Levels leveren GEEN krediet op, alleen voortgang. Krediet komt van
 *  de dagelijkse doekoe. Daarom mogen hints hier wel.
 * ------------------------------------------------------------------ */

const LEERLIJN = [

  /* ================== hoofdstuk 1 — tekst en koppen ================= */

  {
    id: "t-h1", groep: "tekst en koppen", element: "h1",
    titel: "<h1> — de hoofdtitel",
    uitleg: "Zet één <h1> op de pagina met de naam van je pagina erin.",
    les: {
      wat: "De <h1> is de grootste kop: waar gaat deze pagina over. Eén per pagina, bovenaan.",
      hoe: `<h1>lokaal b16</h1>`,
      punten: [
        "een kop is geen dikke tekst, het is een niveau: de browser en Google lezen eruit hoe je pagina in elkaar zit",
        "de <h1> staat op de pagina zelf, niet in het tabblad van de browser",
        "je sluit hem af met </h1>",
      ],
      fout: "Een <h1> pakken omdat je iets groot wil hebben. Groot maken doe je met CSS, een kop kies je om wat hij betekent.",
    },
    tip: "Schrijf <h1>jouw titel</h1>. De sluittag heeft een schuine streep.",
    start: { html: `<!-- zet hier je hoofdtitel -->\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, minTekens: 3, omschrijving: "er staat een <h1> met tekst erin" },
    ],
  },
  {
    id: "t-h2", groep: "tekst en koppen", element: "h2",
    titel: "<h2> — de tussenkop",
    uitleg: "Onder de <h1> staan twee stukken. Geef elk stuk een eigen <h2>.",
    les: {
      wat: "De <h2> deelt je pagina op in stukken. Elk hoofdstuk van je pagina begint met een <h2>.",
      hoe: `<h1>het lokaal</h1>\n<h2>het bord</h2>\n<h2>de chat</h2>`,
      punten: [
        "zoveel <h2> als je stukken hebt, dat mag",
        "een <h2> hoort onder een <h1>, niet erboven",
        "sla geen niveau over: na <h1> komt <h2>, niet meteen <h3>",
      ],
      fout: "Een <h2> gebruiken omdat de <h1> te groot oogt. Dat los je in CSS op met font-size.",
    },
    tip: "Twee keer <h2>tekst</h2>, allebei met andere tekst erin.",
    start: { html: `<h1>het lokaal</h1>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "de <h1> staat er nog" },
      { soort: "tag", tag: "h2", minAantal: 2, nietLeeg: true, omschrijving: "er staan twee <h2> koppen" },
      { soort: "verschillend", tag: "h2", minAantal: 2, omschrijving: "die twee koppen zeggen niet hetzelfde" },
    ],
  },
  {
    id: "t-h3", groep: "tekst en koppen", element: "h3",
    titel: "<h3> — de onderkop",
    uitleg: "Zet onder je <h2> een <h3> met een kleiner onderdeel erin.",
    les: {
      wat: "De <h3> is een stuk binnen een stuk. Hoofdstuk 2 heeft paragraaf 2.1, dat is je <h3>.",
      hoe: `<h2>het bord</h2>\n<h3>tekenen</h3>\n<h3>wissen</h3>`,
      punten: [
        "h1, h2, h3 is een boom: elke kop hangt onder de kop erboven",
        "de nummers gaan tot 6, maar verder dan h3 kom je zelden",
        "een schermlezer springt van kop naar kop, daarom zijn de niveaus geen versiering",
      ],
      fout: "Van <h2> meteen naar <h4> springen. Er zit dan een gat in je boom.",
    },
    tip: "Eerst <h2>...</h2>, daarna <h3>...</h3>.",
    start: { html: `<h1>het lokaal</h1>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "h2", nietLeeg: true, omschrijving: "er is een <h2>" },
      { soort: "tag", tag: "h3", nietLeeg: true, omschrijving: "en daaronder een <h3> met tekst" },
    ],
  },
  {
    id: "t-hn", groep: "tekst en koppen", element: "h4 h5 h6",
    titel: "<h4> <h5> <h6> — de kleine koppen",
    uitleg: "Bouw de hele ladder: een <h4>, een <h5> en een <h6> onder elkaar.",
    les: {
      wat: "Na h3 komen h4, h5 en h6. Zes niveaus, meer bestaan er niet.",
      hoe: `<h4>materiaal</h4>\n<h5>stiften</h5>\n<h6>zwart</h6>`,
      punten: [
        "h6 is het diepste niveau dat HTML kent",
        "kom je bij h5 uit, dan is je pagina meestal te diep: knip hem in twee pagina's",
        "ze worden standaard kleiner, maar dat is niet waarom je ze kiest",
      ],
      fout: "Denken dat <h6> voor kleine tekst is. Kleine tekst is <small>, of gewoon CSS.",
    },
    tip: "Drie regels: <h4>...</h4>, <h5>...</h5>, <h6>...</h6>.",
    start: { html: `<h3>het bord</h3>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "h4", nietLeeg: true, omschrijving: "er is een <h4>" },
      { soort: "tag", tag: "h5", nietLeeg: true, omschrijving: "er is een <h5>" },
      { soort: "tag", tag: "h6", nietLeeg: true, omschrijving: "er is een <h6>" },
    ],
  },
  {
    id: "t-p", groep: "tekst en koppen", element: "p",
    titel: "<p> — de alinea",
    uitleg: "Schrijf twee alinea's onder elkaar over wat je in het weekend deed.",
    les: {
      wat: "De <p> is een alinea: een blok lopende tekst. Bijna alle tekst op het web zit in een <p>.",
      hoe: `<p>we hebben het bord leeggemaakt.</p>\n<p>daarna begon iedereen opnieuw.</p>`,
      punten: [
        "elke alinea krijgt zijn eigen <p>, niet allemaal in één",
        "de browser zet er vanzelf ruimte boven en onder",
        "losse tekst zonder <p> werkt wel, maar dan heb je niets om in CSS te pakken",
      ],
      fout: "Twee alinea's in één <p> zetten met een <br> ertussen. Dan is het voor de browser nog steeds één alinea.",
    },
    tip: "Twee keer <p>tekst</p> onder elkaar.",
    start: { html: `<h1>mijn weekend</h1>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "p", minAantal: 2, nietLeeg: true, omschrijving: "er staan twee <p> met tekst" },
      { soort: "verschillend", tag: "p", minAantal: 2, omschrijving: "ze zeggen allebei iets anders" },
    ],
  },
  {
    id: "t-br", groep: "tekst en koppen", element: "br",
    titel: "<br> — de regelafbreking",
    uitleg: "Zet een adres in één <p>, met een <br> na elke regel.",
    les: {
      wat: "De <br> breekt de regel af zonder een nieuwe alinea te beginnen. Voor dingen die op regels horen: een adres, een gedicht, songtekst.",
      hoe: `<p>school b16<br>\nklaslokaal 2<br>\nhasselt</p>`,
      punten: [
        "<br> heeft geen sluittag, het is een van de weinige elementen zonder inhoud",
        "een enter in je code doet niets, de browser plakt regels aan elkaar",
        "<br><br> voor extra ruimte werkt, maar hoort met CSS te gebeuren (margin)",
      ],
      fout: "<br> gebruiken om alinea's te maken. Twee alinea's zijn twee <p>.",
    },
    tip: "Binnen één <p> zet je <br> aan het einde van elke regel.",
    start: { html: `<h1>waar we zitten</h1>\n<p>vul hier het adres in</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "er is een <p> met tekst" },
      { soort: "tag", tag: "br", minAantal: 2, omschrijving: "er staan minstens twee <br> in" },
      { soort: "nesting", kind: "br", ouder: "p", omschrijving: "de <br> staan binnen de <p>" },
    ],
  },
  {
    id: "t-hr", groep: "tekst en koppen", element: "hr",
    titel: "<hr> — de scheidingslijn",
    uitleg: "Zet twee stukken tekst neer met een <hr> ertussen.",
    les: {
      wat: "De <hr> is een streep over de pagina: hier stopt het ene onderwerp en begint het volgende.",
      hoe: `<p>het oude bord</p>\n<hr>\n<p>het nieuwe bord</p>`,
      punten: [
        "ook <hr> heeft geen sluittag",
        "hij betekent iets: een overgang, geen versiering",
        "wil je alleen een streepje voor de sier, gebruik dan border-bottom in CSS",
      ],
      fout: "Een rij <hr> onder elkaar zetten om ruimte te maken.",
    },
    tip: "<hr> staat op zijn eigen regel, tussen je twee <p> in.",
    start: { html: `<p>voor de pauze</p>\n<p>na de pauze</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "hr", omschrijving: "er staat een <hr> op de pagina" },
      { soort: "tag", tag: "p", minAantal: 2, nietLeeg: true, omschrijving: "met een <p> ervoor en erna" },
    ],
  },
  {
    id: "t-strong", groep: "tekst en koppen", element: "strong",
    titel: "<strong> — dit is belangrijk",
    uitleg: "Schrijf een waarschuwing en zet het belangrijkste stuk in <strong>.",
    les: {
      wat: "<strong> zegt: dit is belangrijk. De browser maakt het dik, maar de betekenis is het punt.",
      hoe: `<p><strong>let op:</strong> het bord wordt elke dag gewist.</p>`,
      punten: [
        "een schermlezer legt er nadruk op, precies zoals jij zou doen",
        "<strong> staat midden in je tekst, in een <p>",
        "gebruik het spaarzaam: alles belangrijk is niets belangrijk",
      ],
      fout: "<strong> pakken omdat je dikke letters wil. Dat is <b>, of nog beter font-weight in CSS.",
    },
    tip: "<p>gewone tekst <strong>belangrijk woord</strong> gewone tekst</p>",
    start: { html: `<p>het bord wordt elke dag gewist.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "strong", nietLeeg: true, omschrijving: "er is een <strong> met tekst" },
      { soort: "nesting", kind: "strong", ouder: "p", omschrijving: "de <strong> staat in een <p>" },
    ],
  },
  {
    id: "t-em", groep: "tekst en koppen", element: "em",
    titel: "<em> — de nadruk",
    uitleg: "Schrijf een zin waarin één woord anders wordt uitgesproken, en zet dat in <em>.",
    les: {
      wat: "<em> legt klemtoon op een woord. Je hoort het verschil als je de zin hardop leest.",
      hoe: `<p>ik zei dat je <em>niet</em> mocht wissen.</p>`,
      punten: [
        "de browser maakt het schuin, maar em staat voor emphasis: klemtoon",
        "verplaats je de <em>, dan verandert de betekenis van de zin",
        "<em> in <strong> mag: dubbele nadruk",
      ],
      fout: "<em> nemen voor een filmtitel of een vreemd woord. Dat is <i>.",
    },
    tip: "<p>ik zei <em>niet</em> wissen</p>",
    start: { html: `<p>ik zei dat je niet mocht wissen.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "em", nietLeeg: true, omschrijving: "er is een <em> met tekst" },
      { soort: "nesting", kind: "em", ouder: "p", omschrijving: "de <em> staat in een <p>" },
    ],
  },
  {
    id: "t-b", groep: "tekst en koppen", element: "b",
    titel: "<b> — dik, zonder betekenis",
    uitleg: "Zet een productnaam dik met <b>, en de waarschuwing in dezelfde tekst met <strong>.",
    les: {
      wat: "<b> maakt tekst dik zonder te zeggen dat het belangrijk is. Voor namen en trefwoorden die mogen opvallen.",
      hoe: `<p>de <b>stift</b> ligt in de la. <strong>niet op het raam schrijven.</strong></p>`,
      punten: [
        "<b> en <strong> zien er hetzelfde uit, maar alleen <strong> betekent iets",
        "een schermlezer doet niets extra met <b>",
        "twijfel je? neem <strong>",
      ],
      fout: "Alles <b> maken. Dan weet niemand meer wat echt belangrijk is.",
    },
    tip: "Je hebt in dezelfde pagina zowel een <b> als een <strong> nodig.",
    start: { html: `<p>de stift ligt in de la. niet op het raam schrijven.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "b", nietLeeg: true, omschrijving: "er is een <b>" },
      { soort: "tag", tag: "strong", nietLeeg: true, omschrijving: "en een <strong>" },
    ],
  },
  {
    id: "t-i", groep: "tekst en koppen", element: "i",
    titel: "<i> — schuin, zonder betekenis",
    uitleg: "Noem een filmtitel of een woord uit een andere taal en zet dat in <i>.",
    les: {
      wat: "<i> is schuine tekst zonder klemtoon: titels van boeken en films, woorden uit een andere taal, gedachten.",
      hoe: `<p>we keken <i>the italian job</i> in de les.</p>`,
      punten: [
        "<i> is hoe het eruitziet, <em> is wat je bedoelt",
        "voor een titel als bron bestaat ook <cite>, die is nog preciezer",
        "een schermlezer leest <i> gewoon voor, zonder klemtoon",
      ],
      fout: "<i> gebruiken om ergens de nadruk op te leggen. Neem dan <em>.",
    },
    tip: "<i>titel</i> midden in een <p>.",
    start: { html: `<p>we keken the italian job in de les.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "i", nietLeeg: true, omschrijving: "er is een <i> met tekst" },
      { soort: "nesting", kind: "i", ouder: "p", omschrijving: "hij staat in een <p>" },
    ],
  },
  {
    id: "t-mark", groep: "tekst en koppen", element: "mark",
    titel: "<mark> — de markeerstift",
    uitleg: "Zet in een zin het zoekwoord in <mark>, alsof je het net hebt opgezocht.",
    les: {
      wat: "<mark> is de gele markeerstift: dit stukje is nu even belangrijk voor de lezer, bijvoorbeeld omdat hij erop zocht.",
      hoe: `<p>je zocht op <mark>bord</mark> en vond drie resultaten.</p>`,
      punten: [
        "standaard een gele achtergrond, aan te passen met CSS",
        "het gaat om nu belangrijk, niet altijd belangrijk (dat is <strong>)",
        "je ziet het vaak in zoekresultaten",
      ],
      fout: "<mark> als vervanger van <strong> door de hele tekst heen gebruiken.",
    },
    tip: "<mark>woord</mark> binnen je alinea.",
    start: { html: `<p>je zocht op bord en vond drie resultaten.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "mark", nietLeeg: true, omschrijving: "er is een <mark> met tekst" },
    ],
  },
  {
    id: "t-small", groep: "tekst en koppen", element: "small",
    titel: "<small> — de kleine lettertjes",
    uitleg: "Zet onderaan de pagina een regel met de kleine lettertjes in <small>.",
    les: {
      wat: "<small> is voor bijzaken: voorwaarden, copyright, een disclaimer. De kleine lettertjes.",
      hoe: `<p><small>prijzen onder voorbehoud van typfouten.</small></p>`,
      punten: [
        "de betekenis is bijzaak, dat het kleiner wordt is bijvangst",
        "je vindt het meestal in de <footer>",
        "wil je gewoon kleine tekst? dan is font-size in CSS de juiste keuze",
      ],
      fout: "Een hele alinea in <small> zetten om ruimte te sparen.",
    },
    tip: "<small>tekst</small>, bijvoorbeeld binnen een <p>.",
    start: { html: `<h1>doekoeverzamelaar</h1>\n<p>alle levels van b16</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "small", nietLeeg: true, omschrijving: "er is een <small> met tekst" },
    ],
  },
  {
    id: "t-span", groep: "tekst en koppen", element: "span",
    titel: "<span> — het haakje om een woord",
    uitleg: "Zet één woord in een <span> met class=\"accent\" en geef die klasse een kleur.",
    les: {
      wat: "<span> betekent niets. Het is een haakje dat je om een stukje tekst zet zodat je het met CSS kan pakken.",
      hoe: `<p>we zitten in <span class="accent">b16</span>.</p>`,
      punten: [
        "<span> blijft in de regel staan, <div> begint een nieuwe regel",
        "zonder class of id heeft een <span> geen enkel nut",
        "bestaat er een element dat wel iets betekent (<strong>, <em>, <time>), neem dat",
      ],
      fout: "Overal <span> gebruiken waar een gewoon element had gekund.",
    },
    tip: "<span class=\"accent\">b16</span>, en in CSS .accent { color: ...; }",
    start: { html: `<p>we zitten in b16.</p>\n`, css: `/* geef .accent een kleur */\n` },
    eisen: [
      { soort: "selector", selector: "span.accent", nietLeeg: true, omschrijving: "er is een <span class=\"accent\"> met tekst" },
      { soort: "css", selector: ".accent", eigenschap: "color", omschrijving: ".accent krijgt een color in de CSS" },
    ],
  },
  {
    id: "t-blockquote", groep: "tekst en koppen", element: "blockquote",
    titel: "<blockquote> — het citaatblok",
    uitleg: "Citeer iemand in een <blockquote> met een <p> erin.",
    les: {
      wat: "<blockquote> is een citaat dat een blok op zichzelf is: je neemt een stuk tekst van iemand anders over.",
      hoe: `<blockquote>\n  <p>het bord is van iedereen.</p>\n</blockquote>`,
      punten: [
        "de tekst binnenin zet je in een <p>",
        "met cite=\"https://...\" zeg je waar het vandaan komt",
        "de browser springt het blok automatisch in",
      ],
      fout: "<blockquote> gebruiken om iets in te springen. Inspringen doe je met margin.",
    },
    tip: "<blockquote><p>citaat</p></blockquote>",
    start: { html: `<h2>wat de klas zei</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "blockquote", nietLeeg: true, omschrijving: "er is een <blockquote>" },
      { soort: "nesting", kind: "p", ouder: "blockquote", omschrijving: "met een <p> erin" },
    ],
  },

  /* =============== hoofdstuk 2 — tekst voor gevorderden ============= */

  {
    id: "t2-q", groep: "tekst voor gevorderden", element: "q",
    titel: "<q> — het korte citaat",
    uitleg: "Haal iemand aan midden in een zin met <q>.",
    les: {
      wat: "<q> is een citaat van een paar woorden, midden in je zin. De browser zet er zelf aanhalingstekens omheen.",
      hoe: `<p>hij zei <q>morgen is er weer een bord</q> en liep weg.</p>`,
      punten: [
        "typ zelf geen aanhalingstekens, die komen automatisch",
        "een citaat van een hele alinea is <blockquote>, niet <q>",
        "de aanhalingstekens passen zich aan de taal aan",
      ],
      fout: "Aanhalingstekens erbij typen, zodat je er twee paar krijgt.",
    },
    tip: "<q>tekst</q> binnen een <p>, zonder aanhalingstekens erbij.",
    start: { html: `<p>hij zei morgen is er weer een bord en liep weg.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "q", nietLeeg: true, omschrijving: "er is een <q> met tekst" },
      { soort: "nesting", kind: "q", ouder: "p", omschrijving: "hij staat midden in een <p>" },
    ],
  },
  {
    id: "t2-cite", groep: "tekst voor gevorderden", element: "cite",
    titel: "<cite> — de bron",
    uitleg: "Zet een citaat neer en noem de titel van het werk in <cite>.",
    les: {
      wat: "<cite> is de titel van het werk waar je uit citeert: een boek, een film, een artikel, een liedje.",
      hoe: `<p><q>het bord is van iedereen</q> — <cite>de huisregels van b16</cite></p>`,
      punten: [
        "<cite> is de titel, niet de naam van de persoon",
        "de browser zet het schuin",
        "je ziet het vaak onder een <blockquote>",
      ],
      fout: "De naam van de schrijver in <cite> zetten. Het gaat om de titel van het werk.",
    },
    tip: "<cite>titel van het werk</cite>",
    start: { html: `<blockquote>\n  <p>het bord is van iedereen.</p>\n</blockquote>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "blockquote", omschrijving: "het citaat staat er nog" },
      { soort: "tag", tag: "cite", nietLeeg: true, omschrijving: "er is een <cite> met een titel erin" },
    ],
  },
  {
    id: "t2-abbr", groep: "tekst voor gevorderden", element: "abbr",
    titel: "<abbr> — de afkorting",
    uitleg: "Schrijf ICW als afkorting en zet de volledige naam in het title-attribuut.",
    les: {
      wat: "<abbr> markeert een afkorting. In title zet je waar hij voor staat, en dat verschijnt als je erover zweeft.",
      hoe: `<p><abbr title="informatica- en communicatiewetenschappen">ICW</abbr> is een richting.</p>`,
      punten: [
        "zonder title heeft <abbr> weinig zin",
        "de browser zet er meestal een stippellijn onder",
        "op een telefoon kan je niet zweven, dus schrijf de eerste keer ook gewoon voluit",
      ],
      fout: "De afkorting in het title zetten en de volledige naam ertussen. Het is precies andersom.",
    },
    tip: "<abbr title=\"volledige naam\">AFK</abbr>",
    start: { html: `<p>ICW is een richting op onze school.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "abbr", nietLeeg: true, omschrijving: "er is een <abbr> met een afkorting erin" },
      { soort: "attr", tag: "abbr", attribuut: "title", nietLeeg: true, omschrijving: "met een title die hem uitlegt" },
    ],
  },
  {
    id: "t2-code", groep: "tekst voor gevorderden", element: "code",
    titel: "<code> — code midden in tekst",
    uitleg: "Leg in een zin uit welke tag een kop maakt, en zet die tag in <code>.",
    les: {
      wat: "<code> zegt: dit stukje is computercode. De browser zet het in een lettertype waarin elke letter even breed is.",
      hoe: `<p>een kop maak je met <code>&lt;h1&gt;</code>.</p>`,
      punten: [
        "wil je echte punthaken tonen, schrijf dan &lt; en &gt;",
        "een blok code van meerdere regels zet je in <pre> met <code> erin",
        "het is voor code, niet voor elke tekst die je in een ander lettertype wil",
      ],
      fout: "Gewoon <h1> in je tekst typen: de browser maakt er dan een echte kop van.",
    },
    tip: "<code>&lt;h1&gt;</code> — de &lt; en &gt; zijn de punthaken.",
    start: { html: `<p>een kop maak je met een tag.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "code", nietLeeg: true, omschrijving: "er is een <code> met iets erin" },
      { soort: "nesting", kind: "code", ouder: "p", omschrijving: "hij staat midden in een <p>" },
    ],
  },
  {
    id: "t2-pre", groep: "tekst voor gevorderden", element: "pre",
    titel: "<pre> — precies zoals je het typt",
    uitleg: "Zet een blokje code van twee regels in een <pre> met een <code> erin.",
    les: {
      wat: "<pre> houdt je spaties en enters precies zoals je ze typt. Overal anders plakt de browser regels aan elkaar.",
      hoe: `<pre><code>body {\n  color: black;\n}</code></pre>`,
      punten: [
        "<pre> plus <code> is het standaardpaar voor een codeblok",
        "inspringen in je HTML komt mee in beeld, dus begin links",
        "de tekst loopt niet af, dus lange regels krijgen een schuifbalk",
      ],
      fout: "Een codeblok in een <p> zetten. Dan verdwijnen al je enters.",
    },
    tip: "<pre><code>regel 1\\nregel 2</code></pre> — druk gewoon op enter tussen de regels.",
    start: { html: `<h3>voorbeeld</h3>\n`, css: `` },
    /* De <code> in een <pre> zoeken we in de ruwe tekst. Een HTML-parser
       leest alles binnen <pre> als kale tekst, dus in de geparste boom
       bestaat die <code> niet. Zie ook ruweTelling in heist-check.js. */
    eisen: [
      { soort: "tag", tag: "pre", nietLeeg: true, omschrijving: "er is een <pre> met inhoud" },
      { soort: "ruweTelling", patroon: "<code", omschrijving: "met een <code> erin" },
      { soort: "ruweTelling", patroon: "</code>", omschrijving: "die je ook netjes sluit" },
    ],
  },
  {
    id: "t2-kbd", groep: "tekst voor gevorderden", element: "kbd",
    titel: "<kbd> — de toets",
    uitleg: "Leg uit hoe je opslaat, en zet de toetsen in <kbd>.",
    les: {
      wat: "<kbd> is een toets die de gebruiker moet indrukken. Handig in uitleg en handleidingen.",
      hoe: `<p>opslaan doe je met <kbd>ctrl</kbd> + <kbd>s</kbd>.</p>`,
      punten: [
        "elke toets krijgt zijn eigen <kbd>",
        "met CSS maak je er zo een echt toetsje van (border en border-radius)",
        "wat de computer terugzegt is <samp>, dat is de tegenhanger",
      ],
      fout: "Alle toetsen in één <kbd> zetten: ctrl + s hoort in twee.",
    },
    tip: "<kbd>ctrl</kbd> + <kbd>s</kbd>",
    start: { html: `<p>opslaan doe je met ctrl en s.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "kbd", minAantal: 2, nietLeeg: true, omschrijving: "er staan twee <kbd> toetsen" },
    ],
  },
  {
    id: "t2-del", groep: "tekst voor gevorderden", element: "del",
    titel: "<del> — geschrapt",
    uitleg: "Schrap een oude prijs of afspraak met <del>.",
    les: {
      wat: "<del> is tekst die geschrapt is: een oude prijs, een afspraak die niet doorgaat. Je laat zien dat hij er stond.",
      hoe: `<p>de les begint om <del>8:30</del> 9:00.</p>`,
      punten: [
        "de browser zet er een streep door",
        "met datetime=\"2026-09-05\" leg je vast wanneer het geschrapt is",
        "wat ervoor in de plaats komt zet je in <ins>",
      ],
      fout: "<del> gebruiken om iets door te strepen als grap. Er hangt betekenis aan: dit is echt geschrapt.",
    },
    tip: "<del>oude tekst</del> nieuwe tekst",
    start: { html: `<p>de les begint om 8:30.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "del", nietLeeg: true, omschrijving: "er is een <del> met tekst" },
    ],
  },
  {
    id: "t2-ins", groep: "tekst voor gevorderden", element: "ins",
    titel: "<ins> — erbij gezet",
    uitleg: "Schrap de oude tijd met <del> en zet de nieuwe erbij met <ins>.",
    les: {
      wat: "<ins> is tekst die later is toegevoegd. Samen met <del> zie je wat er veranderd is.",
      hoe: `<p>de les begint om <del>8:30</del> <ins>9:00</ins>.</p>`,
      punten: [
        "de browser onderstreept het",
        "<del> en <ins> horen bij elkaar: eruit en erin",
        "je ziet het bij aangepaste artikelen en prijzen",
      ],
      fout: "<ins> gebruiken om te onderstrepen. Onderstrepen is <u>, of text-decoration in CSS.",
    },
    tip: "Eerst <del>...</del>, dan <ins>...</ins>.",
    start: { html: `<p>de les begint om <del>8:30</del>.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "del", nietLeeg: true, omschrijving: "de <del> staat er" },
      { soort: "tag", tag: "ins", nietLeeg: true, omschrijving: "en er is een <ins> met de nieuwe tekst" },
    ],
  },
  {
    id: "t2-subsup", groep: "tekst voor gevorderden", element: "sub sup",
    titel: "<sub> en <sup> — onder en boven de regel",
    uitleg: "Schrijf H2O met <sub> en 2 tot de macht 10 met <sup>.",
    les: {
      wat: "<sub> zet een teken onder de regel (H2O), <sup> zet het erboven (2 tot de macht 10, of de m2 van een oppervlakte).",
      hoe: `<p>water is H<sub>2</sub>O. een kilobyte is 2<sup>10</sup> bytes.</p>`,
      punten: [
        "sub is subscript, sup is superscript",
        "het gaat om scheikunde en wiskunde, niet om kleine lettertjes",
        "voetnootnummers zet je ook in <sup>",
      ],
      fout: "sub en sup verwisselen. sub gaat naar beneden, sup naar boven.",
    },
    tip: "H<sub>2</sub>O en 2<sup>10</sup>",
    start: { html: `<p>water is H2O. een kilobyte is 2 tot de macht 10 bytes.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "sub", nietLeeg: true, omschrijving: "er is een <sub>" },
      { soort: "tag", tag: "sup", nietLeeg: true, omschrijving: "en een <sup>" },
    ],
  },

  /* ==================== hoofdstuk 3 — lijsten ====================== */

  {
    id: "li-ul", groep: "lijsten", element: "ul",
    titel: "<ul> — de lijst zonder volgorde",
    uitleg: "Maak een lijst van drie dingen die in je tas zitten.",
    les: {
      wat: "<ul> is een lijst waarbij de volgorde niet uitmaakt: een boodschappenlijstje, een opsomming van kenmerken.",
      hoe: `<ul>\n  <li>stift</li>\n  <li>laptop</li>\n  <li>brooddoos</li>\n</ul>`,
      punten: [
        "ul staat voor unordered list",
        "in een <ul> mag alleen een <li> staan, niets anders",
        "de bolletjes haal je weg met list-style: none in CSS",
      ],
      fout: "Losse <li> zonder <ul> eromheen. Een regel zonder lijst bestaat niet.",
    },
    tip: "<ul> eromheen, en drie keer <li>...</li> erin.",
    start: { html: `<h2>in mijn tas</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "ul", omschrijving: "er is een <ul>" },
      { soort: "tag", tag: "li", minAantal: 3, nietLeeg: true, omschrijving: "met drie <li> met tekst" },
      { soort: "nesting", kind: "li", ouder: "ul", omschrijving: "de <li> zitten in de <ul>" },
    ],
  },
  {
    id: "li-ol", groep: "lijsten", element: "ol",
    titel: "<ol> — de lijst met volgorde",
    uitleg: "Schrijf in drie stappen op hoe je inlogt in lokaal b16.",
    les: {
      wat: "<ol> is een lijst waarbij de volgorde uitmaakt: stappen, een recept, een top drie. De browser nummert zelf.",
      hoe: `<ol>\n  <li>ga naar de site</li>\n  <li>vul je naam in</li>\n  <li>druk op inloggen</li>\n</ol>`,
      punten: [
        "ol staat voor ordered list",
        "typ de nummers niet zelf, die komen automatisch",
        "met start=\"5\" begint hij bij vijf, met reversed telt hij terug",
      ],
      fout: "In elke <li> zelf 1. 2. 3. typen. Dan staat het er dubbel.",
    },
    tip: "<ol> met drie <li> erin, zonder zelf nummers te typen.",
    start: { html: `<h2>zo log je in</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "ol", omschrijving: "er is een <ol>" },
      { soort: "tag", tag: "li", minAantal: 3, nietLeeg: true, omschrijving: "met drie stappen erin" },
      { soort: "nesting", kind: "li", ouder: "ol", omschrijving: "de <li> zitten in de <ol>" },
    ],
  },
  {
    id: "li-li", groep: "lijsten", element: "li",
    titel: "<li> — de regel van een lijst",
    uitleg: "Maak een lijst waarin één regel een link naar een site bevat.",
    les: {
      wat: "<li> is één regel van een lijst. Er mag van alles in: tekst, een link, een foto, zelfs een hele lijst.",
      hoe: `<ul>\n  <li>gewone regel</li>\n  <li><a href="https://onderwijskiezer.be">een link in een regel</a></li>\n</ul>`,
      punten: [
        "een <li> hoort altijd in een <ul> of een <ol>",
        "een <li> mag meer bevatten dan alleen tekst",
        "de browser sluit een vergeten </li> stilletjes zelf, maar sluit hem toch",
      ],
      fout: "Een <li> los op de pagina zetten, zonder lijst eromheen.",
    },
    tip: "In één <li> zet je een <a href=\"...\">tekst</a>.",
    start: { html: `<h2>handige links</h2>\n<ul>\n  <li>onze school</li>\n</ul>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "li", minAantal: 2, nietLeeg: true, omschrijving: "er zijn minstens twee <li>" },
      { soort: "selector", selector: "li a", omschrijving: "in één van die <li> staat een <a>" },
      { soort: "attr", tag: "a", attribuut: "href", nietLeeg: true, omschrijving: "en die link heeft een href" },
    ],
  },
  {
    id: "li-nest", groep: "lijsten",
    titel: "een lijst in een lijst",
    uitleg: "Maak een <ul> waarin één van de <li> zelf weer een <ul> bevat.",
    les: {
      wat: "Een lijst mag in een lijst. Zo maak je een menu met onderdelen: hoofdstuk met paragrafen, vak met onderwerpen.",
      hoe: `<ul>\n  <li>talen\n    <ul>\n      <li>nederlands</li>\n      <li>frans</li>\n    </ul>\n  </li>\n  <li>wiskunde</li>\n</ul>`,
      punten: [
        "de binnenste <ul> staat IN een <li>, niet tussen twee <li>",
        "de browser springt automatisch verder in",
        "zo bouw je later ook een uitklapmenu",
      ],
      fout: "De tweede <ul> direct in de eerste <ul> zetten. Tussen twee <li> mag niets staan.",
    },
    tip: "Open een <li>, zet je tekst, en zet daarna een hele <ul> voor je </li>.",
    start: { html: `<ul>\n  <li>talen</li>\n  <li>wiskunde</li>\n</ul>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "li ul", omschrijving: "er staat een <ul> binnen een <li>" },
      { soort: "selector", selector: "li ul li", minAantal: 2, omschrijving: "die binnenste lijst heeft twee regels" },
    ],
  },
  {
    id: "li-dl", groep: "lijsten", element: "dl",
    titel: "<dl> — de begrippenlijst",
    uitleg: "Leg twee woorden uit in een <dl>: het woord in <dt>, de uitleg in <dd>.",
    les: {
      wat: "<dl> is een lijst van paren: een woord en zijn uitleg. Een woordenlijst, een legenda, een lijst met gegevens.",
      hoe: `<dl>\n  <dt>bord</dt>\n  <dd>waar de klas op tekent</dd>\n  <dt>doekoe</dt>\n  <dd>het krediet dat je verdient</dd>\n</dl>`,
      punten: [
        "dl staat voor description list",
        "<dt> en <dd> zitten allebei direct in de <dl>",
        "één <dt> mag meerdere <dd> hebben, en omgekeerd",
      ],
      fout: "<li> in een <dl> zetten. In een <dl> horen <dt> en <dd>.",
    },
    tip: "<dl> met daarin <dt>woord</dt><dd>uitleg</dd>, twee keer.",
    start: { html: `<h2>woordenlijst</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "dl", omschrijving: "er is een <dl>" },
      { soort: "selector", selector: "dl dt", minAantal: 2, nietLeeg: true, omschrijving: "met twee <dt> erin" },
      { soort: "selector", selector: "dl dd", minAantal: 2, nietLeeg: true, omschrijving: "en twee <dd>" },
    ],
  },
  {
    id: "li-dt", groep: "lijsten", element: "dt",
    titel: "<dt> — het woord",
    uitleg: "Zet in een <dl> drie begrippen neer in <dt>, elk met een <dd> eronder.",
    les: {
      wat: "<dt> is de naam van het paar: het woord dat je uitlegt, of het label van een gegeven.",
      hoe: `<dt>lokaal</dt>\n<dd>het gedeelde bord van de klas</dd>`,
      punten: [
        "dt staat voor description term",
        "de browser zet het niet ingesprongen, de <dd> wel",
        "meerdere <dt> achter elkaar betekent: deze woorden delen dezelfde uitleg",
      ],
      fout: "Het woord en de uitleg allebei in een <dt> zetten.",
    },
    tip: "Drie keer <dt>...</dt> met telkens een <dd>...</dd> erachter.",
    start: { html: `<dl>\n</dl>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "dl dt", minAantal: 3, nietLeeg: true, omschrijving: "er staan drie <dt> in de <dl>" },
      { soort: "selector", selector: "dl dd", minAantal: 3, nietLeeg: true, omschrijving: "en drie <dd>" },
    ],
  },
  {
    id: "li-dd", groep: "lijsten", element: "dd",
    titel: "<dd> — de uitleg",
    uitleg: "Geef één <dt> twee verschillende <dd> met uitleg.",
    les: {
      wat: "<dd> is de uitleg die bij de <dt> ervoor hoort. Eén woord mag meerdere uitleggen hebben.",
      hoe: `<dt>stift</dt>\n<dd>waarmee je op het bord schrijft</dd>\n<dd>ligt in de la</dd>`,
      punten: [
        "dd staat voor description details",
        "de browser springt de <dd> in",
        "er mag van alles in: tekst, een <p>, een foto",
      ],
      fout: "Een <dd> neerzetten zonder <dt> ervoor. Dan hoort de uitleg nergens bij.",
    },
    tip: "Eén <dt>, en daaronder twee <dd> achter elkaar.",
    start: { html: `<dl>\n  <dt>stift</dt>\n</dl>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "dl dt", nietLeeg: true, omschrijving: "er is een <dt>" },
      { soort: "selector", selector: "dl dd", minAantal: 2, nietLeeg: true, omschrijving: "met twee <dd> eronder" },
      { soort: "verschillend", tag: "dd", minAantal: 2, omschrijving: "die twee zeggen iets anders" },
    ],
  },

  /* ============= hoofdstuk 4 — links en navigeren ================== */

  {
    id: "ln-a", groep: "links en navigeren", element: "a",
    titel: "<a> — de link",
    uitleg: "Zet een link naar een site die je vaak gebruikt, met duidelijke tekst.",
    les: {
      wat: "<a> is de link: het element waar het hele web op draait. De tekst tussen de tags is waar je op klikt, het href zegt waar je heen gaat.",
      hoe: `<a href="https://onderwijskiezer.be">lees over ICW</a>`,
      punten: [
        "a staat voor anchor, anker",
        "zonder href is het geen link maar gewone tekst",
        "de tekst moet zeggen waar je heen gaat, ook los van de zin eromheen",
        "een <a> blijft in de regel staan, net als <span>",
      ],
      fout: "Als linktekst klik hier gebruiken. Iemand die met een schermlezer alleen de links opsomt, hoort dan tien keer klik hier.",
    },
    tip: "<a href=\"https://...\">tekst waar je op klikt</a>",
    start: { html: `<h2>handige links</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "a", nietLeeg: true, minTekens: 4, omschrijving: "er is een <a> met echte tekst erin" },
      { soort: "attr", tag: "a", attribuut: "href", nietLeeg: true, omschrijving: "die link heeft een href" },
      { soort: "geen", tag: "a[href='#']", omschrijving: "de href is geen lege # maar een echt adres" },
    ],
  },
  {
    id: "ln-href", groep: "links en navigeren", element: "href",
    titel: "href — waar de link heen gaat",
    uitleg: "Zet drie links neer: één naar een site, één naar een mailadres, één naar een telefoonnummer.",
    les: {
      wat: "In href staat de bestemming. Dat hoeft geen website te zijn: je kan ook een mail openen of een nummer bellen.",
      hoe: `<a href="https://school.be">een site</a>\n<a href="mailto:info@school.be">een mail</a>\n<a href="tel:+3211223344">bellen</a>`,
      punten: [
        "https:// hoort erbij, anders zoekt de browser het bestand op je eigen server",
        "mailto: opent het mailprogramma",
        "tel: werkt op een telefoon",
        "een pad zonder https, zoals over.html, wijst naar een pagina van jezelf",
      ],
      fout: "href=\"www.school.be\" schrijven. Zonder https:// denkt de browser dat het een bestand van jou is.",
    },
    tip: "Drie <a> onder elkaar met https://, mailto: en tel: in de href.",
    start: { html: `<h2>contact</h2>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "a[href^='https://']", omschrijving: "er is een link naar een site met https://" },
      { soort: "selector", selector: "a[href^='mailto:']", omschrijving: "er is een link met mailto:" },
      { soort: "selector", selector: "a[href^='tel:']", omschrijving: "er is een link met tel:" },
    ],
  },
  {
    id: "ln-target", groep: "links en navigeren", element: "target",
    titel: "target=\"_blank\" — in een nieuw tabblad",
    uitleg: "Maak een link die in een nieuw tabblad opent, met de juiste rel erbij.",
    les: {
      wat: "Met target=\"_blank\" opent de link in een nieuw tabblad. Zet er rel=\"noopener\" bij, anders kan de andere pagina aan jouw tabblad zitten.",
      hoe: `<a href="https://onderwijskiezer.be" target="_blank" rel="noopener">onderwijskiezer</a>`,
      punten: [
        "noopener is een veiligheidsslot, geen versiering",
        "doe het niet standaard: de gebruiker beslist zelf of hij een tabblad wil",
        "zeg erbij dat hij in een nieuw tabblad opent, anders is de terugknop stuk voor je gevoel",
      ],
      fout: "target=\"_blank\" zonder rel=\"noopener\". Dat is een bekend lek.",
    },
    tip: "target=\"_blank\" en rel=\"noopener\" staan allebei in dezelfde <a>.",
    start: { html: `<a href="https://onderwijskiezer.be">onderwijskiezer</a>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "a[target='_blank']", omschrijving: "de link opent in een nieuw tabblad" },
      { soort: "selector", selector: "a[target='_blank'][rel]", omschrijving: "en heeft een rel erbij" },
      { soort: "attr", tag: "a", attribuut: "rel", bevat: "noopener", omschrijving: "in die rel staat noopener" },
    ],
  },
  {
    id: "ln-anker", groep: "links en navigeren",
    titel: "de sprong binnen één pagina",
    uitleg: "Geef een kop een id en maak bovenaan een link die daar naartoe springt.",
    les: {
      wat: "Een href die met # begint springt naar het element met dat id op dezelfde pagina. Zo maak je een inhoudsopgave.",
      hoe: `<a href="#regels">naar de regels</a>\n<h2 id="regels">de regels</h2>`,
      punten: [
        "het id staat op het element waar je heen springt, zonder #",
        "in de href staat het id met een # ervoor",
        "href=\"#top\" of gewoon #top brengt je naar boven als er een element met dat id is",
      ],
      fout: "De # ook in het id zetten. Het id is regels, de href is #regels.",
    },
    tip: "id=\"regels\" op de kop, href=\"#regels\" in de link.",
    start: { html: `<h1>huisregels</h1>\n<h2>de regels</h2>\n<p>niet op het raam schrijven.</p>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "a[href^='#']", nietLeeg: true, omschrijving: "er is een link die met # begint" },
      { soort: "attr", tag: "h2", attribuut: "id", nietLeeg: true, omschrijving: "de <h2> heeft een id" },
    ],
  },
  {
    id: "ln-download", groep: "links en navigeren", element: "download",
    titel: "download — de link die opslaat",
    uitleg: "Maak een link naar een bestand met het download-attribuut erbij.",
    les: {
      wat: "Met download opent de browser het bestand niet, maar slaat hij het op. Geef je het een waarde, dan is dat de bestandsnaam.",
      hoe: `<a href="rooster.pdf" download="mijn-rooster.pdf">rooster opslaan</a>`,
      punten: [
        "download zonder waarde houdt de originele naam",
        "het werkt alleen voor bestanden van je eigen site",
        "de gebruiker kan altijd nog kiezen wat hij ermee doet",
      ],
      fout: "Denken dat download een bestand maakt. Het bestand moet al bestaan.",
    },
    tip: "<a href=\"rooster.pdf\" download>opslaan</a>",
    start: { html: `<a href="rooster.pdf">rooster</a>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "a[download]", nietLeeg: true, omschrijving: "er is een <a> met download erop" },
      { soort: "attr", tag: "a", attribuut: "href", nietLeeg: true, omschrijving: "en die link wijst naar een bestand" },
    ],
  },
  {
    id: "ln-title", groep: "links en navigeren", element: "title",
    titel: "title — het tekstballonnetje",
    uitleg: "Geef een link een title die vertelt wat er gebeurt als je klikt.",
    les: {
      wat: "Het title-attribuut geeft extra uitleg die verschijnt als je met de muis blijft hangen. Het mag op bijna elk element.",
      hoe: `<a href="https://school.be" title="de website van de school">school</a>`,
      punten: [
        "op een telefoon zie je een title niet, dus zet er nooit iets in dat je moet weten",
        "verwar het niet met <title>, dat is de naam in het tabblad",
        "op een <abbr> is title juist wel de normale plek",
      ],
      fout: "Belangrijke informatie alleen in een title zetten. Op touch is die onzichtbaar.",
    },
    tip: "title=\"...\" zet je in de openingstag van je <a>.",
    start: { html: `<a href="https://school.be">school</a>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "a[title]", nietLeeg: true, omschrijving: "de <a> heeft een title" },
      { soort: "attr", tag: "a", attribuut: "title", nietLeeg: true, omschrijving: "en die title is niet leeg" },
    ],
  },

  /* ==================== hoofdstuk 5 — media ======================== */

  {
    id: "me-img", groep: "media", element: "img",
    titel: "<img> — de afbeelding",
    uitleg: "Zet een afbeelding op de pagina met een src en een alt.",
    les: {
      wat: "<img> haalt een afbeelding op en zet hem op je pagina. In src staat waar het plaatje staat, in alt wat erop te zien is.",
      hoe: `<img src="bord.png" alt="het bord van vanochtend">`,
      punten: [
        "<img> heeft geen sluittag, er zit niets in",
        "zonder alt is je pagina stuk voor wie niet ziet",
        "width en height erbij zetten voorkomt dat de pagina springt tijdens het laden",
      ],
      fout: "</img> schrijven. Dat bestaat niet.",
    },
    tip: "<img src=\"...\" alt=\"...\"> — geen sluittag.",
    start: { html: `<h2>bewijsmateriaal</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "img", omschrijving: "er is een <img>" },
      { soort: "attr", tag: "img", attribuut: "src", nietLeeg: true, omschrijving: "met een src" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "en een alt" },
    ],
  },
  {
    id: "me-alt", groep: "media", element: "alt",
    titel: "alt — wat er op de foto staat",
    uitleg: "Zet twee afbeeldingen neer: een gewone met een beschrijvende alt, en een versiering met alt=\"\".",
    les: {
      wat: "In alt beschrijf je wat er op de foto staat. Is de foto pure versiering, dan zet je alt=\"\" leeg: de schermlezer slaat hem dan over.",
      hoe: `<img src="klas.png" alt="de klas voor het bord">\n<img src="lijntje.png" alt="">`,
      punten: [
        "beschrijf wat je zou zeggen als je de foto aan de telefoon uitlegt",
        "begin niet met foto van, dat weet de schermlezer al",
        "alt=\"\" is iets anders dan geen alt: leeg betekent bewust overslaan",
      ],
      fout: "Het alt-attribuut helemaal weglaten. Dan leest de schermlezer de bestandsnaam voor.",
    },
    tip: "Twee <img>: de eerste met een zin in alt, de tweede met alt=\"\".",
    start: { html: `<img src="klas.png">\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "img", minAantal: 2, omschrijving: "er staan twee afbeeldingen" },
      { soort: "selector", selector: "img[alt='']", omschrijving: "één heeft een lege alt (versiering)" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "de andere heeft een echte beschrijving" },
    ],
  },
  {
    id: "me-figure", groep: "media", element: "figure",
    titel: "<figure> — de foto met omlijsting",
    uitleg: "Zet een afbeelding in een <figure>.",
    les: {
      wat: "<figure> is een blokje dat op zichzelf staat: een foto, een diagram, een stukje code. Je kan het verplaatsen zonder dat de tekst kapot gaat.",
      hoe: `<figure>\n  <img src="bord.png" alt="het bord">\n</figure>`,
      punten: [
        "een figure hoort bij de tekst maar staat er los van",
        "het onderschrift komt in een <figcaption>",
        "er mag ook een <pre> of een tabel in",
      ],
      fout: "Elke afbeelding in een figure zetten. Een losse foto in een alinea heeft er niets aan.",
    },
    tip: "<figure><img src=\"...\" alt=\"...\"></figure>",
    start: { html: `<img src="bord.png" alt="het bord">\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "figure", omschrijving: "er is een <figure>" },
      { soort: "selector", selector: "figure img", omschrijving: "met de <img> erin" },
    ],
  },
  {
    id: "me-figcaption", groep: "media", element: "figcaption",
    titel: "<figcaption> — het onderschrift",
    uitleg: "Geef je <figure> een onderschrift met <figcaption>.",
    les: {
      wat: "<figcaption> is het bijschrift van een <figure>. Zichtbare tekst, voor iedereen, naast de alt.",
      hoe: `<figure>\n  <img src="bord.png" alt="het bord vol tekeningen">\n  <figcaption>het bord van 3 september</figcaption>\n</figure>`,
      punten: [
        "de <figcaption> staat als eerste of als laatste in de <figure>",
        "één figcaption per figure",
        "alt beschrijft de foto, figcaption zegt er iets over: dat is niet hetzelfde",
      ],
      fout: "Het onderschrift buiten de <figure> zetten. Dan hoort het er voor de browser niet bij.",
    },
    tip: "De <figcaption> staat binnen de <figure>, onder de <img>.",
    start: { html: `<figure>\n  <img src="bord.png" alt="het bord vol tekeningen">\n</figure>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "figure figcaption", nietLeeg: true, omschrijving: "er is een <figcaption> in de <figure>" },
      { soort: "selector", selector: "figure img", omschrijving: "de afbeelding staat er nog" },
    ],
  },
  {
    id: "me-picture", groep: "media", element: "picture",
    titel: "<picture> — een andere foto per scherm",
    uitleg: "Bouw een <picture> met een <source> voor brede schermen en een <img> als terugval.",
    les: {
      wat: "<picture> laat de browser kiezen tussen meerdere versies van dezelfde afbeelding: een smalle voor de telefoon, een brede voor de laptop.",
      hoe: `<picture>\n  <source srcset="breed.png" media="(min-width: 700px)">\n  <img src="smal.png" alt="het bord">\n</picture>`,
      punten: [
        "de <img> onderaan is verplicht: dat is wat er gebeurt als geen enkele source past",
        "de browser pakt de eerste <source> die past en kijkt dan niet verder",
        "alt staat op de <img>, niet op de <source>",
      ],
      fout: "De <img> weglaten. Zonder img toont een <picture> niets.",
    },
    tip: "Eerst de <source>, dan de <img>, allebei binnen <picture>.",
    start: { html: `<img src="smal.png" alt="het bord">\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "picture", omschrijving: "er is een <picture>" },
      { soort: "selector", selector: "picture source[srcset]", omschrijving: "met een <source> met srcset" },
      { soort: "selector", selector: "picture img[alt]", omschrijving: "en een <img> met alt als terugval" },
    ],
  },
  {
    id: "me-audio", groep: "media", element: "audio",
    titel: "<audio> — geluid",
    uitleg: "Zet een geluidsfragment op de pagina met bedieningsknoppen.",
    les: {
      wat: "<audio> speelt geluid af. Met controls krijg je de knoppen van de browser: play, pauze, volume.",
      hoe: `<audio src="bel.mp3" controls></audio>`,
      punten: [
        "zonder controls zie je niets en kan de bezoeker niets",
        "autoplay staat bijna overal uit, en terecht",
        "<audio> heeft wel een sluittag, ook al zit er niets in",
      ],
      fout: "autoplay aanzetten. Geluid dat vanzelf begint jaagt bezoekers weg.",
    },
    tip: "<audio src=\"bel.mp3\" controls></audio>",
    start: { html: `<h2>de schoolbel</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "audio", omschrijving: "er is een <audio>" },
      { soort: "selector", selector: "audio[controls]", omschrijving: "met controls, zodat je hem kan bedienen" },
      { soort: "attr", tag: "audio", attribuut: "src", nietLeeg: true, omschrijving: "en een src met het bestand" },
    ],
  },
  {
    id: "me-video", groep: "media", element: "video",
    titel: "<video> — film",
    uitleg: "Zet een video op de pagina met controls en een poster.",
    les: {
      wat: "<video> speelt film af. Met poster kies je het beeld dat te zien is voor iemand op play drukt.",
      hoe: `<video src="les.mp4" controls poster="voorbeeld.png" width="400"></video>`,
      punten: [
        "controls geeft de bezoeker de knoppen",
        "poster is het stilstaande beeld vooraf",
        "met muted erbij staat autoplay in de meeste browsers wel toe, maar doe het toch niet",
      ],
      fout: "Een video zonder controls neerzetten. Dan kan niemand hem stoppen.",
    },
    tip: "controls en poster=\"...\" staan allebei in de openingstag.",
    start: { html: `<h2>de les van gisteren</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "video", omschrijving: "er is een <video>" },
      { soort: "selector", selector: "video[controls]", omschrijving: "met controls" },
      { soort: "selector", selector: "video[poster]", omschrijving: "en een poster" },
    ],
  },
  {
    id: "me-iframe", groep: "media", element: "iframe",
    titel: "<iframe> — een pagina in je pagina",
    uitleg: "Zet een iframe neer met een title, zodat duidelijk is wat erin zit.",
    les: {
      wat: "<iframe> zet een andere pagina in een kadertje op jouw pagina: een kaart, een filmpje van elders, een formulier.",
      hoe: `<iframe src="https://example.org" title="voorbeeldpagina" width="400" height="250"></iframe>`,
      punten: [
        "title is hier geen extraatje: een schermlezer noemt daarmee het kader",
        "de pagina erin is een aparte wereld, jouw CSS raakt hem niet",
        "in deze levels ziet het voorbeeldvenster geen internet, dus het blijft leeg",
      ],
      fout: "Een iframe zonder title. Dan hoort iemand alleen frame, zonder te weten waarvan.",
    },
    tip: "<iframe src=\"...\" title=\"...\"></iframe> — met sluittag.",
    start: { html: `<h2>waar we zitten</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "iframe", omschrijving: "er is een <iframe>" },
      { soort: "attr", tag: "iframe", attribuut: "src", nietLeeg: true, omschrijving: "met een src" },
      { soort: "attr", tag: "iframe", attribuut: "title", nietLeeg: true, omschrijving: "en een title die zegt wat erin zit" },
    ],
  },

  /* ================== hoofdstuk 6 — structuur ====================== */

  {
    id: "st-div", groep: "structuur", element: "div",
    titel: "<div> — de doos",
    uitleg: "Zet een kop en een alinea samen in een <div class=\"kaart\"> en geef die klasse padding en een rand.",
    les: {
      wat: "<div> is een doos zonder betekenis. Je gebruikt hem om dingen bij elkaar te zetten zodat je ze samen kan opmaken.",
      hoe: `<div class="kaart">\n  <h3>het bord</h3>\n  <p>elke dag een nieuw bord.</p>\n</div>`,
      punten: [
        "een <div> begint op een nieuwe regel en neemt de hele breedte",
        "<span> is de versie die in de regel blijft staan",
        "bestaat er een element dat wel iets betekent (<header>, <section>, <article>), neem dat",
      ],
      fout: "Alles in divs bouwen. Dat heet divitis, en niemand, geen browser en geen schermlezer, snapt je pagina dan nog.",
    },
    tip: "<div class=\"kaart\">...</div> en in CSS .kaart { padding: 16px; border: 1px solid #999; }",
    start: { html: `<h3>het bord</h3>\n<p>elke dag een nieuw bord.</p>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "div.kaart", omschrijving: "er is een <div class=\"kaart\">" },
      { soort: "selector", selector: "div.kaart h3", omschrijving: "met de kop erin" },
      { soort: "selector", selector: "div.kaart p", omschrijving: "en de alinea erin" },
      { soort: "css", selector: ".kaart", eigenschap: "padding", omschrijving: ".kaart krijgt padding" },
      { soort: "css", selector: ".kaart", eigenschap: "border", omschrijving: "en een border" },
    ],
  },
  {
    id: "st-header", groep: "structuur", element: "header",
    titel: "<header> — de kop van de pagina",
    uitleg: "Zet de titel van je site in een <header>.",
    les: {
      wat: "<header> is het bovenstuk: de naam van de site, het logo, meestal het menu. Het is een <div> die zegt wat hij is.",
      hoe: `<header>\n  <h1>lokaal b16</h1>\n</header>`,
      punten: [
        "er mag meer dan één header op een pagina staan: elk <article> mag er ook een hebben",
        "het is geen vaste balk bovenaan, dat maak je met CSS",
        "een schermlezer kan er direct heen springen",
      ],
      fout: "<header> en <head> door elkaar halen. <head> is onzichtbaar en zit bovenaan het document.",
    },
    tip: "<header><h1>...</h1></header>",
    start: { html: `<h1>lokaal b16</h1>\n<p>het bord van de klas</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "header", omschrijving: "er is een <header>" },
      { soort: "selector", selector: "header h1", nietLeeg: true, omschrijving: "met de <h1> erin" },
    ],
  },
  {
    id: "st-nav", groep: "structuur", element: "nav",
    titel: "<nav> — het menu",
    uitleg: "Bouw een menu: een <nav> met een <ul> met drie links.",
    les: {
      wat: "<nav> is een blok met de belangrijkste links van je site. Het menu, dus.",
      hoe: `<nav>\n  <ul>\n    <li><a href="/lokaal">lokaal</a></li>\n    <li><a href="/groepen">groepen</a></li>\n  </ul>\n</nav>`,
      punten: [
        "een menu is een lijst van links, dus <ul> met <li> met <a>",
        "niet elke groep links is een <nav>: het gaat om de hoofdnavigatie",
        "een schermlezer kan het menu overslaan, precies omdat je <nav> gebruikt",
      ],
      fout: "Alle links van de pagina in een <nav> stoppen. Dan heeft de overslaan-knop geen nut meer.",
    },
    tip: "<nav> met daarin een <ul> met drie <li>, en in elke <li> een <a>.",
    start: { html: `<header>\n  <h1>lokaal b16</h1>\n</header>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "nav", omschrijving: "er is een <nav>" },
      { soort: "selector", selector: "nav ul li", minAantal: 3, omschrijving: "met een lijst van drie regels" },
      { soort: "selector", selector: "nav a[href]", minAantal: 3, omschrijving: "en in elke regel een link" },
    ],
  },
  {
    id: "st-main", groep: "structuur", element: "main",
    titel: "<main> — waar het echt over gaat",
    uitleg: "Zet de inhoud van de pagina in een <main>, met de <header> ervoor.",
    les: {
      wat: "<main> is de echte inhoud van deze pagina: alles behalve het menu, de kop en de voet die op elke pagina hetzelfde zijn.",
      hoe: `<header>...</header>\n<main>\n  <h2>de levels</h2>\n</main>`,
      punten: [
        "precies één <main> per pagina",
        "het menu en de footer horen er niet in",
        "de sprong naar de inhoud die je op sites ziet, springt hierheen",
      ],
      fout: "Twee <main> op één pagina. Er kan er maar één de hoofdinhoud zijn.",
    },
    tip: "<main> komt na de </header>.",
    start: { html: `<header>\n  <h1>lokaal b16</h1>\n</header>\n<h2>de levels</h2>\n<p>honderd stuks.</p>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "header", omschrijving: "de <header> staat er" },
      { soort: "tag", tag: "main", omschrijving: "er is een <main>" },
      { soort: "selector", selector: "main h2", omschrijving: "met de inhoud erin" },
    ],
  },
  {
    id: "st-section", groep: "structuur", element: "section",
    titel: "<section> — een stuk van de pagina",
    uitleg: "Deel je pagina op in twee <section>, elk met een eigen <h2>.",
    les: {
      wat: "<section> is een stuk van je pagina dat bij elkaar hoort en een eigen kop verdient.",
      hoe: `<section>\n  <h2>het bord</h2>\n  <p>...</p>\n</section>\n<section>\n  <h2>de chat</h2>\n  <p>...</p>\n</section>`,
      punten: [
        "een section hoort een kop te hebben, anders had je net zo goed een <div> kunnen nemen",
        "een section is een stuk van iets, een article staat op zichzelf",
        "secties mogen in elkaar zitten",
      ],
      fout: "<section> gebruiken als vervanging van <div> om iets op te maken. Zonder kop is het gewoon een doos.",
    },
    tip: "Twee keer <section> met daarin een <h2> en een <p>.",
    start: { html: `<main>\n</main>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "section", minAantal: 2, omschrijving: "er zijn twee <section>" },
      { soort: "selector", selector: "section h2", minAantal: 2, nietLeeg: true, omschrijving: "elk met een eigen <h2>" },
    ],
  },
  {
    id: "st-article", groep: "structuur", element: "article",
    titel: "<article> — het losse stuk",
    uitleg: "Schrijf twee berichten als <article>, elk met een kop en tekst.",
    les: {
      wat: "<article> is iets dat op zichzelf staat: een bericht, een nieuwsitem, een reactie. Knip je het eruit, dan klopt het nog steeds.",
      hoe: `<article>\n  <h3>bord gewist</h3>\n  <p>om 16:00 is het bord leeggemaakt.</p>\n</article>`,
      punten: [
        "de test: kan dit stuk los op een andere site staan en nog kloppen?",
        "een article mag een eigen <header> en <footer> hebben",
        "een lijst berichten is een rij <article>",
      ],
      fout: "Elke alinea een <article> maken. Het gaat om een heel bericht, niet om een stukje tekst.",
    },
    tip: "Twee keer <article> met daarin een <h3> en een <p>.",
    start: { html: `<h2>berichten</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "article", minAantal: 2, omschrijving: "er zijn twee <article>" },
      { soort: "selector", selector: "article h3", minAantal: 2, nietLeeg: true, omschrijving: "elk met een eigen kop" },
      { soort: "selector", selector: "article p", minAantal: 2, nietLeeg: true, omschrijving: "en een stuk tekst" },
    ],
  },
  {
    id: "st-aside", groep: "structuur", element: "aside",
    titel: "<aside> — het zijstuk",
    uitleg: "Zet naast je hoofdtekst een <aside> met een weetje.",
    les: {
      wat: "<aside> is een blokje ernaast: een weetje, een kadertje, links naar iets anders. Het hoort erbij, maar je mist niets als je het overslaat.",
      hoe: `<aside>\n  <h3>wist je dat</h3>\n  <p>het bord wordt elke nacht bewaard.</p>\n</aside>`,
      punten: [
        "het is geen zijbalk omdat hij rechts staat, links neerzetten mag ook",
        "de bezoeker moet de pagina zonder de aside nog snappen",
        "reclame en verwante links horen hier ook",
      ],
      fout: "De hoofdtekst in een <aside> zetten omdat hij toevallig in de zijkolom staat.",
    },
    tip: "<aside> met een <h3> en een <p> erin, naast je <main>.",
    start: { html: `<main>\n  <h2>het bord</h2>\n  <p>elke dag opnieuw.</p>\n</main>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "main", omschrijving: "de <main> staat er nog" },
      { soort: "tag", tag: "aside", omschrijving: "er is een <aside>" },
      { soort: "selector", selector: "aside p", nietLeeg: true, omschrijving: "met tekst erin" },
    ],
  },
  {
    id: "st-footer", groep: "structuur", element: "footer",
    titel: "<footer> — de voet",
    uitleg: "Zet onderaan een <footer> met de kleine lettertjes in <small>.",
    les: {
      wat: "<footer> is het onderstuk: wie het gemaakt heeft, het jaartal, de voorwaarden, contact.",
      hoe: `<footer>\n  <p><small>lokaal b16 — schoolproject</small></p>\n</footer>`,
      punten: [
        "net als header mag een footer ook in een <article> zitten",
        "het is geen balk die vastplakt onderaan, dat doe je met CSS",
        "hier staan de dingen die niemand hoeft te lezen maar iedereen verwacht",
      ],
      fout: "De footer in de <main> zetten. Hij hoort er juist buiten.",
    },
    tip: "<footer> helemaal onderaan, met een <small> erin.",
    start: { html: `<main>\n  <h2>de levels</h2>\n</main>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "footer", omschrijving: "er is een <footer>" },
      { soort: "selector", selector: "footer small", nietLeeg: true, omschrijving: "met de kleine lettertjes erin" },
    ],
  },
  {
    id: "st-class", groep: "structuur", element: "class",
    titel: "class — hetzelfde label op meerdere dingen",
    uitleg: "Geef drie blokjes dezelfde class en maak ze in één keer op.",
    les: {
      wat: "Een class is een label dat je op zoveel elementen mag plakken als je wil. In CSS pak je ze allemaal tegelijk met een punt.",
      hoe: `<div class="kaart">een</div>\n<div class="kaart">twee</div>`,
      punten: [
        "in de CSS begint een class met een punt: .kaart",
        "één element mag meerdere classes hebben, met een spatie ertussen: class=\"kaart groot\"",
        "kies namen die zeggen wat het is, niet hoe het eruitziet: .waarschuwing is beter dan .rood",
      ],
      fout: "Voor elk blokje een eigen class maken. Dan schrijf je dezelfde CSS drie keer.",
    },
    tip: "Drie divs met class=\"kaart\", en één regel CSS: .kaart { ... }",
    start: { html: `<div>een</div>\n<div>twee</div>\n<div>drie</div>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "div.kaart", minAantal: 3, omschrijving: "drie elementen delen dezelfde class" },
      { soort: "css", selector: ".kaart", eigenschap: "background", losOok: ["background-color"], omschrijving: ".kaart krijgt een achtergrond" },
    ],
  },
  {
    id: "st-id", groep: "structuur", element: "id",
    titel: "id — de unieke naam",
    uitleg: "Geef één element een id en maak dat ene element op met een #-selector.",
    les: {
      wat: "Een id is een naam die maar één keer op de pagina mag voorkomen. In CSS pak je hem met een hekje.",
      hoe: `<div id="hoofdbord">...</div>`,
      punten: [
        "één id per pagina, echt maar één",
        "in CSS begint hij met een hekje: #hoofdbord",
        "ids gebruik je vooral om ergens naartoe te springen (#regels) en om ze in JavaScript te pakken",
        "voor opmaak is een class bijna altijd beter",
      ],
      fout: "Hetzelfde id op twee elementen zetten. Dan werkt het springen en het pakken niet meer betrouwbaar.",
    },
    tip: "id=\"hoofdbord\" op de div, en in CSS #hoofdbord { ... }",
    start: { html: `<div>het bord</div>\n<div>de chat</div>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "div[id]", omschrijving: "er is een <div> met een id" },
      { soort: "css", selectorSoort: "id", eigenschap: "background", losOok: ["background-color", "border"], omschrijving: "je maakt hem op met een #-selector" },
    ],
  },

  /* ================== hoofdstuk 7 — tabellen ======================= */

  {
    id: "ta-table", groep: "tabellen", element: "table",
    titel: "<table> — de tabel",
    uitleg: "Maak een tabel met twee rijen van twee vakjes.",
    les: {
      wat: "<table> is voor gegevens die rijen en kolommen hebben: een rooster, een uitslag, een prijslijst.",
      hoe: `<table>\n  <tr>\n    <td>maandag</td>\n    <td>wiskunde</td>\n  </tr>\n</table>`,
      punten: [
        "een tabel is: table, daarin rijen (tr), daarin vakjes (td)",
        "je leest hem van links naar rechts, rij voor rij",
        "een tabel is voor gegevens, niet om je pagina in kolommen te delen",
      ],
      fout: "Een tabel gebruiken om je pagina in te delen. Dat deed men in 1999; nu doe je dat met CSS grid of flex.",
    },
    tip: "<table> met twee keer <tr>, en in elke <tr> twee <td>.",
    start: { html: `<h2>het rooster</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "table", omschrijving: "er is een <table>" },
      { soort: "selector", selector: "table tr", minAantal: 2, omschrijving: "met twee rijen" },
      { soort: "selector", selector: "table td", minAantal: 4, nietLeeg: true, omschrijving: "en vier gevulde vakjes" },
    ],
  },
  {
    id: "ta-tr", groep: "tabellen", element: "tr",
    titel: "<tr> — de rij",
    uitleg: "Voeg een derde rij toe aan de tabel, met evenveel vakjes als de andere.",
    les: {
      wat: "<tr> is één rij van de tabel. Alles wat in dezelfde <tr> staat, staat naast elkaar.",
      hoe: `<tr>\n  <td>dinsdag</td>\n  <td>frans</td>\n</tr>`,
      punten: [
        "tr staat voor table row",
        "elke rij hoort evenveel vakjes te hebben, anders schuift je tabel scheef",
        "in een <tr> staan alleen <td> of <th>",
      ],
      fout: "Een <td> los in de <table> zetten, zonder <tr> eromheen.",
    },
    tip: "Kopieer een bestaande <tr> en verander de tekst.",
    start: { html: `<table>\n  <tr><td>maandag</td><td>wiskunde</td></tr>\n  <tr><td>dinsdag</td><td>frans</td></tr>\n</table>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "table tr", minAantal: 3, omschrijving: "er zijn drie rijen" },
      { soort: "selector", selector: "table td", minAantal: 6, nietLeeg: true, omschrijving: "met in totaal zes gevulde vakjes" },
    ],
  },
  {
    id: "ta-td", groep: "tabellen", element: "td",
    titel: "<td> — het vakje",
    uitleg: "Maak een tabel van drie kolommen breed met echte gegevens erin.",
    les: {
      wat: "<td> is één vakje met een gegeven erin. Table data.",
      hoe: `<tr>\n  <td>woensdag</td>\n  <td>engels</td>\n  <td>lokaal 12</td>\n</tr>`,
      punten: [
        "er mag van alles in een <td>: tekst, een link, een foto",
        "een leeg vakje laat je gewoon leeg: <td></td>",
        "de kolommen ontstaan vanzelf door evenveel <td> per rij te zetten",
      ],
      fout: "Kolommen proberen te maken met spaties. Het aantal <td> per rij bepaalt de kolommen.",
    },
    tip: "Twee <tr> met elk drie <td>.",
    start: { html: `<table>\n</table>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "table tr", minAantal: 2, omschrijving: "twee rijen" },
      { soort: "selector", selector: "table td", minAantal: 6, nietLeeg: true, omschrijving: "met samen zes gevulde vakjes" },
    ],
  },
  {
    id: "ta-th", groep: "tabellen", element: "th",
    titel: "<th> — het kopvakje",
    uitleg: "Zet boven je tabel een rij kopjes met <th> in plaats van <td>.",
    les: {
      wat: "<th> is een vakje dat zegt waar de kolom of de rij over gaat. Table header.",
      hoe: `<tr>\n  <th>dag</th>\n  <th>vak</th>\n</tr>`,
      punten: [
        "de browser maakt <th> dik en zet hem gecentreerd",
        "met scope=\"col\" of scope=\"row\" zeg je of het kopje bij de kolom of bij de rij hoort",
        "zonder <th> weet een schermlezer niet wat de getallen betekenen",
      ],
      fout: "De kopjes gewoon als <td> zetten en ze dik maken met CSS. Het ziet er hetzelfde uit en betekent niets.",
    },
    tip: "De bovenste <tr> vullen met <th> in plaats van <td>.",
    start: { html: `<table>\n  <tr><td>dag</td><td>vak</td></tr>\n  <tr><td>maandag</td><td>wiskunde</td></tr>\n</table>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "table th", minAantal: 2, nietLeeg: true, omschrijving: "er zijn twee <th> kopjes" },
      { soort: "selector", selector: "table td", minAantal: 2, nietLeeg: true, omschrijving: "en er staan nog gewone <td> onder" },
    ],
  },
  {
    id: "ta-thead", groep: "tabellen", element: "thead",
    titel: "<thead> — de kop van de tabel",
    uitleg: "Zet de rij met kopjes in een <thead>.",
    les: {
      wat: "<thead> zet de kopregel apart van de rest van de tabel. Zo weet de browser wat de kop is als de tabel over meerdere pagina's afgedrukt wordt.",
      hoe: `<table>\n  <thead>\n    <tr><th>dag</th><th>vak</th></tr>\n  </thead>\n</table>`,
      punten: [
        "in de <thead> zitten <tr> met <th>",
        "de <thead> staat bovenaan, voor de <tbody>",
        "je kan de kop zo apart opmaken en later laten vastplakken bij scrollen",
      ],
      fout: "De <thead> om alle rijen heen zetten. Alleen de kopregel hoort erin.",
    },
    tip: "Zet <thead> om de rij met <th> heen.",
    start: { html: `<table>\n  <tr><th>dag</th><th>vak</th></tr>\n  <tr><td>maandag</td><td>wiskunde</td></tr>\n</table>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "table thead tr th", minAantal: 2, omschrijving: "de kopjes staan in een <thead>" },
    ],
  },
  {
    id: "ta-tbody", groep: "tabellen", element: "tbody",
    titel: "<tbody> — het lijf van de tabel",
    uitleg: "Zet de gegevensrijen in een <tbody>, onder de <thead>.",
    les: {
      wat: "<tbody> is het deel met de echte gegevens, los van de kop.",
      hoe: `<tbody>\n  <tr><td>maandag</td><td>wiskunde</td></tr>\n  <tr><td>dinsdag</td><td>frans</td></tr>\n</tbody>`,
      punten: [
        "een tabel mag meerdere <tbody> hebben om groepen rijen te maken",
        "de browser voegt zelf een <tbody> toe als jij het niet doet",
        "handig om alleen de gegevensrijen om en om te kleuren",
      ],
      fout: "De kopregel ook in de <tbody> zetten. Die hoort in de <thead>.",
    },
    tip: "Zet <tbody> om de twee rijen met <td> heen.",
    start: { html: `<table>\n  <thead>\n    <tr><th>dag</th><th>vak</th></tr>\n  </thead>\n  <tr><td>maandag</td><td>wiskunde</td></tr>\n  <tr><td>dinsdag</td><td>frans</td></tr>\n</table>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "table thead th", minAantal: 2, omschrijving: "de <thead> staat er nog" },
      { soort: "selector", selector: "table tbody tr", minAantal: 2, omschrijving: "en de gegevensrijen zitten in een <tbody>" },
    ],
  },
  {
    id: "ta-caption", groep: "tabellen", element: "caption",
    titel: "<caption> — de titel van de tabel",
    uitleg: "Geef je tabel een <caption> die zegt waar hij over gaat.",
    les: {
      wat: "<caption> is de titel van de tabel. Hij hoort in de tabel zelf, niet als losse kop erboven.",
      hoe: `<table>\n  <caption>rooster van week 36</caption>\n  <tr><th>dag</th><th>vak</th></tr>\n</table>`,
      punten: [
        "de <caption> is het eerste dat in de <table> staat",
        "de browser zet hem gecentreerd boven de tabel",
        "een schermlezer noemt hem meteen, zodat je weet welke tabel je binnenkomt",
      ],
      fout: "Een <h3> boven de tabel zetten in plaats van een caption. Dan is de link tussen titel en tabel er niet.",
    },
    tip: "<caption> is de eerste regel binnen de <table>.",
    start: { html: `<table>\n  <tr><th>dag</th><th>vak</th></tr>\n  <tr><td>maandag</td><td>wiskunde</td></tr>\n</table>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "table caption", nietLeeg: true, omschrijving: "er is een <caption> met tekst" },
    ],
  },
  {
    id: "ta-colspan", groep: "tabellen", element: "colspan",
    titel: "colspan en rowspan — vakjes samenvoegen",
    uitleg: "Maak een vakje dat twee kolommen breed is met colspan.",
    les: {
      wat: "Met colspan laat je een vakje meerdere kolommen breed worden, met rowspan meerdere rijen hoog.",
      hoe: `<tr>\n  <td colspan="2">de hele ochtend vrij</td>\n</tr>`,
      punten: [
        "colspan=\"2\" betekent: dit vakje telt voor twee",
        "die rij heeft dan één <td> minder nodig",
        "reken het na: elke rij moet even breed uitkomen",
      ],
      fout: "Colspan gebruiken en toch nog het volle aantal <td> in die rij laten staan. Dan steekt de rij uit.",
    },
    tip: "<td colspan=\"2\">tekst</td> is de enige td in die rij.",
    start: { html: `<table>\n  <tr><th>dag</th><th>vak</th></tr>\n  <tr><td>maandag</td><td>wiskunde</td></tr>\n</table>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "td[colspan]", nietLeeg: true, omschrijving: "er is een <td> met colspan" },
      { soort: "selector", selector: "table tr", minAantal: 3, omschrijving: "de tabel heeft nu drie rijen" },
    ],
  },

  /* ================= hoofdstuk 8 — formulieren ===================== */

  {
    id: "fo-form", groep: "formulieren", element: "form",
    titel: "<form> — het formulier",
    uitleg: "Bouw een formulier met een tekstvak en een verstuurknop.",
    les: {
      wat: "<form> is de doos om alles wat de bezoeker invult. In action staat waar het heen gaat, in method hoe het verstuurd wordt.",
      hoe: `<form action="/aanmelden" method="post">\n  <input type="text" name="naam">\n  <button type="submit">versturen</button>\n</form>`,
      punten: [
        "method=\"post\" voor iets dat je opslaat, method=\"get\" voor zoeken",
        "alles wat je wil versturen moet IN de form staan",
        "elk veld heeft een name nodig, anders wordt het niet meegestuurd",
      ],
      fout: "De verstuurknop buiten de <form> zetten. Dan doet hij niets.",
    },
    tip: "<form action=\"...\" method=\"post\"> met daarin een <input> en een <button>.",
    start: { html: `<h2>meld je aan</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "form", omschrijving: "er is een <form>" },
      { soort: "selector", selector: "form[action]", omschrijving: "met een action" },
      { soort: "selector", selector: "form input", omschrijving: "een invoerveld erin" },
      { soort: "selector", selector: "form button", nietLeeg: true, omschrijving: "en een knop erin" },
    ],
  },
  {
    id: "fo-input", groep: "formulieren", element: "input",
    titel: "<input> — het invoerveld",
    uitleg: "Zet een invoerveld neer met een name en een type.",
    les: {
      wat: "<input> is het invoerveld. Met type kies je wat voor soort: tekst, mail, wachtwoord, datum, vinkje. Eén element, twintig gedaantes.",
      hoe: `<input type="text" name="naam" id="naam">`,
      punten: [
        "<input> heeft geen sluittag",
        "name is de naam waaronder de server het terugkrijgt: zonder name geen gegevens",
        "type bepaalt hoe het veld eruitziet en welk toetsenbord je op een telefoon krijgt",
      ],
      fout: "De name vergeten. Het veld werkt dan wel, maar wat je typt komt nooit aan.",
    },
    tip: "<input type=\"text\" name=\"naam\"> binnen je form.",
    start: { html: `<form action="/aanmelden" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "form input[type]", omschrijving: "er is een <input> met een type" },
      { soort: "selector", selector: "form input[name]", omschrijving: "en met een name" },
    ],
  },
  {
    id: "fo-label", groep: "formulieren", element: "label",
    titel: "<label> — het opschrift bij een veld",
    uitleg: "Koppel een <label> aan je invoerveld met for en id.",
    les: {
      wat: "<label> is het opschrift bij een veld. Koppel je hem goed, dan springt de cursor in het veld als je op het woord klikt.",
      hoe: `<label for="naam">je naam</label>\n<input type="text" id="naam" name="naam">`,
      punten: [
        "de for van het label is gelijk aan het id van het veld",
        "je mag het veld ook in het label zetten, dan heb je for niet nodig",
        "zonder label weet een schermlezer niet wat er in het veld moet",
      ],
      fout: "for koppelen aan de name in plaats van aan het id. De koppeling gaat via id.",
    },
    tip: "for=\"naam\" op het label, id=\"naam\" op de input.",
    start: { html: `<form action="/aanmelden" method="post">\n  <input type="text" name="naam">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "label[for]", nietLeeg: true, omschrijving: "er is een <label> met een for" },
      { soort: "selector", selector: "input[id]", omschrijving: "en het veld heeft een id" },
    ],
  },
  {
    id: "fo-text", groep: "formulieren", element: "type=text",
    titel: "type=\"text\" — gewone tekst",
    uitleg: "Maak een tekstveld met een label, een name en een placeholder.",
    les: {
      wat: "type=\"text\" is het gewone veld voor één regel tekst: een naam, een titel, een zoekterm.",
      hoe: `<label for="naam">je naam</label>\n<input type="text" id="naam" name="naam" placeholder="bv. sam">`,
      punten: [
        "placeholder is een voorbeeld, geen label: hij verdwijnt zodra je typt",
        "met maxlength beperk je het aantal tekens",
        "meer dan één regel nodig? dan is het een <textarea>",
      ],
      fout: "De placeholder als label gebruiken. Zodra iemand typt, weet hij niet meer wat er in het veld hoorde.",
    },
    tip: "label + input met type, id, name en placeholder.",
    start: { html: `<form action="/aanmelden" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='text'][name]", omschrijving: "er is een tekstveld met een name" },
      { soort: "selector", selector: "input[placeholder]", omschrijving: "met een placeholder" },
      { soort: "selector", selector: "label[for]", nietLeeg: true, omschrijving: "en een gekoppeld <label>" },
    ],
  },
  {
    id: "fo-email", groep: "formulieren", element: "type=email",
    titel: "type=\"email\" — het mailadres",
    uitleg: "Maak een mailveld dat verplicht is.",
    les: {
      wat: "type=\"email\" controleert of er een apenstaartje in staat en geeft op de telefoon een toetsenbord met een @.",
      hoe: `<label for="mail">je mailadres</label>\n<input type="email" id="mail" name="mail" required>`,
      punten: [
        "required maakt het veld verplicht: de browser laat je niet versturen zonder",
        "de browser controleert de vorm, niet of het adres echt bestaat",
        "de server moet het altijd zelf nog eens nakijken",
      ],
      fout: "Denken dat de controle van de browser genoeg is. Iedereen kan die omzeilen.",
    },
    tip: "type=\"email\" plus required in dezelfde input.",
    start: { html: `<form action="/aanmelden" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='email']", omschrijving: "er is een veld met type=\"email\"" },
      { soort: "selector", selector: "input[type='email'][required]", omschrijving: "en het is verplicht" },
      { soort: "selector", selector: "label[for]", nietLeeg: true, omschrijving: "met een label erbij" },
    ],
  },
  {
    id: "fo-password", groep: "formulieren", element: "type=password",
    titel: "type=\"password\" — het wachtwoord",
    uitleg: "Maak een wachtwoordveld met een label erbij.",
    les: {
      wat: "type=\"password\" verbergt wat je typt achter bolletjes, zodat niemand meeleest over je schouder.",
      hoe: `<label for="ww">wachtwoord</label>\n<input type="password" id="ww" name="wachtwoord">`,
      punten: [
        "de bolletjes zijn alleen op het scherm: onderweg is het gewone tekst, tenzij de site https gebruikt",
        "met autocomplete=\"current-password\" helpt de wachtwoordbeheerder mee",
        "sla een wachtwoord op de server nooit op zoals het binnenkomt",
      ],
      fout: "Een wachtwoordveld als type=\"text\" maken. Dan staat het wachtwoord gewoon op het scherm.",
    },
    tip: "type=\"password\" met een gekoppeld label.",
    start: { html: `<form action="/inloggen" method="post">\n  <label for="naam">gebruikersnaam</label>\n  <input type="text" id="naam" name="naam">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='password'][name]", omschrijving: "er is een wachtwoordveld met een name" },
      { soort: "selector", selector: "label[for]", minAantal: 2, nietLeeg: true, omschrijving: "beide velden hebben een label" },
    ],
  },
  {
    id: "fo-number", groep: "formulieren", element: "type=number",
    titel: "type=\"number\" — een getal",
    uitleg: "Maak een getalveld met een minimum en een maximum.",
    les: {
      wat: "type=\"number\" laat alleen getallen toe en geeft pijltjes om op en neer te tellen. Met min en max leg je de grenzen vast.",
      hoe: `<label for="aantal">hoeveel stiften</label>\n<input type="number" id="aantal" name="aantal" min="1" max="20">`,
      punten: [
        "met step=\"0.5\" mag je in halven tellen",
        "een telefoonnummer is geen getal: dat is type=\"tel\"",
        "min en max zijn een hulpje voor de gebruiker, geen beveiliging",
      ],
      fout: "type=\"number\" voor een huisnummer of een postcode. Die kunnen letters bevatten.",
    },
    tip: "min=\"1\" en max=\"20\" in dezelfde input.",
    start: { html: `<form action="/bestellen" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='number']", omschrijving: "er is een getalveld" },
      { soort: "selector", selector: "input[type='number'][min]", omschrijving: "met een min" },
      { soort: "selector", selector: "input[type='number'][max]", omschrijving: "en een max" },
    ],
  },
  {
    id: "fo-checkbox", groep: "formulieren", element: "type=checkbox",
    titel: "type=\"checkbox\" — het vinkje",
    uitleg: "Maak twee vinkjes die je los van elkaar kan aanzetten, elk met een label.",
    les: {
      wat: "Een checkbox is een vinkje dat aan of uit staat. Meerdere vinkjes staan los van elkaar: je mag er nul, één of allemaal aanzetten.",
      hoe: `<input type="checkbox" id="a" name="vak" value="wiskunde">\n<label for="a">wiskunde</label>`,
      punten: [
        "in value staat wat er verstuurd wordt als het vinkje aan staat",
        "staat het uit, dan wordt er niets verstuurd voor dat veld",
        "met checked staat hij van het begin af aan aan",
      ],
      fout: "De value vergeten. Dan krijgt de server alleen on te horen.",
    },
    tip: "Twee inputs met type=\"checkbox\", elk met een eigen id, value en label.",
    start: { html: `<form action="/kiezen" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='checkbox']", minAantal: 2, omschrijving: "er zijn twee vinkjes" },
      { soort: "selector", selector: "input[type='checkbox'][value]", minAantal: 2, omschrijving: "allebei met een value" },
      { soort: "selector", selector: "label[for]", minAantal: 2, nietLeeg: true, omschrijving: "en allebei met een label" },
    ],
  },
  {
    id: "fo-radio", groep: "formulieren", element: "type=radio",
    titel: "type=\"radio\" — kies er één",
    uitleg: "Maak drie keuzerondjes waarvan er maar één tegelijk aan kan staan.",
    les: {
      wat: "Radiorondjes horen bij elkaar als ze dezelfde name hebben. Dan kan er maar één van de groep aan staan.",
      hoe: `<input type="radio" id="a" name="richting" value="icw">\n<label for="a">ICW</label>\n<input type="radio" id="b" name="richting" value="stw">\n<label for="b">STW</label>`,
      punten: [
        "dezelfde name maakt ze één groep, verschillende id houdt ze uit elkaar",
        "moet er echt gekozen worden, dan zet je required op één van de rondjes",
        "kan er meer dan één aan? dan zijn het checkboxes, geen radio",
      ],
      fout: "Elk rondje een eigen name geven. Dan staan ze los en kunnen ze allemaal tegelijk aan.",
    },
    tip: "Drie inputs met type=\"radio\" en dezelfde name, maar een eigen id en value.",
    start: { html: `<form action="/kiezen" method="post">\n  <p>welke richting?</p>\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='radio']", minAantal: 3, omschrijving: "er zijn drie keuzerondjes" },
      { soort: "selector", selector: "input[type='radio'][name='richting']", minAantal: 3, omschrijving: "ze delen allemaal name=\"richting\"" },
      { soort: "selector", selector: "input[type='radio'][value]", minAantal: 3, omschrijving: "en elk heeft zijn eigen value" },
    ],
  },
  {
    id: "fo-date", groep: "formulieren", element: "type=date",
    titel: "type=\"date\" — de datum",
    uitleg: "Maak een datumveld met een label erbij.",
    les: {
      wat: "type=\"date\" geeft de kalender van de browser. Je krijgt de datum terug als 2026-09-05: jaar, maand, dag.",
      hoe: `<label for="dag">welke dag</label>\n<input type="date" id="dag" name="dag">`,
      punten: [
        "de weergave hangt af van de taal van de browser, de waarde is altijd jjjj-mm-dd",
        "met min en max beperk je de periode",
        "er bestaan ook type=\"time\", type=\"month\" en type=\"datetime-local\"",
      ],
      fout: "Drie losse velden maken voor dag, maand en jaar. Dat kan de browser zelf.",
    },
    tip: "<input type=\"date\" id=\"dag\" name=\"dag\"> met een label ervoor.",
    start: { html: `<form action="/plannen" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='date'][name]", omschrijving: "er is een datumveld met een name" },
      { soort: "selector", selector: "label[for]", nietLeeg: true, omschrijving: "met een gekoppeld label" },
    ],
  },
  {
    id: "fo-file", groep: "formulieren", element: "type=file",
    titel: "type=\"file\" — een bestand kiezen",
    uitleg: "Maak een veld waarmee je een afbeelding kan uploaden.",
    les: {
      wat: "type=\"file\" geeft de knop om een bestand van je toestel te kiezen. Met accept beperk je wat er gekozen mag worden.",
      hoe: `<label for="foto">je foto</label>\n<input type="file" id="foto" name="foto" accept="image/*">`,
      punten: [
        "accept=\"image/*\" laat alleen afbeeldingen zien in het keuzevenster",
        "met multiple mag je meerdere bestanden tegelijk kiezen",
        "de form moet enctype=\"multipart/form-data\" hebben, anders komt het bestand niet aan",
      ],
      fout: "De enctype op de form vergeten. Je krijgt dan alleen de bestandsnaam, niet het bestand.",
    },
    tip: "Zet accept=\"image/*\" op de input en enctype=\"multipart/form-data\" op de form.",
    start: { html: `<form action="/upload" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[type='file']", omschrijving: "er is een bestandsveld" },
      { soort: "selector", selector: "input[type='file'][accept]", omschrijving: "met een accept erop" },
      { soort: "attr", tag: "form", attribuut: "enctype", bevat: "multipart", omschrijving: "en de form heeft de juiste enctype" },
    ],
  },
  {
    id: "fo-textarea", groep: "formulieren", element: "textarea",
    titel: "<textarea> — het grote tekstvak",
    uitleg: "Maak een tekstvak van meerdere regels voor een bericht.",
    les: {
      wat: "<textarea> is het invoerveld voor meerdere regels: een bericht, een opmerking, een verhaal.",
      hoe: `<label for="bericht">je bericht</label>\n<textarea id="bericht" name="bericht" rows="5"></textarea>`,
      punten: [
        "<textarea> heeft wel een sluittag, anders dan <input>",
        "wat je erin zet tussen de tags is de begintekst, er is geen value-attribuut",
        "rows en cols zijn de startgrootte, CSS wint daarvan",
      ],
      fout: "Een beginwaarde in een value-attribuut zetten. Bij een textarea staat de tekst tussen de tags.",
    },
    tip: "<textarea id=\"bericht\" name=\"bericht\" rows=\"5\"></textarea>",
    start: { html: `<form action="/bericht" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "textarea[name]", omschrijving: "er is een <textarea> met een name" },
      { soort: "selector", selector: "textarea[rows]", omschrijving: "met een aantal regels" },
      { soort: "selector", selector: "label[for]", nietLeeg: true, omschrijving: "en een gekoppeld label" },
    ],
  },
  {
    id: "fo-select", groep: "formulieren", element: "select",
    titel: "<select> — het keuzemenu",
    uitleg: "Maak een uitklapmenu met drie keuzes.",
    les: {
      wat: "<select> is het menu waar je uit een lijst kiest. De keuzes zelf zijn <option>.",
      hoe: `<label for="vak">je vak</label>\n<select id="vak" name="vak">\n  <option value="wisk">wiskunde</option>\n  <option value="frans">frans</option>\n</select>`,
      punten: [
        "de name staat op de <select>, niet op de opties",
        "met multiple mag je er meerdere kiezen",
        "meer dan een stuk of zeven keuzes? overweeg dan iets anders",
      ],
      fout: "De name op elke <option> zetten. Die hoort op de <select>.",
    },
    tip: "<select name=\"vak\"> met daarin drie <option>.",
    start: { html: `<form action="/kiezen" method="post">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "select[name]", omschrijving: "er is een <select> met een name" },
      { soort: "selector", selector: "select option", minAantal: 3, nietLeeg: true, omschrijving: "met drie keuzes erin" },
      { soort: "selector", selector: "label[for]", nietLeeg: true, omschrijving: "en een label erbij" },
    ],
  },
  {
    id: "fo-option", groep: "formulieren", element: "option",
    titel: "<option> — de keuze",
    uitleg: "Geef elke keuze een value en zet er één alvast op geselecteerd.",
    les: {
      wat: "<option> is één keuze in het menu. De tekst ertussen zie je, de value is wat er verstuurd wordt.",
      hoe: `<option value="icw" selected>informatica</option>`,
      punten: [
        "geen value? dan wordt de zichtbare tekst verstuurd",
        "met selected staat die keuze van het begin af aan gekozen",
        "een eerste lege optie met de tekst kies iets werkt als opschrift",
      ],
      fout: "De value en de tekst hetzelfde maken terwijl de server een code verwacht.",
    },
    tip: "value=\"...\" op elke option, en selected op één ervan.",
    start: { html: `<select name="vak">\n  <option>wiskunde</option>\n  <option>frans</option>\n  <option>engels</option>\n</select>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "option[value]", minAantal: 3, nietLeeg: true, omschrijving: "elke <option> heeft een value" },
      { soort: "selector", selector: "option[selected]", omschrijving: "en er is er één alvast geselecteerd" },
    ],
  },
  {
    id: "fo-button", groep: "formulieren", element: "button",
    titel: "<button> — de knop",
    uitleg: "Zet in je formulier een verstuurknop en een knop die niets verstuurt.",
    les: {
      wat: "<button> is een knop. In een formulier verstuurt hij standaard, tenzij je type=\"button\" zet.",
      hoe: `<button type="submit">versturen</button>\n<button type="button">annuleren</button>`,
      punten: [
        "in een form is type=\"submit\" de standaard, ook als je niets invult",
        "type=\"button\" doet niets vanzelf: die is voor JavaScript",
        "een knop die naar een andere pagina gaat is geen knop maar een link",
      ],
      fout: "type vergeten bij een knop die niet mag versturen. Hij verstuurt dan toch.",
    },
    tip: "Twee buttons: één met type=\"submit\", één met type=\"button\".",
    start: { html: `<form action="/aanmelden" method="post">\n  <input type="text" name="naam">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "button[type='submit']", nietLeeg: true, omschrijving: "er is een verstuurknop" },
      { soort: "selector", selector: "button[type='button']", nietLeeg: true, omschrijving: "en een knop die niets verstuurt" },
    ],
  },

  /* ============ hoofdstuk 9 — formulieren, de rest ================= */

  {
    id: "fo2-fieldset", groep: "formulieren, de rest", element: "fieldset",
    titel: "<fieldset> — velden die bij elkaar horen",
    uitleg: "Zet je drie keuzerondjes samen in een <fieldset>.",
    les: {
      wat: "<fieldset> zet een groep velden bij elkaar in een kader. Vooral bedoeld voor een groepje radio of checkboxes die één vraag zijn.",
      hoe: `<fieldset>\n  <legend>welke richting?</legend>\n  <input type="radio" id="a" name="r" value="icw">\n  <label for="a">ICW</label>\n</fieldset>`,
      punten: [
        "de eerste regel in een fieldset is de <legend>",
        "de browser tekent er een randje omheen, dat mag je met CSS weghalen",
        "een schermlezer noemt de legend bij elke keuze in de groep",
      ],
      fout: "Een <h3> boven de groep zetten in plaats van een legend. Dan hoort iemand met een schermlezer de vraag maar één keer.",
    },
    tip: "<fieldset> om de rondjes heen, met een <legend> als eerste.",
    start: { html: `<form action="/kiezen" method="post">\n  <input type="radio" id="a" name="r" value="icw"><label for="a">ICW</label>\n  <input type="radio" id="b" name="r" value="stw"><label for="b">STW</label>\n</form>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "fieldset", omschrijving: "er is een <fieldset>" },
      { soort: "selector", selector: "fieldset input[type='radio']", minAantal: 2, omschrijving: "met de keuzerondjes erin" },
    ],
  },
  {
    id: "fo2-legend", groep: "formulieren, de rest", element: "legend",
    titel: "<legend> — de vraag boven de groep",
    uitleg: "Geef je fieldset een <legend> met de vraag erin.",
    les: {
      wat: "<legend> is het opschrift van een <fieldset>: meestal de vraag die bij de groep hoort.",
      hoe: `<fieldset>\n  <legend>hoe wil je bericht krijgen?</legend>\n  ...\n</fieldset>`,
      punten: [
        "de <legend> moet het eerste element in de <fieldset> zijn",
        "één legend per fieldset",
        "de browser zet hem in de rand van het kader",
      ],
      fout: "De legend ergens midden in de fieldset zetten. Hij hoort bovenaan.",
    },
    tip: "<legend>de vraag</legend> als eerste regel binnen de <fieldset>.",
    start: { html: `<fieldset>\n  <input type="checkbox" id="a" name="m" value="mail"><label for="a">mail</label>\n  <input type="checkbox" id="b" name="m" value="sms"><label for="b">sms</label>\n</fieldset>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "fieldset legend", nietLeeg: true, omschrijving: "er is een <legend> in de <fieldset>" },
      { soort: "selector", selector: "fieldset input", minAantal: 2, omschrijving: "de velden staan er nog" },
    ],
  },
  {
    id: "fo2-datalist", groep: "formulieren, de rest", element: "datalist",
    titel: "<datalist> — suggesties bij een veld",
    uitleg: "Geef een tekstveld een lijstje suggesties met <datalist>.",
    les: {
      wat: "<datalist> geeft suggesties bij een gewoon tekstveld. Anders dan bij een <select> mag de bezoeker ook iets anders typen.",
      hoe: `<input type="text" name="vak" list="vakken">\n<datalist id="vakken">\n  <option value="wiskunde"></option>\n  <option value="frans"></option>\n</datalist>`,
      punten: [
        "het list-attribuut van de input verwijst naar het id van de datalist",
        "de opties hebben alleen een value, er staat geen tekst tussen de tags",
        "sluit elke <option> netjes met </option>: een halve tag laat sommige browsers de opties in elkaar schuiven",
        "moet het echt uit de lijst komen? neem dan een <select>",
      ],
      fout: "list koppelen aan de name van de datalist. Het gaat via het id.",
    },
    tip: "list=\"vakken\" op de input, id=\"vakken\" op de datalist.",
    start: { html: `<input type="text" name="vak">\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[list]", omschrijving: "de input heeft een list" },
      { soort: "selector", selector: "datalist[id]", omschrijving: "er is een <datalist> met dat id" },
      { soort: "selector", selector: "datalist option[value]", minAantal: 2, omschrijving: "met minstens twee suggesties" },
    ],
  },
  {
    id: "fo2-progress", groep: "formulieren, de rest", element: "progress",
    titel: "<progress> — de voortgangsbalk",
    uitleg: "Laat met een <progress> zien hoeveel levels je al hebt gehaald.",
    les: {
      wat: "<progress> is een balk die laat zien hoe ver iets is: een upload, een taak, je voortgang in de levels.",
      hoe: `<progress value="12" max="100">12 van 100</progress>`,
      punten: [
        "value is waar je nu staat, max is het totaal",
        "de tekst tussen de tags is voor oude browsers, geen opschrift",
        "weet je niet hoe ver het is? laat value weg, dan gaat de balk heen en weer",
      ],
      fout: "<progress> gebruiken om een percentage te tonen dat niets met voortgang te maken heeft. Daarvoor is <meter>.",
    },
    tip: "<progress value=\"12\" max=\"100\"></progress>",
    start: { html: `<h3>jouw voortgang</h3>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "progress[value]", omschrijving: "er is een <progress> met een value" },
      { soort: "selector", selector: "progress[max]", omschrijving: "en een max" },
    ],
  },
  {
    id: "fo2-required", groep: "formulieren, de rest", element: "required",
    titel: "required — dit moet ingevuld",
    uitleg: "Maak een formulier met twee verplichte velden en één dat mag leeg blijven.",
    les: {
      wat: "Met required weigert de browser te versturen zolang het veld leeg is. Het is een hulpje voor de gebruiker, geen slot.",
      hoe: `<input type="text" name="naam" required>\n<input type="text" name="bijnaam">`,
      punten: [
        "required is een attribuut zonder waarde: je schrijft alleen het woord",
        "de browser toont zelf een melding in de taal van de gebruiker",
        "de server moet alles nog eens controleren: required is één regel weg in de console",
      ],
      fout: "Denken dat required je gegevens veilig maakt. Het is een gemak, geen beveiliging.",
    },
    tip: "Zet required in de openingstag van twee van de drie velden.",
    start: { html: `<form action="/aanmelden" method="post">\n  <input type="text" name="naam">\n  <input type="email" name="mail">\n  <input type="text" name="bijnaam">\n</form>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "input[required]", minAantal: 2, omschrijving: "twee velden zijn verplicht" },
      { soort: "selector", selector: "form input", minAantal: 3, omschrijving: "er staan nog steeds drie velden" },
    ],
  },

  /* ============= hoofdstuk 10 — het document zelf ================== */

  {
    id: "do-details", groep: "het document zelf", element: "details",
    titel: "<details> — het uitklapblok",
    uitleg: "Maak een blok dat uitklapt als je erop klikt.",
    les: {
      wat: "<details> is een blok dat dicht begint en opengaat als je erop klikt. Zonder JavaScript, gewoon HTML.",
      hoe: `<details>\n  <summary>hoe verdien ik doekoe?</summary>\n  <p>door elke dag de opdracht te halen.</p>\n</details>`,
      punten: [
        "de eerste regel is de <summary>: dat is de knop",
        "met open erbij staat hij van het begin af aan open",
        "perfect voor een lijst met veelgestelde vragen",
      ],
      fout: "De summary vergeten. Dan zie je alleen een driehoekje zonder tekst.",
    },
    tip: "<details><summary>vraag</summary><p>antwoord</p></details>",
    start: { html: `<h2>veelgestelde vragen</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "details", omschrijving: "er is een <details>" },
      { soort: "selector", selector: "details summary", nietLeeg: true, omschrijving: "met een <summary> als knop" },
      { soort: "selector", selector: "details p", nietLeeg: true, omschrijving: "en tekst die uitklapt" },
    ],
  },
  {
    id: "do-summary", groep: "het document zelf", element: "summary",
    titel: "<summary> — het klikbare kopje",
    uitleg: "Maak drie uitklapvragen onder elkaar, elk met een eigen summary.",
    les: {
      wat: "<summary> is het regeltje waar je op klikt om een <details> open te doen. Het is meteen de knop.",
      hoe: `<summary>wanneer wordt het bord gewist?</summary>`,
      punten: [
        "de <summary> is het eerste element in de <details>",
        "één summary per details",
        "je kan hem met de tab-toets bereiken en met enter openen, dat regelt de browser",
      ],
      fout: "Meerdere summary in één details zetten. Alleen de eerste telt.",
    },
    tip: "Drie keer <details> met elk een eigen <summary> en antwoord.",
    start: { html: `<h2>veelgestelde vragen</h2>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "details", minAantal: 3, omschrijving: "er zijn drie uitklapblokken" },
      { soort: "selector", selector: "details summary", minAantal: 3, nietLeeg: true, omschrijving: "elk met een eigen <summary>" },
      { soort: "verschillend", tag: "summary", minAantal: 3, omschrijving: "de drie vragen zijn verschillend" },
    ],
  },
  {
    id: "do-title", groep: "het document zelf", element: "title",
    titel: "<title> — de naam in het tabblad",
    uitleg: "Geef de pagina een <title> en zet daarnaast een <h1> op de pagina zelf.",
    les: {
      wat: "<title> is de naam van je pagina: in het tabblad, in je favorieten, in de zoekresultaten van Google. Hij staat in de <head> en is op de pagina zelf onzichtbaar.",
      hoe: `<title>doekoeverzamelaar — lokaal b16</title>`,
      punten: [
        "één <title> per pagina, in de <head>",
        "de <h1> staat op de pagina, de <title> in het tabblad: twee verschillende dingen",
        "zet het belangrijkste vooraan, een tabblad is smal",
      ],
      fout: "Denken dat <title> en <h1> hetzelfde zijn. De ene zie je in het tabblad, de andere op de pagina.",
    },
    tip: "In dit venster schrijf je gewoon <title>...</title> boven je <h1>.",
    start: { html: `<h1>doekoeverzamelaar</h1>\n`, css: `` },
    eisen: [
      { soort: "tag", tag: "title", nietLeeg: true, omschrijving: "er is een <title> met tekst" },
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "en een <h1> op de pagina zelf" },
    ],
  },
  {
    id: "do-meta", groep: "het document zelf", element: "meta",
    titel: "<meta> — informatie over de pagina",
    uitleg: "Zet de twee meta-regels neer die op elke pagina horen: charset en viewport.",
    les: {
      wat: "<meta> geeft informatie over de pagina die je niet ziet: welke tekens je gebruikt, hoe de pagina op een telefoon moet passen, wat er in de zoekresultaten staat.",
      hoe: `<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="description" content="de levels van lokaal b16">`,
      punten: [
        "charset=\"utf-8\" moet er altijd staan, anders worden é en ë rommel",
        "de viewport-regel maakt je pagina bruikbaar op een telefoon",
        "de description is wat Google onder je link zet",
        "<meta> heeft geen sluittag",
      ],
      fout: "De viewport-regel vergeten. Je pagina wordt dan op een telefoon uitgezoomd getoond.",
    },
    tip: "Twee <meta>-regels: één met charset, één met name=\"viewport\".",
    start: { html: `<title>lokaal b16</title>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "meta[charset]", omschrijving: "er is een <meta charset>" },
      { soort: "selector", selector: "meta[name='viewport']", omschrijving: "en een <meta name=\"viewport\">" },
      { soort: "attr", tag: "meta", attribuut: "content", bevat: "width=device-width", omschrijving: "met width=device-width erin" },
    ],
  },
  {
    id: "do-stylelink", groep: "het document zelf", element: "style link",
    titel: "<style> en <link> — waar de CSS vandaan komt",
    uitleg: "Zet een <link> naar een stijlbestand neer en een <style> met één regel erin.",
    les: {
      wat: "CSS komt binnen via <link> (een apart bestand) of via <style> (CSS in de pagina zelf). Een echt project gebruikt bijna altijd <link>.",
      hoe: `<link rel="stylesheet" href="app.css">\n<style>\n  body { background: #eef; }\n</style>`,
      punten: [
        "<link> heeft rel=\"stylesheet\" nodig, anders weet de browser niet wat het is",
        "<link> heeft geen sluittag, <style> wel",
        "één bestand voor je hele site betekent één plek om iets te veranderen",
        "in dit oefenvenster typ je je CSS in het CSS-vak, dat is hetzelfde als een <style>",
      ],
      fout: "rel=\"stylesheet\" vergeten. De browser haalt het bestand dan wel op maar gebruikt het niet.",
    },
    tip: "<link rel=\"stylesheet\" href=\"app.css\"> en daaronder een <style> met een regel erin.",
    start: { html: `<h1>lokaal b16</h1>\n`, css: `` },
    eisen: [
      { soort: "selector", selector: "link[rel='stylesheet']", omschrijving: "er is een <link rel=\"stylesheet\">" },
      { soort: "selector", selector: "link[href]", omschrijving: "met een href naar het bestand" },
      { soort: "tag", tag: "style", nietLeeg: true, omschrijving: "en een <style> met CSS erin" },
    ],
  },

  /* ==================== hoofdstuk 11 — CSS ========================= */

  {
    id: "cs-selector", groep: "CSS", element: "selectors",
    titel: "selectors — wat pak je vast",
    uitleg: "Maak drie regels CSS: één op een element, één op een class, één op een id.",
    les: {
      wat: "Een CSS-regel begint met een selector: wat je vastpakt. Daarna komt tussen accolades wat je ermee doet.",
      hoe: `h1 { color: navy; }\n.kaart { padding: 12px; }\n#hoofdbord { border: 1px solid black; }`,
      punten: [
        "zonder teken: het element zelf (h1)",
        "met een punt: een class (.kaart)",
        "met een hekje: een id (#hoofdbord)",
        "met een spatie ertussen: iets dat binnen iets anders zit (nav a)",
      ],
      fout: "De punt van een class vergeten. kaart pakt een element dat kaart heet, en dat bestaat niet.",
    },
    tip: "Drie regels in het CSS-vak: h1 { }, .kaart { } en #hoofdbord { }, elk met een eigenschap erin.",
    start: {
      html: `<h1>lokaal b16</h1>\n<div class="kaart">een kaart</div>\n<div id="hoofdbord">het bord</div>\n`,
      css: `/* drie regels: op h1, op .kaart en op #hoofdbord */\n`,
    },
    eisen: [
      { soort: "css", selector: "h1", eigenschap: "color", omschrijving: "h1 krijgt een color" },
      { soort: "css", selector: ".kaart", eigenschap: "padding", omschrijving: ".kaart krijgt padding" },
      { soort: "css", selector: "#hoofdbord", eigenschap: "border", omschrijving: "#hoofdbord krijgt een border" },
    ],
  },
  {
    id: "cs-kleur", groep: "CSS", element: "color",
    titel: "color en background — kleur",
    uitleg: "Geef de pagina een achtergrondkleur en de kop een andere tekstkleur.",
    les: {
      wat: "color is de kleur van de tekst, background is de kleur erachter. Je schrijft kleuren als naam, als hex of als rgb.",
      hoe: `body { background: #eaf3ff; }\nh1 { color: #123a6b; }`,
      punten: [
        "red is de naam, #ff0000 is hex, rgb(255,0,0) is hetzelfde",
        "hex is drie paren: rood, groen, blauw",
        "let op het verschil tussen tekst en achtergrond: donkere tekst op een donkere achtergrond leest niemand",
      ],
      fout: "background en color verwisselen, waardoor je tekst in de achtergrond verdwijnt.",
    },
    tip: "body { background: ...; } en h1 { color: ...; }",
    start: { html: `<h1>lokaal b16</h1>\n<p>het bord van de klas</p>\n`, css: `` },
    eisen: [
      { soort: "css", selector: "body", eigenschap: "background", losOok: ["background-color"], omschrijving: "de body krijgt een achtergrondkleur" },
      { soort: "css", selector: "h1", eigenschap: "color", omschrijving: "de <h1> krijgt een tekstkleur" },
    ],
  },
  {
    id: "cs-tekst", groep: "CSS", element: "font",
    titel: "font — het lettertype",
    uitleg: "Geef de pagina een lettertype, maak de kop groter en zet hem gecentreerd.",
    les: {
      wat: "Met font-family kies je het lettertype, met font-size de grootte, met font-weight hoe dik en met text-align waar de tekst staat.",
      hoe: `body { font-family: Tahoma, sans-serif; }\nh1 { font-size: 32px; text-align: center; }`,
      punten: [
        "zet altijd een reserve achter je lettertype: Tahoma, sans-serif",
        "px is een vast aantal beeldpunten, rem rekent mee met de instelling van de gebruiker",
        "font-weight: bold is hetzelfde als 700",
      ],
      fout: "Eén lettertype opgeven zonder reserve. Heeft de bezoeker het niet, dan kiest de browser zomaar iets.",
    },
    tip: "font-family op body, font-size en text-align op h1.",
    start: { html: `<h1>lokaal b16</h1>\n<p>het bord van de klas</p>\n`, css: `` },
    eisen: [
      { soort: "css", selector: "body", eigenschap: "font-family", omschrijving: "de body krijgt een font-family" },
      { soort: "css", selector: "h1", eigenschap: "font-size", omschrijving: "de <h1> krijgt een font-size" },
      { soort: "css", selector: "h1", eigenschap: "text-align", waarde: "center", omschrijving: "en staat gecentreerd" },
    ],
  },
  {
    id: "cs-padding", groep: "CSS", element: "padding",
    titel: "padding — ruimte binnenin",
    uitleg: "Geef een blok een rand en zet de tekst los van die rand met padding.",
    les: {
      wat: "padding is de ruimte tussen de rand van een blok en de inhoud erin. Lucht aan de binnenkant.",
      hoe: `.kaart {\n  border: 1px solid #999;\n  padding: 16px;\n}`,
      punten: [
        "één waarde geldt voor alle vier de kanten",
        "twee waarden: boven-onder en links-rechts (padding: 10px 20px)",
        "je kan ook één kant pakken: padding-left",
      ],
      fout: "padding en margin verwisselen. padding zit binnen de rand, margin erbuiten.",
    },
    tip: ".kaart { border: 1px solid #999; padding: 16px; }",
    start: { html: `<div class="kaart">tekst die tegen de rand plakt</div>\n`, css: `` },
    eisen: [
      { soort: "css", selector: ".kaart", eigenschap: "border", omschrijving: ".kaart krijgt een border" },
      { soort: "css", selector: ".kaart", eigenschap: "padding", omschrijving: "en padding aan de binnenkant" },
    ],
  },
  {
    id: "cs-margin", groep: "CSS", element: "margin",
    titel: "margin — ruimte eromheen",
    uitleg: "Zet ruimte tussen twee blokken en centreer ze met margin.",
    les: {
      wat: "margin is de ruimte buiten een blok: de afstand tot zijn buren. Met margin: 0 auto zet je een blok met een breedte in het midden.",
      hoe: `.kaart {\n  width: 300px;\n  margin: 0 auto 16px;\n}`,
      punten: [
        "margin: 0 auto centreert alleen als het blok een breedte heeft",
        "twee marges onder elkaar vloeien samen: de grootste wint",
        "auto betekent: verdeel de ruimte die overblijft",
      ],
      fout: "Een blok willen centreren met margin: auto zonder er een width bij te zetten. Dan is het al zo breed als het kan.",
    },
    tip: ".kaart { width: 300px; margin: 0 auto 16px; }",
    start: { html: `<div class="kaart">een</div>\n<div class="kaart">twee</div>\n`, css: `` },
    eisen: [
      { soort: "css", selector: ".kaart", eigenschap: "width", omschrijving: ".kaart krijgt een breedte" },
      { soort: "css", selector: ".kaart", eigenschap: "margin", waarde: "auto", omschrijving: "en een margin met auto erin" },
    ],
  },
  {
    id: "cs-border", groep: "CSS", element: "border",
    titel: "border en border-radius — de rand",
    uitleg: "Geef een blok een rand met ronde hoeken.",
    les: {
      wat: "border tekent een lijn om een blok: dikte, soort en kleur. Met border-radius maak je de hoeken rond.",
      hoe: `.kaart {\n  border: 2px solid #2f6bd8;\n  border-radius: 10px;\n}`,
      punten: [
        "de volgorde is dikte, soort, kleur: 2px solid blue",
        "soorten zijn solid, dashed, dotted",
        "border-radius: 50% van een vierkant maakt een cirkel",
        "één kant pakken kan ook: border-bottom",
      ],
      fout: "border: blue schrijven zonder dikte. Zonder dikte zie je niets.",
    },
    tip: "border: 2px solid ...; en border-radius: 10px;",
    start: { html: `<div class="kaart">een kaartje</div>\n`, css: `` },
    eisen: [
      { soort: "css", selector: ".kaart", eigenschap: "border", omschrijving: ".kaart krijgt een border" },
      { soort: "css", selector: ".kaart", eigenschap: "border-radius", omschrijving: "en ronde hoeken" },
    ],
  },
  {
    id: "cs-schaduw", groep: "CSS", element: "box-shadow",
    titel: "box-shadow — de schaduw",
    uitleg: "Geef je kaartje een zachte schaduw zodat het van de pagina lijkt te komen.",
    les: {
      wat: "box-shadow tekent een schaduw achter een blok: hoe ver naar rechts, hoe ver naar beneden, hoe vaag, en in welke kleur.",
      hoe: `.kaart {\n  box-shadow: 0 4px 12px rgba(0,0,0,.25);\n}`,
      punten: [
        "de vier waarden zijn: x, y, vaagheid, kleur",
        "rgba geeft een kleur met doorzichtigheid: de laatste waarde is 0 tot 1",
        "een zachte grote schaduw oogt rustiger dan een harde kleine",
      ],
      fout: "Een volledig zwarte schaduw zonder doorzichtigheid nemen. Dat ziet er meteen goedkoop uit.",
    },
    tip: "box-shadow: 0 4px 12px rgba(0,0,0,.25);",
    start: { html: `<div class="kaart">een kaartje</div>\n`, css: `.kaart {\n  background: white;\n  padding: 16px;\n}\n` },
    eisen: [
      { soort: "css", selector: ".kaart", eigenschap: "box-shadow", omschrijving: ".kaart krijgt een box-shadow" },
    ],
  },
  {
    id: "cs-maat", groep: "CSS", element: "width",
    titel: "width en max-width — hoe breed",
    uitleg: "Geef een blok een maximale breedte, zodat het op een klein scherm gewoon meekrimpt.",
    les: {
      wat: "width is een vaste breedte, max-width is een grens: kleiner mag, groter niet. Op een telefoon is dat het verschil tussen werken en niet werken.",
      hoe: `.kaart {\n  max-width: 600px;\n  width: 100%;\n}`,
      punten: [
        "width: 300px blijft ook 300px op een scherm van 320px breed",
        "max-width: 600px met width: 100% past zich aan",
        "hetzelfde geldt voor height en min-height",
      ],
      fout: "Overal vaste breedtes in px zetten. Op een telefoon steekt je pagina dan buiten het scherm.",
    },
    tip: "max-width: 600px; en width: 100%;",
    start: { html: `<div class="kaart">dit blok moet meekrimpen</div>\n`, css: `.kaart {\n  background: #dbe9ff;\n  padding: 16px;\n}\n` },
    eisen: [
      { soort: "css", selector: ".kaart", eigenschap: "max-width", omschrijving: ".kaart krijgt een max-width" },
      { soort: "css", selector: ".kaart", eigenschap: "width", waarde: "100%", omschrijving: "en een width van 100%" },
    ],
  },
  {
    id: "cs-flex", groep: "CSS", element: "flex",
    titel: "display: flex — dingen naast elkaar",
    uitleg: "Zet drie blokjes naast elkaar met flex, met ruimte ertussen.",
    les: {
      wat: "display: flex zet de kinderen van een blok op een rij naast elkaar. Met gap zet je ruimte ertussen, met justify-content verdeel je de overige ruimte.",
      hoe: `.rij {\n  display: flex;\n  gap: 12px;\n  justify-content: space-between;\n}`,
      punten: [
        "flex zet je op de OUDER, niet op de blokjes zelf",
        "gap is de ruimte tussen de kinderen, veel simpeler dan marges",
        "align-items regelt de andere richting: center zet ze op één hoogte",
        "flex-direction: column zet ze weer onder elkaar",
      ],
      fout: "display: flex op de blokjes zelf zetten. Het hoort op de doos eromheen.",
    },
    tip: ".rij { display: flex; gap: 12px; }",
    start: {
      html: `<div class="rij">\n  <div class="kaart">een</div>\n  <div class="kaart">twee</div>\n  <div class="kaart">drie</div>\n</div>\n`,
      css: `.kaart { background: #dbe9ff; padding: 12px; }\n`,
    },
    eisen: [
      { soort: "css", selector: ".rij", eigenschap: "display", waarde: "flex", omschrijving: ".rij krijgt display: flex" },
      { soort: "css", selector: ".rij", eigenschap: "gap", omschrijving: "met een gap ertussen" },
      { soort: "css", selector: ".rij", eigenschap: "justify-content", omschrijving: "en een justify-content" },
    ],
  },
  {
    id: "cs-grid", groep: "CSS", element: "grid",
    titel: "display: grid — een raster",
    uitleg: "Zet vier blokjes in een raster van twee kolommen.",
    les: {
      wat: "display: grid maakt van een blok een raster met kolommen en rijen. Met grid-template-columns zeg je hoeveel kolommen en hoe breed.",
      hoe: `.raster {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}`,
      punten: [
        "1fr betekent: één deel van de vrije ruimte",
        "repeat(2, 1fr) is hetzelfde als 1fr 1fr, korter opgeschreven",
        "flex is voor een rij, grid is voor rijen en kolommen tegelijk",
        "gap werkt in grid net zo als in flex",
      ],
      fout: "Kolommen bouwen met zwevende blokken of met een tabel. Daar is grid voor.",
    },
    tip: ".raster { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",
    start: {
      html: `<div class="raster">\n  <div class="kaart">een</div>\n  <div class="kaart">twee</div>\n  <div class="kaart">drie</div>\n  <div class="kaart">vier</div>\n</div>\n`,
      css: `.kaart { background: #dbe9ff; padding: 12px; }\n`,
    },
    eisen: [
      { soort: "css", selector: ".raster", eigenschap: "display", waarde: "grid", omschrijving: ".raster krijgt display: grid" },
      { soort: "css", selector: ".raster", eigenschap: "grid-template-columns", omschrijving: "met grid-template-columns" },
      { soort: "css", selector: ".raster", eigenschap: "gap", omschrijving: "en een gap" },
    ],
  },
  {
    id: "cs-hover", groep: "CSS", element: ":hover",
    titel: ":hover en transition — reageren op de muis",
    uitleg: "Laat een knop van kleur veranderen als je erover zweeft, en die verandering zacht verlopen.",
    les: {
      wat: ":hover pakt een element op het moment dat de muis erboven hangt. Met transition laat je de verandering geleidelijk gaan in plaats van met een sprong.",
      hoe: `.knop {\n  background: #2f6bd8;\n  transition: background .2s;\n}\n.knop:hover {\n  background: #1b4796;\n}`,
      punten: [
        "de transition zet je op de gewone regel, niet op de :hover",
        ".2s is twee tiende van een seconde: kort genoeg om vlot te voelen",
        "op een telefoon bestaat zweven niet, dus verstop er nooit iets belangrijks achter",
        "denk ook aan :focus, voor wie met de tab-toets werkt",
      ],
      fout: "De transition alleen op :hover zetten. Dan gaat hij zacht heen en hard terug.",
    },
    tip: "Twee regels: .knop { ... transition: ...; } en .knop:hover { ... }",
    start: { html: `<button class="knop">nakijken</button>\n`, css: `.knop {\n  color: white;\n  padding: 10px 18px;\n  border: 0;\n}\n` },
    eisen: [
      { soort: "css", selectorBevat: ":hover", eigenschap: "background", losOok: ["background-color", "color"], omschrijving: "er is een :hover-regel die de kleur verandert" },
      { soort: "css", selector: ".knop", eigenschap: "transition", omschrijving: "en de knop zelf heeft een transition" },
    ],
  },
  {
    id: "cs-media", groep: "CSS", element: "@media",
    titel: "@media — anders op een klein scherm",
    uitleg: "Laat je raster op een smal scherm overschakelen naar één kolom.",
    les: {
      wat: "Een @media-regel is CSS die alleen geldt als aan een voorwaarde is voldaan, meestal de breedte van het scherm. Zo maak je één pagina die op elk toestel werkt.",
      hoe: `.raster { display: grid; grid-template-columns: 1fr 1fr; }\n\n@media (max-width: 600px) {\n  .raster { grid-template-columns: 1fr; }\n}`,
      punten: [
        "de regels binnen @media staan in een extra paar accolades",
        "max-width betekent: op schermen tot deze breedte",
        "min-width is de andere kant op, en is meestal de betere gewoonte: eerst klein bouwen, dan uitbreiden",
        "vergeet de meta viewport in je HTML niet, anders doet dit niets op een telefoon",
      ],
      fout: "De sluitende accolade van het @media-blok vergeten. Dan valt de rest van je CSS er ook binnen.",
    },
    tip: "@media (max-width: 600px) { .raster { grid-template-columns: 1fr; } }",
    start: {
      html: `<div class="raster">\n  <div class="kaart">een</div>\n  <div class="kaart">twee</div>\n</div>\n`,
      css: `.kaart { background: #dbe9ff; padding: 12px; }\n.raster { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }\n`,
    },
    eisen: [
      { soort: "cssRuw", patroon: "@media", omschrijving: "er staat een @media-regel in je CSS" },
      { soort: "cssRuw", patroon: "max-width", omschrijving: "met een schermbreedte als voorwaarde" },
      { soort: "css", selector: ".raster", eigenschap: "grid-template-columns", omschrijving: "en .raster stelt zijn kolommen opnieuw in" },
    ],
  },

];

module.exports = { LEERLIJN };
