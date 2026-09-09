/* ------------------------------------------------------------------ *
 *  ICW — het artikel en de quiz op de "over ICW" pagina
 *
 *  Dit bestand is bewust de enige plek waar die tekst staat, net zoals
 *  heist-content.js de enige plek is voor de levels. Wil je iets aan de
 *  tekst veranderen, doe het hier: het scherm haalt alles op via /icw en
 *  hoeft niet aangepast te worden.
 *
 *  LET OP — de vakinhoud hieronder komt van de officiële omschrijving van
 *  de studierichting "Informatica- en communicatiewetenschappen" (derde
 *  graad, doorstroomfinaliteit) op onderwijskiezer.be. Wat op onze school
 *  concreet anders loopt (lesuren, projecten, leerkrachten, welke talen)
 *  weet die bron niet. Zet dat er zelf bij en verzin het niet.
 * ------------------------------------------------------------------ */

/* Het artikel leest als een forumdraad: één openingsbericht en daaronder
   antwoorden die elk een vraag beantwoorden. Elk bericht heeft een auteur
   en een "rol", zodat het scherm er een badge bij kan zetten. */
const ARTIKEL = {
  titel: "Wat is ICW eigenlijk?",
  onderschrift: "alles over Informatica- en communicatiewetenschappen, uitgelegd door de klas van B16",
  posts: [
    {
      id: "wat-is-icw",
      titel: "Wat is ICW?",
      auteur: "lokaal b16",
      rol: "de klas",
      speld: true,
      blokken: [
        { soort: "tekst", tekst: "ICW staat voor Informatica- en communicatiewetenschappen. Het is een richting in de derde graad van het secundair, in de doorstroomfinaliteit: je wordt er dus niet in opgeleid voor één specifieke job, je wordt erin klaargestoomd om verder te studeren." },
        { soort: "tekst", tekst: "De korte versie: het is een STEM-richting met een stevige basis wiskunde en wetenschappen, waar informatica geen bijvak is maar de kern. Je leert niet alleen computers gebruiken, je leert hoe ze werken en hoe je ze zelf iets nieuws laat doen." },
        { soort: "kader", tekst: "Verwar het niet met een richting waar je vooral leert werken mét software. Hier gaat het over de laag daaronder: programmeren, netwerken, data en de wiskunde die er onder ligt." },
        { soort: "lijst", kop: "Waar het over gaat", items: [
          "programmeren en algoritmen — hoe je een probleem in stappen uiteenlegt die een machine kan uitvoeren",
          "software ontwikkelen en onderhouden",
          "computernetwerken opzetten en beheren, en datacommunicatie",
          "IoT: toestellen die met elkaar praten, van machines in een fabriek tot een smartwatch",
          "data en databanken — informatie ordenen zodat je er iets aan hebt",
          "elektronica: experimenteren, onderzoeken, uitproberen",
        ] },
        { soort: "tekst", tekst: "Daarnaast krijg je uitgebreide wiskunde (matrices, functies, integralen, goniometrie, complexe getallen, vectoren, statistiek) en uitgebreide fysica (elektromagnetisme, elektronica, elektrodynamica, golven en trillingen). Die twee zijn geen bijzaak: ze zijn de reden dat je nadien in het hoger onderwijs meekunt." },
      ],
    },
    {
      id: "wat-kan-ik-ermee",
      titel: "Wat kan ik doen met ICW?",
      auteur: "lokaal b16",
      rol: "de klas",
      blokken: [
        { soort: "tekst", tekst: "Meteen na het secundair: verder studeren. Dat is waar de richting voor gemaakt is. Informatica, computerwetenschappen, industrieel of burgerlijk ingenieur, elektronica-ICT, telecommunicatie, toegepaste informatica — professionele bachelor of academische opleiding, allebei liggen open." },
        { soort: "tekst", tekst: "Maar je moet niet wachten tot je afgestudeerd bent om er iets mee te doen. Deze site is daar het bewijs van: het is een schoolproject, gebouwd door leerlingen, en het draait echt." },
        { soort: "lijst", kop: "Wat je tijdens de rit al kan", items: [
          "je eigen site of app bouwen en online zetten",
          "een AI aan je eigen project hangen — zie de pagina over Maes-AI",
          "een netwerkje thuis fatsoenlijk inrichten in plaats van hopen dat het werkt",
          "met een microcontroller iets in de echte wereld laten bewegen",
          "begrijpen waarom iets stuk is in plaats van opnieuw op te starten en te hopen",
        ] },
        { soort: "kader", tekst: "Eerlijk zijn: het is een doorstroomrichting. Je gaat véél wiskunde zien. Wie informatica leuk vindt maar wiskunde wil ontlopen, zit hier op de verkeerde plaats — kijk dan zeker ook naar de arbeidsmarkt- en dubbele finaliteiten." },
      ],
    },
    {
      id: "voor-wie",
      titel: "Voor wie is het?",
      auteur: "lokaal b16",
      rol: "de klas",
      blokken: [
        { soort: "tekst", tekst: "Voor wie graag uitzoekt hoe iets in elkaar zit. Niet per se voor wie nu al kan programmeren — dat leer je hier. Wel voor wie het niet erg vindt dat iets drie keer niet werkt voor het werkt." },
        { soort: "lijst", kop: "Goede tekenen", items: [
          "je wil weten waaróm iets werkt, niet alleen dát het werkt",
          "een probleem dat niet meteen lukt maakt je koppig in plaats van moe",
          "wiskunde is oké voor jou, ook als het niet je lievelingsvak is",
          "je werkt graag aan iets dat af raakt en dat je kan tonen",
        ] },
        { soort: "tekst", tekst: "Twijfel je? Doe de quiz hieronder. Die zegt niet of je slim genoeg bent — dat kan een quiz niet — maar wel of de manier van werken bij je past." },
      ],
    },
  ],
};

