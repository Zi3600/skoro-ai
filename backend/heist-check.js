/* ------------------------------------------------------------------ *
 *  Code Heist — nakijken
 *
 *  Draait ALLEEN op de server. Een gehaalde dagelijkse heist levert echt
 *  krediet op, dus de browser mag nooit zelf zeggen dat iets geslaagd is.
 *  Bewust deterministisch: dezelfde code geeft altijd dezelfde uitslag,
 *  en het kost geen tokens.
 * ------------------------------------------------------------------ */

const { parse } = require("node-html-parser");

const MAX_HTML = 20000;
const MAX_CSS = 10000;

/* --- heel kleine CSS-lezer: genoeg voor "zet selector X eigenschap Y?" --- */
function leesCss(css) {
  const regels = [];
  // commentaar eruit, dan blok voor blok
  const schoon = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(schoon))) {
    const selectors = m[1].split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const props = {};
    for (const stuk of m[2].split(";")) {
      const dp = stuk.indexOf(":");
      if (dp === -1) continue;                        // geen dubbele punt = ongeldige regel
      const naam = stuk.slice(0, dp).trim().toLowerCase();
      const waarde = stuk.slice(dp + 1).trim();
      if (naam && waarde) props[naam] = waarde;
    }
    if (selectors.length) regels.push({ selectors, props });
  }
  return regels;
}

// heeft een selector (of een klasse-selector) deze eigenschap gezet?
function cssHeeft(regels, eis) {
  const namen = [eis.eigenschap, ...(eis.losOok || [])].map(n => n.toLowerCase());
  // ook shorthand accepteren: padding dekt padding-top enz.
  const past = (prop) => namen.some(n => prop === n || prop.startsWith(n + "-"));

  for (const regel of regels) {
    const selectorPast = eis.selectorSoort === "klasse"
      ? regel.selectors.some(s => s.includes("."))
      : eis.selectorSoort === "id"
        ? regel.selectors.some(s => s.includes("#"))
        : regel.selectors.some(s => s === String(eis.selector || "").toLowerCase());
    if (!selectorPast) continue;
    if (Object.keys(regel.props).some(past)) return true;
  }
  return false;
}

/* --------------------------- de nakijker --------------------------- */

function controleer(eisen, html, css) {
  const h = String(html || "").slice(0, MAX_HTML);
  const c = String(css || "").slice(0, MAX_CSS);

  let wortel;
  try {
    wortel = parse(h, { lowerCaseTagName: true, comment: false });
  } catch (e) {
    return { geslaagd: false, punten: 0, totaal: eisen.length, resultaten: eisen.map(e2 => ({
      omschrijving: e2.omschrijving, ok: false,
    })) };
  }

  const cssRegels = leesCss(c);

  const resultaten = eisen.map(eis => {
    let ok = false;
    try {
      switch (eis.soort) {
        case "tag": {
          let els = wortel.querySelectorAll(eis.tag);
          if (eis.nietLeeg) els = els.filter(el => el.text.trim().length > 0);
          ok = els.length >= (eis.minAantal || 1);
          break;
        }
        case "attr": {
          const els = wortel.querySelectorAll(eis.tag);
          ok = els.some(el => {
            const v = el.getAttribute(eis.attribuut);
            if (v === undefined || v === null) return false;
            if (eis.nietLeeg && !String(v).trim()) return false;
            if (eis.waarde && String(v).trim().toLowerCase() !== String(eis.waarde).toLowerCase()) return false;
            return true;
          });
          break;
        }
        case "nesting": {
          const ouders = wortel.querySelectorAll(eis.ouder);
          ok = ouders.some(o => o.querySelectorAll(eis.kind).length > 0);
          break;
        }
        case "tekst": {
          ok = wortel.text.toLowerCase().includes(String(eis.tekst).toLowerCase());
          break;
        }
        case "css": {
          ok = cssHeeft(cssRegels, eis);
          break;
        }
        case "geen": {
          ok = wortel.querySelectorAll(eis.tag).length === 0;
          break;
        }
        case "geenRuwe": {
          ok = !h.toLowerCase().includes(String(eis.patroon).toLowerCase());
          break;
        }
        default:
          ok = false;
      }
    } catch (e) { ok = false; }
    return { omschrijving: eis.omschrijving, ok };
  });

  const punten = resultaten.filter(r => r.ok).length;
  return { geslaagd: punten === eisen.length, punten, totaal: eisen.length, resultaten };
}

module.exports = { controleer, leesCss };
