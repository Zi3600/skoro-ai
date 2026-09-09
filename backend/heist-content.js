/* ------------------------------------------------------------------ *
 *  Code Heist — inhoud en nakijkregels
 *
 *  Hier staan alleen de zes levels van "de basis". De honderd levels
 *  van de leerlijn staan in heist-levels.js; onderaan plakken we ze
 *  achter elkaar tot één LEVELS. Ze zijn opzettelijk gesplitst: dit
 *  bestand is de instap, dat bestand is de naslag per element.
 *
 *  Alles wordt op de SERVER nagekeken. De browser mag nooit beslissen of
 *  iemand geslaagd is, want een gehaalde heist levert echt krediet op.
 * ------------------------------------------------------------------ */

/* Een eis is een object dat we tegen de ingestuurde code houden.
   soort:
     tag       -> element moet bestaan (optioneel: aantal, tekst, attribuut)
     selector  -> een echte CSS-selector, bv. input[type="checkbox"].
                  Nodig als twee dingen op HETZELFDE element moeten kloppen.
     attr      -> element moet een attribuut hebben met eventueel een waarde
                  (waarde = precies dit, bevat = dit moet erin staan)
     tekst     -> ergens in de HTML moet deze tekst staan (in een element)
     nesting   -> element moet in een ander element zitten
     css       -> selector moet een bepaalde eigenschap zetten
                  (waarde = de waarde moet dit bevatten, voor display: flex)
     cssRuw    -> letterlijk zoeken in de CSS-tekst, voor @media en @keyframes
     geen      -> element mag juist NIET voorkomen (voor debug-opdrachten)
     ruweTelling -> letterlijk tellen in de HTML-broncode, voor sluittags
*/

const BASIS = [
  {
    id: "l1", groep: "de basis",
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
    id: "l2", groep: "de basis",
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
    id: "l3", groep: "de basis",
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
    id: "l4", groep: "de basis",
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
    id: "l5", groep: "de basis",
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
    id: "l6", groep: "de basis",
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

/* De zes hierboven zijn de instap; daarachter komt de leerlijn van
   honderd levels uit heist-levels.js. Eén lijst, want de voortgang van
   een student is gewoon een rij met level-ids. */
const { LEERLIJN } = require("./heist-levels");

const LEVELS = BASIS.concat(LEERLIJN);

module.exports = { LEVELS, BASIS, LEERLIJN };