/* De quiz is een oriëntatiequiz, geen kennisquiz: er is geen goed of fout
   antwoord, elke keuze levert punten op. Na elke vraag krijg je een
   "wist je dat" te zien, zodat je ook iets leert terwijl je klikt.

   Het optellen gebeurt op de server (zie /icw/quiz), zodat de punten per
   antwoord niet in de browser staan en de uitslag betekenis houdt. */
const QUIZ = {
  titel: "Doe de ICW-quiz",
  intro: "Acht vragen, geen goede of foute antwoorden. Aan het eind weet je of de manier van werken in ICW bij je past.",
  vragen: [
    {
      id: "q1",
      vraag: "Je app werkt niet en je hebt geen idee waarom. Wat doe je?",
      opties: [
        { tekst: "Stap voor stap uitzoeken waar het misloopt", punten: 3 },
        { tekst: "Alles opnieuw beginnen, sneller dan zoeken", punten: 1 },
        { tekst: "Vragen of iemand anders er eens naar kijkt", punten: 2 },
        { tekst: "Wegklikken en iets anders doen", punten: 0 },
      ],
      weetje: "Fouten zoeken (debuggen) is een groot deel van het werk. Programmeurs schrijven minder tijd code dan ze uitzoeken waarom code niet doet wat ze dachten.",
    },
    {
      id: "q2",
      vraag: "Wiskunde. Eerlijk zijn.",
      opties: [
        { tekst: "Ik vind het leuk", punten: 3 },
        { tekst: "Het gaat wel, ik doe het gewoon", punten: 3 },
        { tekst: "Het kost me moeite maar ik geef niet op", punten: 2 },
        { tekst: "Ik probeer het te vermijden", punten: 0 },
      ],
      weetje: "In ICW zit uitgebreide wiskunde: matrices, functies, integralen, goniometrie, complexe getallen, vectoren en statistiek. Je moet er niet verliefd op zijn, maar ontlopen kan niet.",
    },
    {
      id: "q3",
      vraag: "Je krijgt een microcontroller en een doos onderdelen. Eerste gedachte?",
      opties: [
        { tekst: "Wat kan ik hiermee bouwen?", punten: 3 },
        { tekst: "Waar staat de handleiding?", punten: 2 },
        { tekst: "Zolang iemand toont hoe het moet, prima", punten: 1 },
        { tekst: "Liever niet, ik doe iets anders", punten: 0 },
      ],
      weetje: "Elektronica en IoT horen erbij: toestellen die met elkaar praten, van machines in een fabriek tot een smartwatch. Je zit dus niet alleen achter een scherm.",
    },
    {
      id: "q4",
      vraag: "Wat trekt je het meest aan?",
      opties: [
        { tekst: "Zelf iets maken dat werkt", punten: 3 },
        { tekst: "Begrijpen hoe bestaande dingen werken", punten: 3 },
        { tekst: "Met technologie werken zonder ze te bouwen", punten: 1 },
        { tekst: "Iets helemaal anders", punten: 0 },
      ],
      weetje: "ICW zit op de laag onder de knoppen: niet software gebruiken, maar software en netwerken maken en begrijpen.",
    },
    {
      id: "q5",
      vraag: "Groepswerk aan een project van enkele weken:",
      opties: [
        { tekst: "Top, samen kom je verder", punten: 3 },
        { tekst: "Oké, zolang de taken duidelijk zijn", punten: 2 },
        { tekst: "Liever alleen werken", punten: 1 },
        { tekst: "Lange projecten zijn niets voor mij", punten: 0 },
      ],
      weetje: "Veel van wat je in ICW maakt is te groot voor één persoon en te lang voor één les. Deze site is daar een voorbeeld van.",
    },
    {
      id: "q6",
      vraag: "Na het secundair wil je...",
      opties: [
        { tekst: "Verder studeren, richting IT of ingenieur", punten: 3 },
        { tekst: "Verder studeren, ik weet nog niet wat", punten: 2 },
        { tekst: "Zo snel mogelijk gaan werken", punten: 0 },
        { tekst: "Geen idee, ik zie wel", punten: 1 },
      ],
      weetje: "ICW is een doorstroomrichting: ze is gemaakt om je klaar te zetten voor hoger onderwijs, niet om je meteen aan het werk te helpen.",
    },
    {
      id: "q7",
      vraag: "Iemand legt uit hoe het internet werkt. Jij:",
      opties: [
        { tekst: "Vraagt door tot je het echt snapt", punten: 3 },
        { tekst: "Luistert geïnteresseerd", punten: 2 },
        { tekst: "Denkt: het werkt toch", punten: 1 },
        { tekst: "Haakt af", punten: 0 },
      ],
      weetje: "Netwerken en datacommunicatie zijn een vak apart in ICW. Je leert er niet alleen over praten maar er ook eentje opzetten en beheren.",
    },
    {
      id: "q8",
      vraag: "Iets dat je gemaakt hebt, is af. Wat voelt het best?",
      opties: [
        { tekst: "Het aan iemand kunnen tonen", punten: 3 },
        { tekst: "Weten dat het vanbinnen netjes zit", punten: 3 },
        { tekst: "Dat het gewoon gedaan is", punten: 1 },
        { tekst: "Ik maak niet vaak iets af", punten: 0 },
      ],
      weetje: "Afwerken is een vaardigheid op zich. In de derde graad wordt er verwacht dat je projecten tot het einde brengt, niet alleen begint.",
    },
  ],
  /* Van hoog naar laag doorlopen: de eerste waar je score boven `min` komt,
     is je uitslag. */
  uitslagen: [
    {
      min: 20,
      titel: "ICW past bij je",
      tekst: "Je wil weten hoe dingen werken, je geeft niet op als het tegenzit en verder studeren zit in je plannen. Dat is precies waar deze richting voor gemaakt is. Ga eens praten met iemand die het al doet.",
    },
    {
      min: 14,
      titel: "Zeker het bekijken waard",
      tekst: "Er zit genoeg in dat bij je past. De vraag is vooral of de hoeveelheid wiskunde en de lange projecten je liggen. Vraag of je een les mag meevolgen voor je beslist.",
    },
    {
      min: 8,
      titel: "Twijfelgeval, en dat is oké",
      tekst: "Sommige stukken passen, andere niet. Kijk zeker ook naar de andere informaticarichtingen: er bestaan varianten met minder wiskunde en meer praktijk, in de dubbele of arbeidsmarktfinaliteit.",
    },
    {
      min: 0,
      titel: "Waarschijnlijk iets anders",
      tekst: "Op basis van je antwoorden lijkt dit niet je richting — en dat is prima, er zijn er veel. Maar één quiz is geen beslissing: praat met je leerkracht of het CLB voor je iets uitsluit.",
    },
  ],
};

module.exports = { ARTIKEL, QUIZ };
