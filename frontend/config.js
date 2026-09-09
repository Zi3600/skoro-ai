/* ------------------------------------------------------------------ *
 *  lokaal b16 — waar staat de backend?
 *
 *  Dit bestand wordt vóór app.js geladen en is het enige dat je moet
 *  aanpassen als de frontend en de backend op verschillende plekken
 *  komen te staan. Verder in de code staat nergens nog een vaste URL.
 *
 *  backend: ""                       alles staat op één server (Render nu).
 *                                    De frontend praat met zijn eigen origin.
 *
 *  backend: "https://api.jouwdomein.be"
 *                                    de frontend staat ergens anders dan de
 *                                    API — bijvoorbeeld de pagina's op
 *                                    Cloudflare Pages en de server op Render.
 *                                    Geen schuine streep op het einde.
 *
 *  Zie CLOUDFLARE.md voor de twee opstellingen die we ondersteunen.
 * ------------------------------------------------------------------ */

window.LOKAAL_B16 = {
  // leeg = zelfde server als waar deze pagina vandaan komt
  backend: "",

  // waar de app naartoe valt als je index.html rechtstreeks van je schijf
  // opent (protocol file:), want dan is er geen origin om op terug te vallen
  backendBijBestand: "https://skoro-ai.onrender.com",
};

/* Eén plek waar de keuze gemaakt wordt, zodat index.html en app.js nooit
   uit elkaar kunnen lopen. */
window.BACKEND_URL = (function () {
  const c = window.LOKAAL_B16 || {};
  if (location.protocol === "file:") return c.backendBijBestand || "";
  return (c.backend || "").replace(/\/+$/, "") || location.origin;
})();
