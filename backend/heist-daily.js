/* ------------------------------------------------------------------ *
 *  Code Heist — de dagelijkse heists
 *
 *  De opdracht spreekt in rollen: "een titel", "een beschrijving",
 *  "een lijst". Welke tag daarbij hoort staat in het spiekbriefje.
 *  Zo leer je de taal, niet alleen de tags uit je hoofd.
 *
 *  niveau 1 = één ding      niveau 3 = met CSS
 *  niveau 2 = twee dingen   niveau 4 = een hele pagina
 * ------------------------------------------------------------------ */

const DAILY = [

  /* ============================ niveau 1 ============================ */

  {
    id: "d-uitleg-p", niveau: 1, type: "uitleg",
    vraag: "Wat doe ik hier?",
    code: "<p>de kluis staat op de tweede verdieping</p>",
    opties: [
      "Een beschrijving: een blokje gewone tekst.",
      "De grootste titel van de pagina.",
      "Een foto op de pagina zetten.",
      "Een uitgang naar een andere pagina.",
    ],
    juist: 0,
    waarom: "<p> is een beschrijving, oftewel een alinea. Alles wat lopende tekst is, zet je hierin.",
  },
  {
    id: "d-uitleg-h1", niveau: 1, type: "uitleg",
    vraag: "Wat doe ik hier?",
    code: "<h1>operatie nachtvlinder</h1>",
    opties: [
      "De hoofdtitel op de pagina zelf.",
      "De naam die in het tabblad van de browser staat.",
      "Een beschrijving in het klein.",
      "Een lijst met één regel.",
    ],
    juist: 0,
    waarom: "<h1> is de hoofdtitel op de pagina. De naam in het tabblad komt van de tabbladnaam, dat is <title>. Twee verschillende dingen.",
  },
  {
    id: "d-uitleg-img", niveau: 1, type: "uitleg",
    vraag: "Wat hoort er altijd bij een foto?",
    code: '<img src="kluis.png" alt="de kluis van dichtbij">',
    opties: [
      "Een alt, de beschrijving voor als de foto niet laadt.",
      "Een sluittag </img>.",
      "Altijd een breedte en een hoogte.",
      "Een beschrijving eromheen.",
    ],
    juist: 0,
    waarom: "alt beschrijft wat er op de foto staat. Dat leest een schermlezer voor, en het verschijnt als de foto niet laadt. Een foto heeft geen sluittag.",
  },
  {
    id: "d-uitleg-a", niveau: 1, type: "uitleg",
    vraag: "Wat is dit voor ding?",
    code: '<a href="https://school.be">de uitgang</a>',
    opties: [
      "Een uitgang: een link naar een andere plek.",
      "Een knop die iets uitvoert.",
      "Een titel met een adres erin.",
      "Een foto van een deur.",
    ],
    juist: 0,
    waarom: "<a> is een link. In href zet je waar hij naartoe gaat, tussen de tags staat de tekst waarop je klikt.",
  },
  {
    id: "d-uitleg-titelverschil", niveau: 1, type: "uitleg",
    vraag: "Wat komt er in het tabblad van de browser?",
    code: "<title>drerries</title>\n<h1>welkom drerries</h1>",
    opties: [
      "drerries, want dat staat in de tabbladnaam.",
      "welkom drerries, want dat is de grootste tekst.",
      "allebei, onder elkaar.",
      "niks, daar moet je iets anders voor gebruiken.",
    ],
    juist: 0,
    waarom: "De tabbladnaam <title> gaat naar het tabblad en naar Google. De hoofdtitel <h1> staat op de pagina zelf. Ze mogen verschillen.",
  },
  {
    id: "d-schrijf-title", niveau: 1, type: "schrijf",
    vraag: "Geef de kraak een naam",
    uitleg: "Elke goede kraak heeft een codenaam. Zet een tabbladnaam in je code met de naam van jouw operatie erin.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "title", nietLeeg: true, omschrijving: "er is een tabbladnaam met tekst erin" },
    ],
    waarom: "De tabbladnaam is <title>. Die verschijnt in het tabblad en in zoekresultaten, niet op de pagina zelf.",
  },
  {
    id: "d-schrijf-buit", niveau: 1, type: "schrijf",
    vraag: "Kondig de buit aan",
    uitleg: "Zet een hoofdtitel op de pagina met het woord BUIT erin. Verder mag je zelf weten wat er staat.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er staat een hoofdtitel op de pagina" },
      { soort: "tagTekst", tag: "h1", tekst: "buit", omschrijving: "in die titel staat het woord BUIT" },
    ],
    waarom: "De hoofdtitel is <h1>. Wat ertussen staat is gewoon tekst, dus je kan er elk woord in kwijt.",
  },
  {
    id: "d-schrijf-uitgang", niveau: 1, type: "schrijf",
    vraag: "Regel een vluchtroute",
    uitleg: "Zet een uitgang op de pagina die naar een andere website gaat. De tekst waarop je klikt kies je zelf.",
    start: { html: "<h1>wegwezen</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "a", nietLeeg: true, omschrijving: "er is een uitgang met tekst erop" },
      { soort: "attr", tag: "a", attribuut: "href", nietLeeg: true, omschrijving: "en die uitgang gaat ergens naartoe" },
    ],
    waarom: "Een uitgang is <a>. Zonder href gaat hij nergens heen en is het gewoon tekst.",
  },
  {
    id: "d-schrijf-beschrijving", niveau: 1, type: "schrijf",
    vraag: "Schrijf het rapport",
    uitleg: "Zet een beschrijving op de pagina van minstens 40 tekens. Vertel kort wat er vannacht gebeurd is.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "p", minTekens: 40, omschrijving: "er is een beschrijving van minstens 40 tekens" },
    ],
    waarom: "Een beschrijving is <p>. Eén woord is geen rapport, vandaar de minimumlengte.",
  },
  {
    id: "d-debug-tag", niveau: 1, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Deze titel sluit niet goed af. Repareer hem.",
    start: { html: "<h1>de grote kraak</h2>\n<p>vanavond om acht uur</p>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "de hoofdtitel opent en sluit nu correct" },
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "de beschrijving staat er nog" },
      { soort: "geenRuwe", patroon: "</h2>", omschrijving: "er staat geen losse </h2> meer" },
    ],
    waarom: "Een element sluit met dezelfde tag als waarmee het opent: <h1> hoort bij </h1>.",
  },
  {
    id: "d-debug-attr", niveau: 1, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Deze foto mist iets waardoor niemand weet wat erop staat. Vul aan.",
    start: { html: '<img src="buit.png">\n', css: "" },
    eisen: [
      { soort: "attr", tag: "img", attribuut: "src", nietLeeg: true, omschrijving: "de foto wijst nog naar een bestand" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "er is nu ook een alt-beschrijving" },
    ],
    waarom: "Zonder alt heeft een schermlezer niets om voor te lezen en zie je niks als de foto faalt.",
  },
  {
    id: "d-debug-open-p", niveau: 1, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Er is een beschrijving die nooit meer stopt. Sluit hem netjes af.",
    start: { html: "<h1>logboek</h1>\n<p>de deur stond open\n<p>de kluis was leeg</p>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "p", minAantal: 2, nietLeeg: true, omschrijving: "er zijn twee beschrijvingen" },
      { soort: "ruweTelling", patroon: "</p>", minAantal: 2, omschrijving: "en ze worden allebei netjes afgesloten" },
    ],
    waarom: "Vergeet je </p>, dan repareert de browser dat stilletjes — maar je code klopt niet. Elke <p> hoort zijn eigen </p> te hebben.",
  },
  {
    id: "d-debug-leeg-href", niveau: 1, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Deze uitgang komt nergens uit. Geef hem een bestemming.",
    start: { html: '<a href="">ontsnappen</a>\n', css: "" },
    eisen: [
      { soort: "attr", tag: "a", attribuut: "href", nietLeeg: true, omschrijving: "de uitgang heeft nu een echte bestemming" },
      { soort: "tag", tag: "a", nietLeeg: true, omschrijving: "en er staat nog tekst op" },
    ],
    waarom: "Een lege href doet niets. Er moet een adres in, bijvoorbeeld https://iets.be",
  },

  /* ============================ niveau 2 ============================ */

  {
    id: "d-schrijf-plan", niveau: 2, type: "schrijf",
    vraag: "Maak het plan",
    uitleg: "We willen een titel en een beschrijving. De titel is de naam van de operatie, de beschrijving vertelt in het kort wat het plan is.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "tag", tag: "p", minTekens: 25, omschrijving: "en een beschrijving van minstens 25 tekens" },
    ],
    waarom: "Titel is <h1>, beschrijving is <p>. Samen heb je de basis van elke pagina.",
  },
  {
    id: "d-schrijf-ploeg", niveau: 2, type: "schrijf",
    vraag: "Stel de ploeg samen",
    uitleg: "We willen een titel en daaronder een lijst met minstens drie namen.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "tag", tag: "li", minAantal: 3, nietLeeg: true, omschrijving: "er staan minstens 3 namen in de lijst" },
      { soort: "nesting", kind: "li", ouder: "ul", omschrijving: "de namen zitten netjes in de lijst" },
    ],
    waarom: "Een lijst is <ul> en elke regel erin is een <li>. De regels moeten binnen de lijst staan, niet ernaast.",
  },
  {
    id: "d-schrijf-bewijs", niveau: 2, type: "schrijf",
    vraag: "Lever het bewijs",
    uitleg: "We willen een foto met een alt-beschrijving, en daaronder een beschrijving die uitlegt wat we zien.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "attr", tag: "img", attribuut: "src", nietLeeg: true, omschrijving: "er is een foto" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "met een alt-beschrijving" },
      { soort: "tag", tag: "p", minTekens: 20, omschrijving: "en een beschrijving eronder" },
    ],
    waarom: "src zegt wélke foto, alt zegt wát erop staat. De <p> eronder is je uitleg voor de lezer.",
  },
  {
    id: "d-schrijf-tussenkop", niveau: 2, type: "schrijf",
    vraag: "Deel het dossier op",
    uitleg: "We willen een hoofdtitel, daaronder een tussenkop, en daaronder een beschrijving.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een hoofdtitel" },
      { soort: "tag", tag: "h2", nietLeeg: true, omschrijving: "er is een tussenkop" },
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "en een beschrijving" },
    ],
    waarom: "Koppen hebben niveaus: <h1> is de hoofdtitel, <h2> een tussenkop eronder, enzovoort tot <h6>.",
  },
  {
    id: "d-schrijf-stappen", niveau: 2, type: "schrijf",
    vraag: "Schrijf het draaiboek",
    uitleg: "We willen een titel en een genummerde lijst met minstens drie stappen. Let op: genummerd, niet met bolletjes.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "tag", tag: "ol", omschrijving: "er is een genummerde lijst" },
      { soort: "nesting", kind: "li", ouder: "ol", omschrijving: "met stappen erin" },
      { soort: "tag", tag: "li", minAantal: 3, nietLeeg: true, omschrijving: "minstens 3 stappen" },
    ],
    waarom: "<ul> geeft bolletjes, <ol> geeft nummers. De regels zijn in allebei <li>.",
  },
  {
    id: "d-uitleg-lijsten", niveau: 2, type: "uitleg",
    vraag: "Wat is het verschil?",
    code: "<ul><li>koevoet</li></ul>\n<ol><li>koevoet</li></ol>",
    opties: [
      "De eerste geeft bolletjes, de tweede nummers.",
      "De eerste is voor tekst, de tweede voor getallen.",
      "Er is geen verschil, het is hetzelfde.",
      "De tweede werkt alleen met meer dan drie regels.",
    ],
    juist: 0,
    waarom: "<ul> is unordered: bolletjes. <ol> is ordered: nummers. Gebruik <ol> als de volgorde ertoe doet, zoals bij stappen.",
  },
  {
    id: "d-uitleg-class", niveau: 2, type: "uitleg",
    vraag: "Waar dient dit voor?",
    code: '<div class="kluis">geheim</div>',
    opties: [
      "Een label waarmee je dit blok in CSS kan opmaken.",
      "De tekst die op het scherm verschijnt.",
      "Een link naar een pagina die kluis heet.",
      "Een commentaar dat de browser negeert.",
    ],
    juist: 0,
    waarom: 'Met class geef je een element een naam. In CSS pak je die met een punt ervoor: .kluis { ... }',
  },
  {
    id: "d-debug-nesting", niveau: 2, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "De namen horen in de lijst te staan, maar ze hangen erbuiten. Zet ze goed.",
    start: { html: "<ul></ul>\n<li>sam</li>\n<li>nour</li>\n", css: "" },
    eisen: [
      { soort: "nesting", kind: "li", ouder: "ul", omschrijving: "de regels zitten nu in de lijst" },
      { soort: "tag", tag: "li", minAantal: 2, nietLeeg: true, omschrijving: "er zijn nog steeds 2 namen" },
    ],
    waarom: "Een <li> hoort altijd binnen een <ul> of <ol>. Erbuiten weet de browser niet wat hij ermee moet.",
  },
  {
    id: "d-debug-dubbele-h1", niveau: 2, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Hier staan twee hoofdtitels. Maak van de tweede een tussenkop, want een pagina heeft er maar één nodig.",
    start: { html: "<h1>het dossier</h1>\n<h1>de verdachten</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", minAantal: 1, nietLeeg: true, omschrijving: "er is nog een hoofdtitel" },
      { soort: "tag", tag: "h2", nietLeeg: true, omschrijving: "de tweede is nu een tussenkop" },
      { soort: "geenRuwe", patroon: "<h1>de verdachten", omschrijving: "de verdachten staat niet meer als hoofdtitel" },
    ],
    waarom: "Eén <h1> per pagina houdt de structuur duidelijk, voor lezers én voor zoekmachines. Alles daaronder is <h2> en verder.",
  },
  {
    id: "d-schrijf-tabblad-en-titel", niveau: 2, type: "schrijf",
    vraag: "Zet de gevel op",
    uitleg: "We willen een tabbladnaam én een hoofdtitel, en ze moeten niet hetzelfde zijn. De tabbladnaam is kort, de titel op de pagina mag uitgebreider.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "title", nietLeeg: true, omschrijving: "er is een tabbladnaam" },
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een hoofdtitel op de pagina" },
    ],
    waarom: "<title> gaat naar het tabblad, <h1> staat op de pagina. Ze mogen verschillen, en meestal is dat ook beter.",
  },

  /* ============================ niveau 3 ============================ */

  {
    id: "d-css-kleur", niveau: 3, type: "schrijf",
    vraag: "Zet het alarm op rood",
    uitleg: "We willen een titel op de pagina, en die titel moet in CSS een kleur krijgen.",
    start: { html: "<h1>alarm</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "css", selector: "h1", eigenschap: "color", omschrijving: "de titel krijgt een kleur via CSS" },
    ],
    waarom: "In CSS schrijf je h1 { color: red; }. De eigenschap voor tekstkleur is color.",
  },
  {
    id: "d-css-achtergrond", niveau: 3, type: "schrijf",
    vraag: "Verf de schuilplaats",
    uitleg: "Geef de hele pagina een achtergrondkleur, en zet er een titel op.",
    start: { html: "<h1>de schuilplaats</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "css", selector: "body", eigenschap: "background", losOok: ["background-color"], omschrijving: "de pagina heeft een achtergrondkleur" },
    ],
    waarom: "De hele pagina pak je met body. background of background-color werkt allebei.",
  },
  {
    id: "d-css-kluis", niveau: 3, type: "schrijf",
    vraag: "Bouw de kluis",
    uitleg: "Maak een vak met een eigen naam (een class), zet er tekst in, en geef dat vak in CSS een rand en ruimte aan de binnenkant.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "attr", tag: "div", attribuut: "class", nietLeeg: true, omschrijving: "er is een vak met een naam" },
      { soort: "css", selectorSoort: "klasse", eigenschap: "border", omschrijving: "dat vak heeft een rand" },
      { soort: "css", selectorSoort: "klasse", eigenschap: "padding", omschrijving: "en ruimte aan de binnenkant" },
    ],
    waarom: "Een vak is <div>. Met class geef je het een naam, en in CSS pak je die met een punt: .kluis { border: 2px solid black; padding: 20px; }",
  },
  {
    id: "d-css-midden", niveau: 3, type: "schrijf",
    vraag: "Zet het in de schijnwerper",
    uitleg: "Zet een titel op de pagina en zorg dat die in CSS gecentreerd staat.",
    start: { html: "<h1>de hoofdprijs</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "css", selector: "h1", eigenschap: "text-align", omschrijving: "de titel wordt uitgelijnd via CSS" },
    ],
    waarom: "text-align: center; zet tekst in het midden. Er bestaat ook left, right en justify.",
  },
  {
    id: "d-css-groot", niveau: 3, type: "schrijf",
    vraag: "Schreeuw het van de daken",
    uitleg: "Zet een beschrijving op de pagina en maak de letters in CSS groter dan normaal.",
    start: { html: "<p>iedereen wegwezen</p>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "er is een beschrijving" },
      { soort: "css", selector: "p", eigenschap: "font-size", omschrijving: "de letters krijgen een grootte via CSS" },
    ],
    waarom: "font-size bepaalt hoe groot de letters zijn, bijvoorbeeld font-size: 24px;",
  },
  {
    id: "d-debug-css-punt", niveau: 3, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "De CSS pakt het vak niet. Er ontbreekt iets kleins in de selector.",
    start: { html: '<div class="kluis">geheim</div>\n', css: "kluis {\n  border: 2px solid black;\n}\n" },
    eisen: [
      { soort: "css", selectorSoort: "klasse", eigenschap: "border", omschrijving: "de klasse-selector klopt nu en zet een rand" },
    ],
    waarom: "Een class pak je in CSS met een punt ervoor: .kluis { } — zonder punt zoekt de browser naar een element dat kluis heet, en dat bestaat niet.",
  },
  {
    id: "d-debug-css-haakje", niveau: 3, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Er staat een accolade te weinig, waardoor de tweede regel niet meer werkt. Repareer het.",
    start: { html: "<h1>rood</h1>\n<p>tekst</p>\n", css: "h1 {\n  color: red;\n\np {\n  color: blue;\n}\n" },
    eisen: [
      { soort: "css", selector: "h1", eigenschap: "color", omschrijving: "de titel krijgt een kleur" },
      { soort: "css", selector: "p", eigenschap: "color", omschrijving: "en de beschrijving ook" },
    ],
    waarom: "Elk CSS-blok opent met { en sluit met }. Vergeet je er één, dan slikt de browser alles wat erna komt.",
  },
  {
    id: "d-uitleg-padding-margin", niveau: 3, type: "uitleg",
    vraag: "Wat is het verschil?",
    code: ".kluis { padding: 20px; }\n.kluis { margin: 20px; }",
    opties: [
      "padding is ruimte binnenin, margin is ruimte errond.",
      "padding is ruimte errond, margin is ruimte binnenin.",
      "Ze doen precies hetzelfde.",
      "padding werkt alleen bij tekst, margin alleen bij foto's.",
    ],
    juist: 0,
    waarom: "padding duwt de inhoud weg van de rand, aan de binnenkant. margin duwt het hele element weg van zijn buren, aan de buitenkant.",
  },
  {
    id: "d-css-knop", niveau: 3, type: "schrijf",
    vraag: "Installeer de noodknop",
    uitleg: "Zet een knop op de pagina met tekst erop, en geef die knop in CSS een achtergrondkleur.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "button", nietLeeg: true, omschrijving: "er is een knop met tekst" },
      { soort: "css", selector: "button", eigenschap: "background", losOok: ["background-color"], omschrijving: "de knop heeft een achtergrondkleur" },
    ],
    waarom: "<button> is een echte knop. Die kan je in CSS opmaken zoals elk ander element.",
  },

  /* ============================ niveau 4 ============================ */

  {
    id: "d-steekbrief", niveau: 4, type: "schrijf",
    vraag: "Maak de steekbrief",
    uitleg: "We willen een volledige steekbrief: een tabbladnaam, een hoofdtitel, een foto met alt, en een beschrijving van minstens 30 tekens.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "title", nietLeeg: true, omschrijving: "er is een tabbladnaam" },
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een hoofdtitel" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "er is een foto met alt" },
      { soort: "tag", tag: "p", minTekens: 30, omschrijving: "en een beschrijving van minstens 30 tekens" },
    ],
    waarom: "Vier bouwstenen op één pagina: <title>, <h1>, <img alt> en <p>. Dat is de basis van bijna elke webpagina.",
  },
  {
    id: "d-poster", niveau: 4, type: "schrijf",
    vraag: "Hang de poster op",
    uitleg: "We willen een titel, een tussenkop, een lijst met minstens twee regels, en een uitgang naar een andere site.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "tag", tag: "h2", nietLeeg: true, omschrijving: "er is een tussenkop" },
      { soort: "nesting", kind: "li", ouder: "ul", omschrijving: "er is een lijst met regels erin" },
      { soort: "tag", tag: "li", minAantal: 2, nietLeeg: true, omschrijving: "minstens 2 regels in de lijst" },
      { soort: "attr", tag: "a", attribuut: "href", nietLeeg: true, omschrijving: "en een uitgang met bestemming" },
    ],
    waarom: "Hoe meer bouwstenen je combineert, hoe meer het op een echte pagina lijkt. De volgorde bepaal je zelf.",
  },
  {
    id: "d-dossier-css", niveau: 4, type: "schrijf",
    vraag: "Leg het dossier aan",
    uitleg: "Maak een vak met een naam, zet daarin een titel en een beschrijving, en geef het vak in CSS een achtergrond, een rand en ruimte aan de binnenkant.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "attr", tag: "div", attribuut: "class", nietLeeg: true, omschrijving: "er is een vak met een naam" },
      { soort: "nesting", kind: "h1", ouder: "div", omschrijving: "de titel staat in het vak" },
      { soort: "nesting", kind: "p", ouder: "div", omschrijving: "de beschrijving ook" },
      { soort: "css", selectorSoort: "klasse", eigenschap: "background", losOok: ["background-color"], omschrijving: "het vak heeft een achtergrond" },
      { soort: "css", selectorSoort: "klasse", eigenschap: "border", omschrijving: "en een rand" },
      { soort: "css", selectorSoort: "klasse", eigenschap: "padding", omschrijving: "en ruimte aan de binnenkant" },
    ],
    waarom: "Een <div> groepeert dingen. Alles wat erin staat kan je in één keer opmaken via de class van dat vak.",
  },
  {
    id: "d-tabel", niveau: 4, type: "schrijf",
    vraag: "Vul het logboek in",
    uitleg: "Maak een tabel met minstens twee rijen. In elke rij staan minstens twee vakjes.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "table", omschrijving: "er is een tabel" },
      { soort: "tag", tag: "tr", minAantal: 2, omschrijving: "met minstens 2 rijen" },
      { soort: "nesting", kind: "td", ouder: "tr", omschrijving: "en vakjes in die rijen" },
      { soort: "tag", tag: "td", minAantal: 4, omschrijving: "minstens 4 vakjes in totaal" },
    ],
    waarom: "<table> is de tabel, <tr> is een rij, <td> is een vakje in die rij. Vakjes zitten altijd in een rij.",
  },
  {
    id: "d-citaat", niveau: 4, type: "schrijf",
    vraag: "Noteer de verklaring",
    uitleg: "Zet een titel, een citaat van de getuige, en daaronder een beschrijving die vertelt wie het gezegd heeft.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "er is een titel" },
      { soort: "tag", tag: "blockquote", nietLeeg: true, omschrijving: "er is een citaat" },
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "en een beschrijving eronder" },
    ],
    waarom: "<blockquote> is een citaat. De browser laat dat inspringen, zodat je ziet dat iemand anders aan het woord is.",
  },
  {
    id: "d-nadruk", niveau: 4, type: "schrijf",
    vraag: "Onderstreep het gevaar",
    uitleg: "Schrijf een beschrijving waarin minstens één woord dikgedrukt staat en minstens één woord schuin.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "er is een beschrijving" },
      { soort: "tag", tag: "strong", nietLeeg: true, omschrijving: "met een dikgedrukt woord" },
      { soort: "tag", tag: "em", nietLeeg: true, omschrijving: "en een schuin woord" },
    ],
    waarom: "<strong> maakt dik, <em> maakt schuin. Ze mogen midden in een <p> staan, rond losse woorden.",
  },
  {
    id: "d-debug-groot", niveau: 4, type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Deze pagina is op drie plekken kapot: een tag sluit verkeerd, de foto mist een alt, en de CSS mist een dubbele punt. Repareer alles.",
    start: {
      html: '<h1>het dossier</h2>\n<img src="foto.png">\n<p>bewijsmateriaal</p>\n',
      css: "h1 {\n  color blue;\n}\n",
    },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "de titel sluit correct af" },
      { soort: "geenRuwe", patroon: "</h2>", omschrijving: "geen losse </h2> meer" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "de foto heeft een alt" },
      { soort: "css", selector: "h1", eigenschap: "color", omschrijving: "de CSS-regel werkt nu" },
    ],
    waarom: "Drie klassiekers op een rij: sluittag moet matchen, een foto hoort een alt te hebben, en in CSS staat er een dubbele punt tussen eigenschap en waarde.",
  },
];

