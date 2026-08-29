/* ------------------------------------------------------------------ *
 *  Code Heist — inhoud en nakijkregels
 *
 *  Alles wordt op de SERVER nagekeken. De browser mag nooit beslissen of
 *  iemand geslaagd is, want een gehaalde heist levert echt krediet op.
 * ------------------------------------------------------------------ */

/* Een eis is een object dat we tegen de ingestuurde code houden.
   soort:
     tag       -> element moet bestaan (optioneel: aantal, tekst, attribuut)
     attr      -> element moet een attribuut hebben met eventueel een waarde
     tekst     -> ergens in de HTML moet deze tekst staan (in een element)
     nesting   -> element moet in een ander element zitten
     css       -> selector moet een bepaalde eigenschap zetten
     geen      -> element mag juist NIET voorkomen (voor debug-opdrachten)
*/

const LEVELS = [
  {
    id: "l1",
    titel: "de eerste kraak",
    uitleg: "Elke pagina begint met een titel op het scherm. Zet er een grote kop op met <h1> en zet daaronder een stukje tekst in een <p>.",
    tip: "Een kop schrijf je als <h1>tekst</h1>. Een alinea als <p>tekst</p>.",
    start: { html: "<!-- schrijf hier je code -->\n", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", omschrijving: "er staat een <h1> op de pagina" },
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "die <h1> heeft tekst" },
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "er staat een <p> met tekst onder" },
    ],
  },
  {
    id: "l2",
    titel: "kleur bekennen",
    uitleg: "Kraak de kluis met CSS. Geef de <h1> een kleur en zet de achtergrond van de pagina om.",
    tip: "In CSS schrijf je h1 { color: red; }. De hele pagina pak je met body { background: ...; }",
    start: { html: "<h1>drerries</h1>\n<p>we zijn binnen</p>\n", css: "/* schrijf hier je CSS */\n" },
    eisen: [
      { soort: "tag", tag: "h1", omschrijving: "de <h1> staat er nog" },
      { soort: "css", selector: "h1", eigenschap: "color", omschrijving: "h1 krijgt een color" },
      { soort: "css", selector: "body", eigenschap: "background", losOok: ["background-color"], omschrijving: "body krijgt een achtergrondkleur" },
    ],
  },
  {
    id: "l3",
    titel: "de foto smokkelen",
    uitleg: "Zet een afbeelding op de pagina. Vergeet het alt-attribuut niet, dat is wat een schermlezer voorleest.",
    tip: "<img src=\"...\" alt=\"beschrijving\"> — een img heeft geen sluittag nodig.",
    start: { html: "<h1>bewijsmateriaal</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "img", omschrijving: "er staat een <img> op de pagina" },
      { soort: "attr", tag: "img", attribuut: "src", nietLeeg: true, omschrijving: "die <img> heeft een src" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "en een alt met beschrijving" },
    ],
  },
  {
    id: "l4",
    titel: "lijst van verdachten",
    uitleg: "Maak een lijstje met minstens drie namen. Gebruik een <ul> met <li> erin.",
    tip: "<ul> is de lijst, elke <li> is een regel. De <li> moeten IN de <ul> staan.",
    start: { html: "<h1>verdachten</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "ul", omschrijving: "er is een <ul>" },
      { soort: "tag", tag: "li", minAantal: 3, omschrijving: "met minstens 3 <li> erin" },
      { soort: "nesting", kind: "li", ouder: "ul", omschrijving: "de <li> zitten echt in de <ul>" },
    ],
  },
  {
    id: "l5",
    titel: "de uitgang",
    uitleg: "Elke kraak heeft een vluchtroute. Zet een link naar een andere site met <a>.",
    tip: "<a href=\"https://...\">tekst</a>",
    start: { html: "<h1>wegwezen</h1>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "a", nietLeeg: true, omschrijving: "er is een <a> met tekst" },
      { soort: "attr", tag: "a", attribuut: "href", nietLeeg: true, omschrijving: "die link heeft een href" },
    ],
  },
  {
    id: "l6",
    titel: "netjes in een doos",
    uitleg: "Zet je inhoud in een <div> met een klasse, en geef die klasse in CSS een padding en een rand.",
    tip: "<div class=\"kluis\">...</div> en dan .kluis { padding: 20px; border: 2px solid black; }",
    start: { html: "<h1>de kluis</h1>\n<p>inhoud</p>\n", css: "" },
    eisen: [
      { soort: "attr", tag: "div", attribuut: "class", nietLeeg: true, omschrijving: "er is een <div> met een class" },
      { soort: "css", selectorSoort: "klasse", eigenschap: "padding", omschrijving: "die klasse krijgt padding" },
      { soort: "css", selectorSoort: "klasse", eigenschap: "border", omschrijving: "en een border" },
    ],
  },
];

