# lokaal b16 op Cloudflare

Korte versie: de app is nu **klaar om achter of op Cloudflare gezet te
worden**, en `git push` blijft in elke opstelling de deploy-knop. Er is niets
verhuisd — dit bestand legt uit wat er klaarstaat en wat je moet doen als je
het écht wil doen.

---

## Wat er in de code veranderd is

| Wat | Waar | Waarom |
| --- | --- | --- |
| `app.set("trust proxy", true)` | `backend/server.js` | Achter een proxy komt elk verzoek anders binnen. Zonder dit is `req.ip` altijd `127.0.0.1` en klopt het protocol niet. Cloudflare zet het echte adres in `CF-Connecting-IP`. |
| `frontend/config.js` | nieuw | De enige plek waar staat waar de backend draait. Frontend en backend mogen nu op verschillende domeinen staan. |
| `/health` | `backend/server.js` | Een check zonder database, voor uptime-monitoring of een Cloudflare health check. |
| `frontend/_headers` | nieuw | Cachebeleid voor Cloudflare Pages: HTML/JS/CSS niet cachen, iconen wel. |
| `frontend/_redirects` | nieuw | Twee oude paden (`/dev`, `/manage`) blijven werken. |
| service worker | `frontend/sw.js` | Laat nu alles wat niet van dezelfde origin komt met rust, zodat API-verkeer nooit uit de cache komt. |

Niets hiervan verandert iets aan de huidige opstelling op Render. Alles blijft
draaien zoals het draaide.

---

## Opstelling A — Cloudflare vóór Render (de makkelijke)

Je zet je domein bij Cloudflare, laat het verkeer door hun proxy lopen, en
Render blijft alles serveren zoals nu.

**Wat je krijgt:** caching, een gratis certificaat, DDoS-bescherming, en je
eigen domeinnaam in plaats van `…onrender.com`.

**Wat je doet:**
1. Domein toevoegen in Cloudflare, nameservers overzetten.
2. Een `CNAME` naar je Render-URL, met de oranje wolk **aan** (proxied).
3. In Render je domein als custom domain toevoegen.
4. SSL/TLS-modus op **Full (strict)**. Op "Flexible" krijg je een
   redirect-lus, want Render dwingt zelf al https af.
5. WebSockets staan bij Cloudflare standaard aan — controleer het toch even,
   want zonder WebSockets werkt het lokaal niet meer (Socket.IO valt dan
   terug op polling, trager maar het werkt).

**Aan de code hoef je niets te veranderen.** `config.js` mag op `backend: ""`
blijven staan: frontend en API delen nog altijd dezelfde origin.

**Pushen:** ongewijzigd. `git push origin master` → Render bouwt en deployt.
Cloudflare zit ervoor en merkt het vanzelf. Na een deploy waarbij je CSS of JS
veranderd hebt, kan je in Cloudflare **Purge Cache** doen als je de oude
versie nog ziet; de `_headers` hierboven maken dat in de meeste gevallen
overbodig.

---

## Opstelling B — Pagina's op Cloudflare Pages, API op Render

De HTML, CSS, JS en iconen komen van Cloudflare Pages. De server (Socket.IO,
MongoDB, uploads, OpenAI) blijft op Render.

**Wat je krijgt:** de pagina's laden van het Cloudflare-netwerk, dus snel, en
ze staan er ook als Render aan het opstarten is uit spin-down.

**Wat je doet:**
1. Cloudflare Pages → **Connect to Git** → repo `Zi3600/skoro-ai`, branch
   `master`.
2. Build settings:
   - Framework preset: **None**
   - Build command: **leeg laten**
   - Build output directory: **`abdel-ai/frontend`**
3. In `frontend/config.js` de backend invullen:
   ```js
   backend: "https://skoro-ai.onrender.com",
   ```
   (of je eigen API-domein). Commit en push.
4. Klaar. De frontend praat cross-origin met Render.

**Waarom dat zomaar werkt:** het inloggen gebruikt een token in de header
`x-auth-token`, geen cookies. Er is dus geen `SameSite`-gedoe en geen
`credentials: "include"` nodig. De server staat al op `cors({ origin: "*" })`,
ook voor Socket.IO.

**Pushen:** één `git push origin master` triggert nu **twee** builds — Render
voor de backend, Cloudflare Pages voor de frontend. Dat is precies wat je
wilde: je blijft pushen zoals altijd.

> Let op bij deze opstelling: zet je `backend` in `config.js` verkeerd, dan
> laadt de site wel maar lukt inloggen niet. Dat is meteen zichtbaar —
> "geen verbinding met de server" op het inlogscherm.

---

## Opstelling C — alles op Cloudflare Workers

**Dit kan niet zonder de backend te herschrijven.** Eerlijk zijn is hier
nuttiger dan optimistisch:

- **Socket.IO draait niet op Workers.** Het lokaal, het gastbord, de
  groepchats en de aanwezigheidsbolletjes hangen er volledig aan. Op
  Cloudflare zou dat Durable Objects met rauwe WebSockets worden — een andere
  architectuur, niet een andere hostingknop.
- **Mongoose en GridFS draaien niet op Workers.** Alle uploads, achtergronden
  en profielfoto's zitten in GridFS. Dat zou D1 of R2 worden, met een
  datamigratie erbij.
- **`multer` en het tijdelijke bestandspad** bestaan niet in een Worker; er is
  geen schijf.

Wil je die kant ooit op, dan is dat een apart project met een eigen planning,
geen vervolgstap van deze wijziging. Opstelling A en B geven je het grootste
deel van de winst (snelheid, eigen domein, bescherming) voor bijna geen werk.

---

## Wat blijft er hoe dan ook op Render staan?

De geheimen. `MONGODB_URI`, `OPENAI_API_KEY` en `DEV_PASSWORD` staan als
environment variables op Render en horen nergens anders. `backend/.env` in de
repo bevat alleen placeholders en is gitignored.

Zet ze **niet** in Cloudflare Pages: die build serveert alleen statische
bestanden, en alles wat je daar in een variabele stopt kan in de gebouwde
bestanden terechtkomen.