/* ------------------------- het spiekbriefje ------------------------ *
 *  Maes-AI spreekt in rollen. Hier staat welke tag daarbij hoort.
 * ------------------------------------------------------------------ */

const SPIEK = [
  {
    groep: "tekst",
    rijen: [
      { woord: "tabbladnaam", tag: "<title>", uitleg: "de naam in het tabblad van de browser, niet op de pagina zelf", voorbeeld: "<title>drerries</title>" },
      { woord: "hoofdtitel", tag: "<h1>", uitleg: "de grootste titel op de pagina, één per pagina", voorbeeld: "<h1>de kraak</h1>" },
      { woord: "tussenkop", tag: "<h2>", uitleg: "een kop onder de hoofdtitel, tot <h6> toe", voorbeeld: "<h2>de ploeg</h2>" },
      { woord: "beschrijving", tag: "<p>", uitleg: "een alinea gewone tekst", voorbeeld: "<p>het plan is simpel</p>" },
      { woord: "dikgedrukt", tag: "<strong>", uitleg: "nadruk, midden in een zin", voorbeeld: "<strong>nu</strong>" },
      { woord: "schuin", tag: "<em>", uitleg: "lichtere nadruk, midden in een zin", voorbeeld: "<em>misschien</em>" },
      { woord: "citaat", tag: "<blockquote>", uitleg: "iemand anders aan het woord", voorbeeld: "<blockquote>ik zag niks</blockquote>" },
    ],
  },
  {
    groep: "onderdelen",
    rijen: [
      { woord: "lijst", tag: "<ul> + <li>", uitleg: "bolletjes; elke regel is een <li> binnen de <ul>", voorbeeld: "<ul><li>koevoet</li></ul>" },
      { woord: "genummerde lijst", tag: "<ol> + <li>", uitleg: "nummers in plaats van bolletjes", voorbeeld: "<ol><li>eerst dit</li></ol>" },
      { woord: "foto", tag: "<img>", uitleg: "src zegt welke, alt zegt wat erop staat", voorbeeld: '<img src="a.png" alt="de kluis">' },
      { woord: "uitgang / link", tag: "<a>", uitleg: "href is waar hij heen gaat", voorbeeld: '<a href="https://x.be">weg</a>' },
      { woord: "knop", tag: "<button>", uitleg: "een echte knop om op te drukken", voorbeeld: "<button>start</button>" },
      { woord: "vak", tag: "<div>", uitleg: "groepeert dingen; geef het een class om op te maken", voorbeeld: '<div class="kluis">…</div>' },
      { woord: "tabel", tag: "<table> <tr> <td>", uitleg: "tabel, rij, vakje in die rij", voorbeeld: "<table><tr><td>a</td></tr></table>" },
    ],
  },
  {
    groep: "opmaak (CSS)",
    rijen: [
      { woord: "kleur", tag: "color", uitleg: "de kleur van de tekst", voorbeeld: "h1 { color: red; }" },
      { woord: "achtergrond", tag: "background", uitleg: "de achtergrondkleur", voorbeeld: "body { background: #cfefff; }" },
      { woord: "rand", tag: "border", uitleg: "een lijn rond het element", voorbeeld: ".kluis { border: 2px solid black; }" },
      { woord: "ruimte binnenin", tag: "padding", uitleg: "duwt de inhoud weg van de rand", voorbeeld: ".kluis { padding: 20px; }" },
      { woord: "ruimte errond", tag: "margin", uitleg: "duwt het element weg van zijn buren", voorbeeld: ".kluis { margin: 20px; }" },
      { woord: "lettergrootte", tag: "font-size", uitleg: "hoe groot de letters zijn", voorbeeld: "p { font-size: 24px; }" },
      { woord: "uitlijnen", tag: "text-align", uitleg: "center, left of right", voorbeeld: "h1 { text-align: center; }" },
      { woord: "een class pakken", tag: ".naam", uitleg: "punt ervoor, anders zoekt de browser een element", voorbeeld: '.kluis { … }  bij  class="kluis"' },
    ],
  },
];

module.exports = { DAILY, SPIEK };