/* De dagelijkse heist. Type:
     uitleg  -> meerkeuze, vast juist antwoord (kost geen tokens)
     debug   -> kapotte code repareren, wordt structureel nagekeken
     schrijf -> zelf code schrijven die aan de eisen voldoet
*/
const DAILY = [
  {
    id: "d-uitleg-p",
    type: "uitleg",
    vraag: "Wat doe ik hier?",
    code: "<p>drerries zijn de beste</p>",
    opties: [
      "Ik maak een alinea, een blokje gewone tekst.",
      "Ik maak de grootste kop van de pagina.",
      "Ik zet een afbeelding op de pagina.",
      "Ik maak een link naar een andere pagina.",
    ],
    juist: 0,
    waarom: "<p> staat voor paragraph, een alinea. Het is de standaardmanier om een stuk lopende tekst op een pagina te zetten.",
  },
  {
    id: "d-uitleg-h1",
    type: "uitleg",
    vraag: "Leg uit: wat is <h1>?",
    code: "<h1>drerries-ai</h1>",
    opties: [
      "De belangrijkste kop van de pagina, meestal maar één per pagina.",
      "Een alinea met kleine tekst.",
      "Een lijst met opsommingstekens.",
      "De titel die in het tabblad van de browser komt.",
    ],
    juist: 0,
    waarom: "<h1> is de hoofdkop. Er hoort er meestal maar één per pagina te staan; <h2> tot <h6> zijn de onderliggende niveaus. Let op: de tekst in het tabblad komt van <title>, niet van <h1>.",
  },
  {
    id: "d-uitleg-img",
    type: "uitleg",
    vraag: "Wat hoort er altijd bij een <img>?",
    code: "<img src=\"kat.png\" alt=\"een slapende kat\">",
    opties: [
      "Een alt, zodat je weet wat er op staat als de foto niet laadt.",
      "Een sluittag </img>.",
      "Altijd een width en een height.",
      "Een <p> eromheen.",
    ],
    juist: 0,
    waarom: "alt beschrijft de afbeelding. Dat is wat een schermlezer voorleest en wat je ziet als het plaatje niet laadt. Een <img> heeft geen sluittag nodig.",
  },
  {
    id: "d-debug-tag",
    type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Deze kop sluit niet goed af. Repareer hem.",
    start: { html: "<h1>de grote kraak</h2>\n<p>vanavond om acht uur</p>\n", css: "" },
    eisen: [
      { soort: "tag", tag: "h1", nietLeeg: true, omschrijving: "de <h1> is correct geopend en gesloten" },
      { soort: "tag", tag: "p", nietLeeg: true, omschrijving: "de <p> staat er nog" },
      { soort: "geenRuwe", patroon: "</h2>", omschrijving: "er staat geen losse </h2> meer" },
    ],
    waarom: "Een element moet sluiten met dezelfde tag als waarmee het opent: <h1> hoort bij </h1>.",
  },
  {
    id: "d-debug-attr",
    type: "debug",
    vraag: "Zoek de fout",
    uitleg: "Deze afbeelding mist iets belangrijks. Vul aan.",
    start: { html: "<img src=\"buit.png\">\n", css: "" },
    eisen: [
      { soort: "attr", tag: "img", attribuut: "src", nietLeeg: true, omschrijving: "de src staat er nog" },
      { soort: "attr", tag: "img", attribuut: "alt", nietLeeg: true, omschrijving: "er is nu ook een alt" },
    ],
    waarom: "Zonder alt weet niemand wat er op de foto staat als hij niet laadt, en een schermlezer heeft niets om voor te lezen.",
  },
  {
    id: "d-debug-css",
    type: "debug",
    vraag: "Zoek de fout",
    uitleg: "In de CSS is iets vergeten waardoor de regel niet werkt. Repareer het.",
    start: { html: "<h1>rood alarm</h1>\n", css: "h1 {\n  color red;\n}\n" },
    eisen: [
      { soort: "css", selector: "h1", eigenschap: "color", omschrijving: "h1 krijgt echt een color" },
    ],
    waarom: "In CSS hoort er een dubbele punt tussen de eigenschap en de waarde: color: red; Zonder die dubbele punt negeert de browser de hele regel.",
  },
  {
    id: "d-schrijf-title",
    type: "schrijf",
    vraag: "Schrijf me een titel",
    uitleg: "Zet een <title> in de code met de naam van je pagina erin. Dat is de tekst die in het tabblad van de browser verschijnt.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "title", nietLeeg: true, omschrijving: "er is een <title> met tekst erin" },
    ],
    waarom: "<title> hoort in de <head> en bepaalt wat er in het tabblad en in de zoekresultaten staat. Dat is iets anders dan <h1>, die staat op de pagina zelf.",
  },
  {
    id: "d-schrijf-lijst",
    type: "schrijf",
    vraag: "Schrijf me een lijst",
    uitleg: "Maak een lijst met minstens twee dingen die je vandaag moet doen.",
    start: { html: "", css: "" },
    eisen: [
      { soort: "tag", tag: "ul", omschrijving: "er is een <ul>" },
      { soort: "tag", tag: "li", minAantal: 2, omschrijving: "met minstens 2 <li>" },
      { soort: "nesting", kind: "li", ouder: "ul", omschrijving: "de <li> zitten in de <ul>" },
    ],
    waarom: "<ul> is een lijst zonder nummers, <ol> is er één met nummers. De regels zelf zijn altijd <li>.",
  },
];

module.exports = { LEVELS, DAILY };
