const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const { ARTIKEL, QUIZ } = require("./icw-content");
const { LEVELS } = require("./heist-content");
const { DAILY, SPIEK } = require("./heist-daily");
const { controleer } = require("./heist-check");

dotenv.config();

/* ------------------------------------------------------------------ *
 *  lokaal b16  —  backend
 *  het lokaal (dagelijkse tekening + typen) · groepen · Maes-AI
 *
 *  NAAMGEVING: de app heette vroeger drerries-ai en "het lokaal" heette
 *  toen "de straat". In de teksten die iemand te zien krijgt staat overal
 *  het nieuwe woord. In de CODE heet de collectie nog "straats": die
 *  hernoemen zou alle bestaande tekeningen weggooien en niets opleveren.
 *  Straat (collectie) = lokaal (scherm). De socket-events heten sinds het
 *  gastbord wél bord:* — die staan nergens opgeslagen, dus daar kost een
 *  eerlijke naam niets.
 * ------------------------------------------------------------------ */

const MAX_EURO = 0.25;        // harde limiet per student
const TRIAL_EURO = 0.15;      // "gratis krediet" op de Maes-AI pagina
const STUDENT_COUNT = 20;

// Wie in het lokaal tekent of typt mag één ding tegelijk plaatsen en moet
// daarna 30 seconden wachten. Dit staat hier op de server, niet alleen in de
// browser: anders omzeilt iemand het met de console. De beheerder valt er
// buiten, die moet kunnen ingrijpen zonder te wachten.
const LOKAAL_COOLDOWN_MS = 30000;

// de soorten accounts; "beheer" zit apart in isAdmin
const ROLLEN = ["student", "gast", "icw"];

/* Wat elke soort account mag. Dit staat hier op één plek en gaat mee naar
   de browser (via /me), zodat het scherm en de server nooit iets anders
   denken. De browser gebruikt het om knoppen te verbergen; de server
   controleert het opnieuw bij elke actie, want een verborgen knop is geen
   slot. Een beheerder mag alles, die staat niet in deze tabel. */
const RECHTEN = {
  student: { lokaalSchrijven: true,  gastbord: false, groepen: true,  doekoe: true,  maes: "vol" },
  icw:     { lokaalSchrijven: true,  gastbord: false, groepen: true,  doekoe: true,  maes: "vol" },
  // een gast kijkt mee in het lokaal maar schrijft er niet in; hij heeft een
  // eigen bord met eigen chat, en van Maes-AI krijgt hij één berichtje
  gast:    { lokaalSchrijven: false, gastbord: true,  groepen: false, doekoe: false, maes: "proef" },
};

const RECHTEN_BEHEER = { lokaalSchrijven: true, gastbord: true, groepen: true, doekoe: true, maes: "vol" };

function rechtenVan(username) {
  if (ADMINS.has(username)) return RECHTEN_BEHEER;
  return RECHTEN[ROLES[username]] || RECHTEN.student;
}

// een gast mag Maes-AI één keer proberen, meer niet
const GAST_MAES_LIMIET = 1;

const IMAGE_MAX = 5 * 1024 * 1024;    // 5 MB
const FILE_MAX = 20 * 1024 * 1024;    // 20 MB

// Een programma dat te downloaden staat is een andere orde van grootte dan een
// bijlage in een groep: MaasAI.exe is ongeveer 76 MB. Vandaar een eigen limiet,
// en alleen de beheerder mag zoiets neerzetten.
const DOWNLOAD_MAX = 200 * 1024 * 1024;  // 200 MB

// Alles wat geüpload wordt gaat in MongoDB (GridFS), niet op de schijf van de
// server. De schijf van Render wordt bij elke deploy gewist — Mongo niet.
// Atlas gratis = 512 MB, dus we houden een budget aan met marge.
const STORAGE_BUDGET = Math.round((Number(process.env.STORAGE_BUDGET_MB) || 400) * 1024 * 1024);

// alleen nog een tijdelijke map: bestanden staan hier een paar milliseconden
// tussen de upload en het wegschrijven naar Mongo
const UPLOAD_DIR = path.join(__dirname, "uploads");
const TMP_DIR = path.join(UPLOAD_DIR, "tmp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log("MongoDB connected"); bootstrap(); })
  .catch(e => console.error("MongoDB error:", e));

/* ----------------------------- schemas ---------------------------- */

const UserAuthSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  displayName: String,
  isAdmin: { type: Boolean, default: false },
  // student = de vaste 20 · gast = tijdelijke bezoeker · icw = junior ICW-student
  role: { type: String, default: "student" },
  // alleen voor gast- en icw-plekken: is de plek al aan iemand gegeven?
  claimed: { type: Boolean, default: false },
  claimedAt: { type: Number, default: null },
});

const UserDataSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  spend: { type: Number, default: 0 },
  earned: { type: Number, default: 0 },        // met Code Heist verdiend krediet
  heist: { type: Object, default: () => ({ levels: [], daily: {}, streak: 0 }) },
  chats: { type: Array, default: [] },
  pfp: { type: String, default: null },
  maesGebruikt: { type: Number, default: 0 },   // tikt alleen voor gasten
  icw: { type: Object, default: () => ({}) },   // uitslag van de ICW-quiz
});

const SessionSchema = new mongoose.Schema({
  token: { type: String, unique: true },
  username: String,
  createdAt: { type: Date, default: Date.now },
});

// één document per dag — het lokaal (de collectie heet nog straats, zie bovenaan)
const StraatSchema = new mongoose.Schema({
  date: { type: String, unique: true },   // YYYY-MM-DD (Europe/Brussels)
  items: { type: Array, default: [] },    // strokes + teksten, in tekenvolgorde
  contributors: { type: Array, default: [] },
  bgPreset: { type: String, default: "" },
  bgFileId: { type: String, default: null },
  updatedAt: { type: Number, default: () => Date.now() },
});

const GroupSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  code: String,
  owner: String,
  members: { type: Array, default: [] },
  bgPreset: { type: String, default: "" },     // naam van een vaste achtergrond
  bgFileId: { type: String, default: null },   // of een eigen afbeelding
  createdAt: { type: Number, default: () => Date.now() },
});

const GroupMessageSchema = new mongoose.Schema({
  id: String,
  groupId: String,
  username: String,
  displayName: String,
  kind: { type: String, default: "text" },   // text | image | file | ai
  text: { type: String, default: "" },
  fileId: String,
  fileName: String,
  fileSize: Number,
  mime: String,
  time: Number,
});

const FileSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  groupId: String,
  uploader: String,
  name: String,
  mime: String,
  size: Number,
  stored: String,
  storage: { type: String, default: "gridfs" },   // gridfs | disk (oud)
  time: Number,
});

const PersonaSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  pfp: { type: String, default: null },
  model: { type: String, default: "gpt-4o-mini" },
  maxTokens: { type: Number, default: 300 },
  canGenerateImages: { type: Boolean, default: true },
  greeting: { type: String, default: "" },
  systemPrompt: { type: String, default: "" },
});

const UserAuth = mongoose.model("UserAuth", UserAuthSchema);
const UserData = mongoose.model("UserData", UserDataSchema);
const Session = mongoose.model("Session", SessionSchema);
const Straat = mongoose.model("Straat", StraatSchema);
const Group = mongoose.model("Group", GroupSchema);
const GroupMessage = mongoose.model("GroupMessage", GroupMessageSchema);
const FileDoc = mongoose.model("FileDoc", FileSchema);

/* Een programma dat de klas kan downloaden. Eén document per sleutel, dus
   "maasai" is altijd de nieuwste versie: een nieuwe upload vervangt de oude en
   gooit het oude bestand uit GridFS. Zo groeit de opslag niet bij elke nieuwe
   build, en op een gratis Atlas van 512 MB is dat het verschil tussen werken
   en vollopen. Het bestand zelf staat in GridFS, net als de bijlagen. */
const DownloadSchema = new mongoose.Schema({
  sleutel: { type: String, unique: true },   // "maasai"
  titel: String,
  omschrijving: { type: String, default: "" },
  bestandsnaam: String,
  versie: { type: String, default: "" },
  mime: { type: String, default: "application/octet-stream" },
  grootte: { type: Number, default: 0 },
  stored: String,                            // het id in GridFS, als het bestand hier staat
  // Of het bestand staat ergens anders en wij sturen alleen door. Dat scheelt
  // bandbreedte: zie de uitleg bij de route hieronder.
  url: { type: String, default: "" },
  uploader: String,
  uploadedAt: { type: Number, default: () => Date.now() },
  keer: { type: Number, default: 0 },        // hoe vaak gedownload
});

const Download = mongoose.model("Download", DownloadSchema);
// publieke chat van het lokaal — iedereen zit hier samen in
const StraatChatSchema = new mongoose.Schema({
  id: String,
  username: String,
  displayName: String,
  text: String,
  time: Number,
});

// instellingen die de beheerder zelf regelt (o.a. het inlogscherm)
const SettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  loginTitle: { type: String, default: "" },
  loginText: { type: String, default: "" },
  loginImage: { type: String, default: null },
  // wat er in de lege ruimte links op het inlogscherm staat:
  // "leeg" · "tekening" (het lokaal van vandaag) · "afbeelding" (loginImage)
  loginBg: { type: String, default: "leeg" },
  // staan de gastplekken open voor wie de site vindt?
  gastOpen: { type: Boolean, default: false },
  migrationLog: { type: Array, default: [] },
  straatBgPreset: { type: String, default: "" },
  straatBgFileId: { type: String, default: null },
  updatedAt: { type: Number, default: () => Date.now() },
});

/* Een junior ICW-student vraagt een plek aan met zijn Smartschool-naam. De
   beheerder keurt goed of af in beheer; de aanvrager volgt het op de site
   met diezelfde naam en krijgt daar zijn inloggegevens. Er gaat dus geen
   mail of Smartschool-bericht heen en weer. */
const JuniorRequestSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  smartschool: String,
  smartschoolKey: String,          // kleine letters, om dubbele aanvragen te vinden
  bericht: { type: String, default: "" },
  status: { type: String, default: "open" },   // open | goedgekeurd | geweigerd
  username: { type: String, default: null },   // toegekende plek
  password: { type: String, default: null },
  reden: { type: String, default: "" },        // bij een weigering
  createdAt: { type: Number, default: () => Date.now() },
  handledAt: { type: Number, default: null },
  handledBy: { type: String, default: null },
});

const Persona = mongoose.model("Persona", PersonaSchema);
const StraatChat = mongoose.model("StraatChat", StraatChatSchema);
const Settings = mongoose.model("Settings", SettingsSchema);
const JuniorRequest = mongoose.model("JuniorRequest", JuniorRequestSchema);

/* Het gastbord: precies dezelfde vorm als het lokaal, maar een eigen
   collectie. Gasten tekenen daar wél, in het lokaal niet.

   Waarom een aparte collectie en geen veld "bord" op Straat: op `date` staat
   een unique index, en die zou dan naar (date, bord) moeten. Een bestaande
   unique index omzetten op de draaiende database is precies het soort werk
   waar tekeningen bij sneuvelen. Twee collecties kost hier niets: alle
   logica hieronder werkt op allebei via de tabel BORDEN. */
const GastBord = mongoose.model("GastBord", StraatSchema);
const GastChat = mongoose.model("GastChat", StraatChatSchema);

const STRAAT_CHAT_KEEP = 200;

/* De twee borden. Alles wat een bord kan (tekenen, typen, chatten, archief,
   achtergrond, moderatie) is hieronder één keer geschreven en kijkt hier op
   welke collectie het moet zijn. */
const BORDEN = {
  lokaal: {
    id: "lokaal",
    naam: "het lokaal",
    model: Straat,
    chat: StraatChat,
    room: "bord:lokaal",
    bgGroup: "__straat__",      // bestaande achtergronden hangen hieraan, niet hernoemen
  },
  gast: {
    id: "gast",
    naam: "het gastbord",
    model: GastBord,
    chat: GastChat,
    room: "bord:gast",
    bgGroup: "__gastbord__",
  },
};

function bordVan(id) {
  return BORDEN[String(id || "")] || null;
}

// mag deze gebruiker dit bord zien? en mag hij erop schrijven?
function bordRechten(username, bordId) {
  const r = rechtenVan(username);
  if (bordId === "lokaal") return { lezen: true, schrijven: !!r.lokaalSchrijven };
  if (bordId === "gast") return { lezen: !!r.gastbord, schrijven: !!r.gastbord };
  return { lezen: false, schrijven: false };
}

/* ------------------------------ app ------------------------------- */

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 2e6 });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const chatUpload = multer({ dest: path.join(UPLOAD_DIR, "tmp"), limits: { fileSize: IMAGE_MAX } });
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: IMAGE_MAX } });
const groupUpload = multer({
  storage: multer.diskStorage({
    destination: TMP_DIR,
    filename: (req, file, cb) => cb(null, rid(16) + path.extname(file.originalname || "")),
  }),
  limits: { fileSize: FILE_MAX },
});

/* Achter Cloudflare (of Render, of allebei) komt het verkeer via een proxy
   binnen. Zonder dit ziet Express elk verzoek als http van 127.0.0.1 en
   klopt req.ip niet meer — wat vooral vervelend is als we ooit iets per IP
   willen begrenzen. Cloudflare zet het echte adres in CF-Connecting-IP en
   vult X-Forwarded-For netjes aan. */
app.set("trust proxy", true);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/* De frontend mag ook los gehost worden (bv. Cloudflare Pages) terwijl deze
   server alleen de API doet. Dan wordt deze regel gewoon nooit geraakt:
   niemand vraagt de bestanden hier op. Zie CLOUDFLARE.md. */
app.use(express.static(path.join(__dirname, "../frontend")));

/* Kort en zonder database: hiermee kan een proxy of uptime-check zien of de
   server leeft, zonder een sessie of Mongo aan te spreken. */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1 ? "verbonden" : "niet verbonden",
    uptime: Math.round(process.uptime()),
  });
});

/* ---------------------------- helpers ----------------------------- */

const USERS = {};   // username -> password
const NAMES = {};   // username -> displayName
const ROLES = {};   // username -> "student" | "gast" | "icw"
const ADMINS = new Set();
const tokens = {};  // token -> username (ook in Mongo, zodat een herstart niemand uitlogt)

function rid(n = 10) {
  return crypto.randomBytes(32).toString("hex").slice(0, n);
}

function todayKey() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
}

function calcCostEuro(usage) {
  const inputCost = (usage.prompt_tokens / 1000000) * 0.15;
  const outputCost = (usage.completion_tokens / 1000000) * 0.60;
  return (inputCost + outputCost) * 0.92;
}

// het budget is niet langer vast: Code Heist levert er krediet bij
function budgetOf(data) {
  return MAX_EURO + (data && data.earned ? data.earned : 0);
}

function pctOf(data) {
  const d = typeof data === "number" ? { spend: data, earned: 0 } : (data || {});
  const budget = budgetOf(d);
  return Math.min(((d.spend || 0) / budget) * 100, 100);
}

async function bootstrap() {
  try {
    // isAdmin met $set, niet $setOnInsert: accounts uit de vorige versie hebben
    // dat veld nog niet, en dan zou er na een deploy geen enkele beheerder zijn
    await UserAuth.updateOne(
      { username: "dev" },
      {
        $set: { isAdmin: true },
        $setOnInsert: { password: process.env.DEV_PASSWORD || "proteine1234", displayName: "beheerder" },
      },
      { upsert: true }
    );
    // alle andere accounts krijgen expliciet isAdmin: false als het veld ontbreekt
    await UserAuth.updateMany(
      { username: { $ne: "dev" }, isAdmin: { $exists: false } },
      { $set: { isAdmin: false } }
    );
    // accounts van voor de gast- en ICW-plekken zijn gewoon studenten
    await UserAuth.updateMany({ role: { $exists: false } }, { $set: { role: "student" } });
    // 20 studenten — de beheerder vult naam en wachtwoord in via /beheer
    for (let i = 1; i <= STUDENT_COUNT; i++) {
      const u = "user" + i;
      await UserAuth.updateOne(
        { username: u },
        { $setOnInsert: { password: u, displayName: u, isAdmin: false, role: "student" } },
        { upsert: true }
      );
    }
    await syncUsers();
    const sessions = await Session.find();
    sessions.forEach(s => { tokens[s.token] = s.username; });

    initBucket();
    await migrateDiskFilesToGridFS();
    const st = await recalcStorage();
    console.log(`users: ${Object.keys(USERS).length} · sessies hersteld: ${sessions.length}`);
    console.log(`opslag in Mongo: ${st.count} bestanden, ${(st.used / 1048576).toFixed(1)} MB van ${(STORAGE_BUDGET / 1048576).toFixed(0)} MB`);
  } catch (e) {
    console.error("bootstrap error:", e.message);
  }
}

async function syncUsers() {
  const all = await UserAuth.find();
  Object.keys(USERS).forEach(k => delete USERS[k]);
  Object.keys(NAMES).forEach(k => delete NAMES[k]);
  Object.keys(ROLES).forEach(k => delete ROLES[k]);
  ADMINS.clear();
  all.forEach(u => {
    USERS[u.username] = u.password;
    NAMES[u.username] = u.displayName || u.username;
    ROLES[u.username] = ROLLEN.includes(u.role) ? u.role : "student";
    if (u.isAdmin) ADMINS.add(u.username);
  });
}

/* ---------------------- gast- en ICW-plekken ----------------------- *
 *  Een "plek" is gewoon een account met een rol. De beheerder maakt er
 *  eentje bij in beheer; een gast claimt een vrije plek zelf (als dat
 *  openstaat) en een junior ICW-student krijgt er een toegewezen zodra
 *  zijn aanvraag goedgekeurd is.
 * ------------------------------------------------------------------ */

const ROL_PREFIX = { gast: "gast", icw: "icw" };

function nieuwWachtwoord() {
  // leesbaar genoeg om door te geven, lang genoeg om niet te raden
  return crypto.randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
}

// maakt de volgende vrije plek aan, bv. gast3 of icw2
async function maakPlek(rol) {
  const prefix = ROL_PREFIX[rol];
  if (!prefix) throw new Error("onbekende soort plek");
  const bestaand = await UserAuth.find({ role: rol }, { username: 1, _id: 0 });
  const nummers = bestaand
    .map(u => parseInt((String(u.username).match(/(\d+)$/) || [])[1] || "0", 10))
    .filter(n => n > 0);
  const n = (nummers.length ? Math.max(...nummers) : 0) + 1;
  const username = prefix + n;
  const password = nieuwWachtwoord();
  const displayName = rol === "gast" ? "gast " + n : "ICW junior " + n;
  await UserAuth.create({ username, password, displayName, isAdmin: false, role: rol, claimed: false });
  await syncUsers();
  return { username, password, displayName, role: rol };
}

// eerste plek die nog van niemand is
async function vrijePlek(rol) {
  return UserAuth.findOne({ role: rol, claimed: { $ne: true } });
}

async function telPlekken(rol) {
  const totaal = await UserAuth.countDocuments({ role: rol });
  const vrij = await UserAuth.countDocuments({ role: rol, claimed: { $ne: true } });
  return { totaal, vrij };
}

async function getUserData(username) {
  let data = await UserData.findOne({ username });
  if (!data) {
    data = await UserData.create({
      username,
      spend: 0,
      chats: [
        { id: 1, title: "chat 1", messages: [] },
        { id: 2, title: "chat 2", messages: [] },
        { id: 3, title: "chat 3", messages: [] },
      ],
      pfp: null,
    });
  }
  return data;
}

/* -------------------- bestandsopslag in MongoDB -------------------- */
/* Uploads gaan naar GridFS in dezelfde database. Daardoor overleven ze
   een deploy, een herstart en het slapen van de server. Profielfoto's en
   de afbeelding van het inlogscherm stonden al in Mongo (als base64). */

let bucket = null;
let storageUsed = 0;

function initBucket() {
  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
}

async function recalcStorage() {
  try {
    const out = await mongoose.connection.db.collection("uploads.files")
      .aggregate([{ $group: { _id: null, total: { $sum: "$length" }, n: { $sum: 1 } } }]).toArray();
    storageUsed = out.length ? out[0].total : 0;
    return { used: storageUsed, count: out.length ? out[0].n : 0 };
  } catch (e) {
    return { used: storageUsed, count: 0 };
  }
}

// schrijft een tijdelijk bestand naar GridFS en geeft het id terug
function saveToGridFS(tmpPath, filename, metadata) {
  return new Promise((resolve, reject) => {
    const up = bucket.openUploadStream(filename, { metadata });
    fs.createReadStream(tmpPath)
      .on("error", reject)
      .pipe(up)
      .on("error", reject)
      .on("finish", () => resolve(up.id));
  });
}

async function deleteFromGridFS(id) {
  try { await bucket.delete(new mongoose.Types.ObjectId(String(id))); }
  catch (e) { /* al weg, geen probleem */ }
}

// verwijdert alle bestanden van een groep (bij het opheffen van de groep)
async function deleteGroupFiles(groupId) {
  const docs = await FileDoc.find({ groupId });
  for (const d of docs) {
    if (d.storage === "gridfs") await deleteFromGridFS(d.stored);
    else {
      const p = path.join(UPLOAD_DIR, d.stored || "");
      if (d.stored && fs.existsSync(p)) { try { fs.unlinkSync(p); } catch (e) {} }
    }
  }
  await FileDoc.deleteMany({ groupId });
  await recalcStorage();
}

// eenmalig: wat nog los op de schijf staat alsnog naar Mongo tillen
async function migrateDiskFilesToGridFS() {
  const oude = await FileDoc.find({ storage: { $ne: "gridfs" } });
  let verplaatst = 0, kwijt = 0;
  for (const d of oude) {
    const p = path.join(UPLOAD_DIR, d.stored || "");
    if (!d.stored || !fs.existsSync(p)) { kwijt++; continue; }
    try {
      const id = await saveToGridFS(p, d.name || d.stored, { groupId: d.groupId, uploader: d.uploader });
      d.stored = String(id);
      d.storage = "gridfs";
      await d.save();
      fs.unlinkSync(p);
      verplaatst++;
    } catch (e) {
      console.error("migratie mislukt voor", d.id, e.message);
    }
  }
  const verslag = {
    at: Date.now(),
    moved: verplaatst,
    missing: kwijt,
    checked: oude.length,
  };
  console.log(`bestandsmigratie: ${oude.length} gecontroleerd, ${verplaatst} naar Mongo verplaatst, ${kwijt} niet meer op schijf gevonden`);

  // ook opslaan, zodat de beheerder dit in beheer > opslag kan terugzien
  // zonder in de serverlogs te moeten duiken
  try {
    const s = await getSettings();
    const log = Array.isArray(s.migrationLog) ? s.migrationLog : [];
    log.push(verslag);
    s.migrationLog = log.slice(-10);
    await s.save();
  } catch (e) { /* niet erg */ }

  return verslag;
}

/* --------------------------- achtergronden ------------------------- */
/* Een achtergrond is óf een vaste keuze (bgPreset) óf een eigen afbeelding
   die net als andere uploads in GridFS staat. De achtergrond van een bord
   hoort bij niemand in het bijzonder en krijgt daarom een vaste "groep". */

// alle groep-ids die van een bord zijn en dus niet van een groepchat
const BORD_BG_GROUPS = new Set(Object.values(BORDEN).map(b => b.bgGroup));
const PRESETS = ["aqua", "lucht", "gras", "zonsondergang", "nacht", "papier"];

// slaat een geüploade achtergrond op en ruimt de vorige meteen op
async function saveBackgroundImage(file, groupId, uploader, vorigeFileId) {
  const fileId = rid(12);
  let gridId;
  try {
    gridId = await saveToGridFS(file.path, file.originalname || "achtergrond", { groupId, uploader });
  } finally {
    if (fs.existsSync(file.path)) { try { fs.unlinkSync(file.path); } catch (e) {} }
  }
  await FileDoc.create({
    id: fileId,
    groupId,
    uploader,
    name: file.originalname || "achtergrond",
    mime: file.mimetype,
    size: file.size,
    stored: String(gridId),
    storage: "gridfs",
    time: Date.now(),
  });
  storageUsed += file.size;
  if (vorigeFileId) await removeBackgroundImage(vorigeFileId);
  return fileId;
}

async function removeBackgroundImage(fileId) {
  const doc = await FileDoc.findOne({ id: fileId });
  if (!doc) return;
  if (doc.storage === "gridfs") await deleteFromGridFS(doc.stored);
  await FileDoc.deleteOne({ id: fileId });
  await recalcStorage();
}

/* Het bord van een dag ophalen, en aanmaken als het er nog niet is. Alleen
   het lokaal erft de achtergrond die de beheerder in de instellingen zette;
   het gastbord begint elke dag gewoon wit. */
async function getBord(bordId, date) {
  const bord = bordVan(bordId);
  if (!bord) throw new Error("onbekend bord");
  let doc = await bord.model.findOne({ date });
  if (!doc) {
    const s = bordId === "lokaal" ? await getSettings() : null;
    doc = await bord.model.create({
      date, items: [], contributors: [],
      bgPreset: (s && s.straatBgPreset) || "",
      bgFileId: (s && s.straatBgFileId) || null,
    });
  }
  return doc;
}

// het lokaal is het bord dat het inlogscherm en het archief bedoelen
function getStraat(date) { return getBord("lokaal", date); }

/* --------------------------- Maes-AI ------------------------------ */

function maesPrompt(name) {
  return `Je bent Maes-AI, de AI van lokaal b16. Je helpt studenten. Je antwoordt in gewoon, casual Nederlands, zoals je een klasgenoot een berichtje stuurt.

STIJL:
direct en kort, geen lange uitleg tenzij het echt nodig is
geen opsommingstekens, geen lijsten, gewoon praten
geen "hoe kan ik je helpen", geen assistent-energie
als je iets uitlegt, doe het simpel en to the point
kleine letters en weinig leestekens is ok

TAAL:
gewoon Nederlands, natuurlijk en los
geen zware slang, geen afkortingen, geen ge/gij constructies

VERBODEN:
geen disclaimers of "als AI kan ik..."
geen vloekwoorden
niet over-uitleggen

REGELS:
1. blijf respectvol, niemand afmaken
2. begin een nieuw gesprek met: "hey ${name}"
3. geen streepjes of opsommingstekens
4. altijd kort tenzij de vraag om uitleg vraagt`;
}

function maesStudiePrompt(name) {
  return `Je bent Maes-AI in studiemodus, voor ${name}.

KERNREGEL: drop formules en berekeningen onmiddellijk. geen inleiding, geen uitleg over de uitleg, direct de essentie.

AANPAK:
begin met "hey ${name}" en dan meteen de kern
formules schrijf je direct, gebruik / voor breuken, ^ voor machten, sqrt() voor wortels
lange redenering is ok maar houd de taal kort en strak
als er een berekening nodig is, doe ze volledig en direct
nooit hallucineren, als je iets niet weet zeg je dat

VERBODEN:
geen disclaimers
geen uitgebreide intro
geen herhaling van de vraag`;
}

function maesGroepPrompt(groupName) {
  return `Je bent Maes-AI, opgeroepen met /Maes in de groepchat "${groupName}" van lokaal b16.

Je praat mee in een groepchat met studenten. Antwoord kort, casual Nederlands, direct op de vraag. Je ziet de laatste berichten van de groep als context.

REGELS:
geen disclaimers, geen assistent-energie
kort en to the point, meestal een paar zinnen
geen opsommingstekens tenzij het echt helpt
blijf respectvol tegen iedereen in de groep
je hoeft je niet voor te stellen, iedereen weet wie je bent`;
}

const MODE_MODELS = { regular: "gpt-4o-mini", smart: "gpt-4o", studie: "gpt-4o" };
const MODE_MAX_TOKENS = { regular: 300, smart: 600, studie: 800 };

// gedeelde call voor zowel de Maes-AI pagina als /Maes in een groepchat
async function askMaes({ username, messages, model = "gpt-4o-mini", maxTokens = 300 }) {
  const data = await getUserData(username);
  if (data.spend >= budgetOf(data)) {
    return { limited: true, reply: "je krediet is op. vraag de beheerder om een reset.", pct: 100 };
  }
  const completion = await openai.chat.completions.create({ model, messages, max_tokens: maxTokens });
  const reply = completion.choices[0].message.content;
  data.spend += calcCostEuro(completion.usage);
  await data.save();
  return { reply, pct: pctOf(data), spend: data.spend };
}

/* ---------------------------- auth mw ----------------------------- */

function requireAuth(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "niet ingelogd" });
  req.username = tokens[token];
  req.authToken = token;
  next();
}

/* Poortjes per recht. De browser verbergt knoppen die je niet mag, maar
   dát is geen beveiliging — dit hier is het. */
function requireRecht(naam, boodschap) {
  return (req, res, next) => {
    if (!rechtenVan(req.username)[naam]) return res.status(403).json({ error: boodschap });
    next();
  };
}

const magGroepen = requireRecht("groepen", "groepen zijn voor de klas; als gast heb je het gastbord");
const magDoekoe = requireRecht("doekoe", "de doekoeverzamelaar is voor de studenten van de klas");

function requireAdmin(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "niet ingelogd" });
  if (!ADMINS.has(tokens[token])) return res.status(403).json({ error: "alleen voor de beheerder" });
  req.username = tokens[token];
  next();
}

/* ------------------------------ auth ------------------------------ */

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const u = (username || "").trim();
    const devBypass = process.env.DEV_PASSWORD && password === process.env.DEV_PASSWORD && USERS[u];
    if (!devBypass && (!USERS[u] || USERS[u] !== password)) return res.json({ success: false });

    const token = crypto.randomBytes(24).toString("hex");
    tokens[token] = u;
    await Session.create({ token, username: u }).catch(() => {});

    const data = await getUserData(u);
    res.json({
      success: true,
      token,
      username: u,
      displayName: NAMES[u] || u,
      role: ROLES[u] || "student",
      pfp: data.pfp,
      isAdmin: ADMINS.has(u),
      pct: pctOf(data),
    });
  } catch (e) {
    console.error("login error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ------------------- gastplekken en ICW-aanvragen ------------------ */

app.get("/public/spots", async (req, res) => {
  try {
    const s = await getSettings();
    const gast = await telPlekken("gast");
    const icw = await telPlekken("icw");
    res.json({
      gastOpen: !!s.gastOpen,
      gastVrij: gast.vrij, gastTotaal: gast.totaal,
      icwVrij: icw.vrij, icwTotaal: icw.totaal,
    });
  } catch (e) {
    res.json({ gastOpen: false, gastVrij: 0, gastTotaal: 0, icwVrij: 0, icwTotaal: 0 });
  }
});

// een gast neemt zelf een vrije plek, mits de beheerder dat heeft opengezet
app.post("/public/guest-login", async (req, res) => {
  try {
    const s = await getSettings();
    if (!s.gastOpen) return res.status(403).json({ error: "de gastplekken staan dicht" });

    const naam = String(req.body.displayName || "").trim().slice(0, 24);
    if (naam.length < 2) return res.status(400).json({ error: "vul een naam in waaraan iedereen je herkent" });

    const plek = await vrijePlek("gast");
    if (!plek) return res.status(409).json({ error: "alle gastplekken zijn bezet. probeer het later opnieuw." });

    plek.displayName = naam;
    plek.claimed = true;
    plek.claimedAt = Date.now();
    await plek.save();
    await syncUsers();

    const token = crypto.randomBytes(24).toString("hex");
    tokens[token] = plek.username;
    await Session.create({ token, username: plek.username }).catch(() => {});

    const data = await getUserData(plek.username);
    res.json({
      success: true, token,
      username: plek.username, displayName: naam, role: "gast",
      pfp: data.pfp, isAdmin: false, pct: pctOf(data),
    });
  } catch (e) {
    console.error("gast-login:", e.message);
    res.status(500).json({ error: e.message });
  }
});

function ssKey(naam) {
  return String(naam || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// een junior ICW-student vraagt een plek aan met zijn Smartschool-naam
app.post("/public/junior-request", async (req, res) => {
  try {
    const smartschool = String(req.body.smartschool || "").trim().slice(0, 60);
    if (smartschool.length < 3) return res.status(400).json({ error: "vul je Smartschool-naam in" });

    const key = ssKey(smartschool);
    const bestaand = await JuniorRequest.findOne({ smartschoolKey: key }).sort({ createdAt: -1 });
    if (bestaand && bestaand.status !== "geweigerd") {
      return res.json({ success: true, alGevraagd: true, status: bestaand.status, id: bestaand.id });
    }

    const r = await JuniorRequest.create({
      id: rid(10),
      smartschool,
      smartschoolKey: key,
      bericht: String(req.body.bericht || "").trim().slice(0, 240),
      status: "open",
    });
    res.json({ success: true, id: r.id, status: "open" });
  } catch (e) {
    console.error("junior-aanvraag:", e.message);
    res.status(500).json({ error: e.message });
  }
});

/* De gegevens die we teruggeven halen we uit het account zelf, niet uit de
   aanvraag. Verandert de beheerder daarna het wachtwoord van die plek, dan
   ziet de aanvrager meteen het juiste — anders staat hij met een wachtwoord
   dat niet meer werkt voor een deur die wel voor hem openstaat. */
async function plekVanAanvraag(r) {
  if (r.status !== "goedgekeurd" || !r.username) return null;
  const u = await UserAuth.findOne({ username: r.username });
  if (!u) return null;
  return { username: u.username, password: u.password };
}

// de aanvrager volgt zijn aanvraag op met dezelfde Smartschool-naam
app.get("/public/junior-request", async (req, res) => {
  const key = ssKey(req.query.naam);
  if (!key) return res.status(400).json({ error: "vul je Smartschool-naam in" });
  const r = await JuniorRequest.findOne({ smartschoolKey: key }).sort({ createdAt: -1 });
  if (!r) return res.status(404).json({ error: "we vinden geen aanvraag met die naam" });

  const plek = await plekVanAanvraag(r);
  if (r.status === "goedgekeurd" && !plek) {
    return res.json({
      status: "ingetrokken", smartschool: r.smartschool, createdAt: r.createdAt,
      reden: "je plek bestaat niet meer. vraag de beheerder wat er gebeurd is.",
      username: null, password: null,
    });
  }
  res.json({
    status: r.status,
    smartschool: r.smartschool,
    reden: r.reden || "",
    createdAt: r.createdAt,
    // de gegevens komen er pas bij zodra de beheerder goedkeurt
    username: plek ? plek.username : null,
    password: plek ? plek.password : null,
  });
});

app.post("/logout", requireAuth, async (req, res) => {
  delete tokens[req.authToken];
  await Session.deleteOne({ token: req.authToken }).catch(() => {});
  res.json({ success: true });
});

app.get("/me", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  res.json({
    username: req.username,
    displayName: NAMES[req.username] || req.username,
    role: ROLES[req.username] || "student",
    rechten: rechtenVan(req.username),
    pfp: data.pfp,
    isAdmin: ADMINS.has(req.username),
    spend: data.spend,
    pct: pctOf(data),
    maxEuro: MAX_EURO, budget: budgetOf(data), earned: data.earned || 0,
    trialEuro: TRIAL_EURO,
    cooldownMs: ADMINS.has(req.username) ? 0 : LOKAAL_COOLDOWN_MS,
    maesOver: maesOver(req.username, data),
    limits: { image: IMAGE_MAX, file: FILE_MAX },
  });
});

// hoeveel berichten een gast nog van Maes-AI mag; null = onbeperkt
function maesOver(username, data) {
  if (rechtenVan(username).maes !== "proef") return null;
  return Math.max(0, GAST_MAES_LIMIET - (data.maesGebruikt || 0));
}

app.post("/me/pfp", requireAuth, memUpload.single("pfp"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "geen foto" });
  const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const data = await getUserData(req.username);
  data.pfp = base64;
  await data.save();
  res.json({ success: true, pfp: base64 });
});

/* ------------------------------ borden ---------------------------- *
 *  Er zijn twee borden met precies dezelfde mogelijkheden:
 *
 *    lokaal  — het bord van de klas. Iedereen ziet het; gasten kijken
 *              alleen mee en schrijven er niet in.
 *    gast    — het bord van de gasten, met een eigen chat. Gasten en de
 *              beheerder komen erop, de klas niet.
 *
 *  Alles hieronder werkt op allebei. Welk bord het is staat in de URL
 *  (/bord/lokaal/... of /bord/gast/...) en wordt door bordToegang
 *  gecontroleerd — niet door de browser.
 * ------------------------------------------------------------------ */

// haalt het bord uit de URL en kijkt of deze gebruiker erop mag
function bordToegang(schrijven) {
  return (req, res, next) => {
    const bord = bordVan(req.params.bord);
    if (!bord) return res.status(404).json({ error: "dat bord bestaat niet" });
    const mag = bordRechten(req.username, bord.id);
    if (!mag.lezen) return res.status(403).json({ error: "dit bord is niet voor jou" });
    if (schrijven && !mag.schrijven) {
      return res.status(403).json({
        error: bord.id === "lokaal"
          ? "als gast kan je het lokaal bekijken, niet erin schrijven"
          : "je mag hier niet schrijven",
      });
    }
    req.bord = bord;
    next();
  };
}

// het bord van vandaag
app.get("/bord/:bord", requireAuth, bordToegang(false), async (req, res) => {
  const date = todayKey();
  const doc = await getBord(req.bord.id, date);
  const mag = bordRechten(req.username, req.bord.id);
  res.json({
    bord: req.bord.id, date, items: doc.items, contributors: doc.contributors,
    bgPreset: doc.bgPreset, bgFileId: doc.bgFileId, schrijven: mag.schrijven,
  });
});

// archief — elke dag, nieuwste eerst
app.get("/bord/:bord/archive", requireAuth, bordToegang(false), async (req, res) => {
  const today = todayKey();
  const docs = await req.bord.model
    .find({}, { date: 1, items: 1, contributors: 1, _id: 0 }).sort({ date: -1 }).limit(120);
  res.json({
    days: docs.map(d => ({
      date: d.date,
      isToday: d.date === today,
      strokes: d.items.filter(i => i.t === "s").length,
      texts: d.items.filter(i => i.t === "x").length,
      contributors: d.contributors,
    })),
  });
});

// de publieke chat die bij dit bord hoort
app.get("/bord/:bord/chat", requireAuth, bordToegang(false), async (req, res) => {
  const messages = await req.bord.chat.find().sort({ time: -1 }).limit(STRAAT_CHAT_KEEP);
  res.json({ messages: messages.reverse() });
});

// één dag uit het archief, alleen-lezen
app.get("/bord/:bord/dag/:date", requireAuth, bordToegang(false), async (req, res) => {
  const doc = await req.bord.model.findOne({ date: req.params.date });
  if (!doc) return res.status(404).json({ error: "die dag bestaat niet" });
  res.json({
    date: doc.date, items: doc.items, contributors: doc.contributors,
    readonly: doc.date !== todayKey(), bgPreset: doc.bgPreset, bgFileId: doc.bgFileId,
  });
});

// achtergrond van een bord — alleen de beheerder
app.post("/bord/:bord/background", requireAdmin, bordToegang(false), (req, res) => {
  groupUpload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "afbeelding is te groot (max 5 MB)" : err.message });
    }
    try {
      const date = todayKey();
      const doc = await getBord(req.bord.id, date);
      const vorige = doc.bgFileId;
      // alleen het lokaal onthoudt zijn achtergrond voor de volgende dagen
      const instellingen = req.bord.id === "lokaal" ? await getSettings() : null;

      if (req.file) {
        if ((req.file.mimetype || "").startsWith("image/") && req.file.size > IMAGE_MAX) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "afbeelding is te groot (max 5 MB)" });
        }
        const fileId = await saveBackgroundImage(req.file, req.bord.bgGroup, req.username, vorige);
        doc.bgFileId = fileId; doc.bgPreset = "";
        if (instellingen) { instellingen.straatBgFileId = fileId; instellingen.straatBgPreset = ""; }
      } else if (req.body.clear) {
        if (vorige) await removeBackgroundImage(vorige);
        doc.bgFileId = null; doc.bgPreset = "";
        if (instellingen) { instellingen.straatBgFileId = null; instellingen.straatBgPreset = ""; }
      } else {
        const preset = String(req.body.preset || "");
        if (!PRESETS.includes(preset)) return res.status(400).json({ error: "onbekende achtergrond" });
        if (vorige) await removeBackgroundImage(vorige);
        doc.bgPreset = preset; doc.bgFileId = null;
        if (instellingen) { instellingen.straatBgPreset = preset; instellingen.straatBgFileId = null; }
      }

      await doc.save();
      if (instellingen) await instellingen.save();
      const payload = { bord: req.bord.id, bgPreset: doc.bgPreset, bgFileId: doc.bgFileId };
      io.to(req.bord.room).emit("bord:background", payload);
      res.json(Object.assign({ success: true }, payload));
    } catch (e) {
      console.error("achtergrond van bord:", e.message);
      res.status(500).json({ error: e.message });
    }
  });
});

// beheerder mag het bord van vandaag leegmaken
app.post("/bord/:bord/clear", requireAdmin, bordToegang(false), async (req, res) => {
  const date = todayKey();
  await req.bord.model.updateOne(
    { date },
    { $set: { items: [], contributors: [], updatedAt: Date.now() } },
    { upsert: true }
  );
  io.to(req.bord.room).emit("bord:cleared", { bord: req.bord.id });
  res.json({ success: true });
});

/* ---------------------- moderatie van een bord --------------------- *
 *  De beheerder ziet wie wat getekend of getypt heeft en kan één ding
 *  weghalen zonder het hele bord leeg te gooien. Dat is het verschil
 *  tussen bijsturen en alles kwijt zijn.
 * ------------------------------------------------------------------ */

// wie heeft wat gezet — alleen voor de beheerder
app.get("/bord/:bord/wie", requireAdmin, bordToegang(false), async (req, res) => {
  const doc = await getBord(req.bord.id, todayKey());
  const perPersoon = {};
  for (const i of doc.items || []) {
    const u = i.u || "onbekend";
    if (!perPersoon[u]) perPersoon[u] = { username: u, displayName: i.n || u, lijnen: 0, teksten: 0, laatste: 0 };
    if (i.t === "s") perPersoon[u].lijnen++; else perPersoon[u].teksten++;
    perPersoon[u].laatste = Math.max(perPersoon[u].laatste, i.ts || 0);
  }
  res.json({
    date: doc.date,
    items: (doc.items || []).map(i => ({
      id: i.id, t: i.t, u: i.u, n: i.n, ts: i.ts,
      tekst: i.t === "x" ? i.text : null,
    })),
    personen: Object.values(perPersoon).sort((a, b) => b.laatste - a.laatste),
  });
});

// één lijn of tekst weghalen
app.delete("/bord/:bord/item/:id", requireAdmin, bordToegang(false), async (req, res) => {
  const doc = await getBord(req.bord.id, todayKey());
  const item = (doc.items || []).find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: "dat staat er niet (meer) op" });

  doc.items = doc.items.filter(i => i.id !== req.params.id);
  // iemand die niets meer op het bord heeft staan, hoort ook niet meer
  // onder "vandaag getekend door"
  const namenOver = new Set(doc.items.map(i => i.n).filter(Boolean));
  doc.contributors = (doc.contributors || []).filter(n => namenOver.has(n));
  doc.updatedAt = Date.now();
  doc.markModified("items");
  await doc.save();

  io.to(req.bord.room).emit("bord:item-weg", { bord: req.bord.id, id: req.params.id });
  res.json({ success: true, door: item.n || item.u || "onbekend" });
});

// een bericht uit de chat van dit bord halen
app.delete("/bord/:bord/chat/:id", requireAdmin, bordToegang(false), async (req, res) => {
  const msg = await req.bord.chat.findOne({ id: req.params.id });
  if (!msg) return res.status(404).json({ error: "dat bericht bestaat niet meer" });
  await req.bord.chat.deleteOne({ id: req.params.id });
  io.to(req.bord.room).emit("bord:chat-weg", { bord: req.bord.id, id: req.params.id });
  res.json({ success: true, door: msg.displayName });
});

// de hele chat van dit bord leegmaken
app.post("/bord/:bord/chat/clear", requireAdmin, bordToegang(false), async (req, res) => {
  await req.bord.chat.deleteMany({});
  io.to(req.bord.room).emit("bord:chat-leeg", { bord: req.bord.id });
  res.json({ success: true });
});

/* -------------------- inlogscherm + eigen iconen ------------------- */

async function getSettings() {
  let s = await Settings.findOne({ key: "app" });
  if (!s) s = await Settings.create({ key: "app" });
  return s;
}

const LOGIN_BG = ["leeg", "tekening", "afbeelding"];

/* publiek: het inlogscherm moet dit kunnen ophalen vóór je ingelogd bent.

   Staat de achtergrond op "tekening", dan gaat het lokaal van vandaag mee
   naar buiten. Dat is een bewuste keuze van de beheerder, dus we sturen wél
   de lijnen en teksten maar NOOIT de namen die eraan hangen: wie niet
   ingelogd is hoeft niet te weten wie wat getekend heeft. */
app.get("/public/login-screen", async (req, res) => {
  try {
    const s = await getSettings();
    const bg = LOGIN_BG.includes(s.loginBg) ? s.loginBg : "leeg";
    const out = {
      title: s.loginTitle || "",
      text: s.loginText || "",
      image: bg === "afbeelding" ? (s.loginImage || null) : null,
      heeftAfbeelding: !!s.loginImage,
      bg,
    };
    if (bg === "tekening") {
      const doc = await getStraat(todayKey());
      out.tekening = {
        date: doc.date,
        items: (doc.items || []).map(i => {
          const { u, n, id, ts, ...rest } = i;   // namen blijven binnen
          return rest;
        }),
        bgPreset: doc.bgPreset || "",
        heeftEigenAchtergrond: !!doc.bgFileId,
      };
    }
    res.json(out);
  } catch (e) {
    res.json({ title: "", text: "", image: null, bg: "leeg" });
  }
});

// de eigen achtergrondafbeelding van het lokaal, alleen als de beheerder de
// tekening op het inlogscherm heeft gezet
app.get("/public/lokaal-bg", async (req, res) => {
  try {
    const s = await getSettings();
    if (s.loginBg !== "tekening") return res.status(404).send("niet beschikbaar");
    const doc = await getStraat(todayKey());
    if (!doc.bgFileId) return res.status(404).send("geen achtergrond");
    const f = await FileDoc.findOne({ id: doc.bgFileId });
    if (!f || f.storage !== "gridfs" || !bucket) return res.status(404).send("geen achtergrond");
    res.setHeader("Content-Type", f.mime || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=300");
    bucket.openDownloadStream(new mongoose.Types.ObjectId(String(f.stored)))
      .on("error", () => { if (!res.headersSent) res.status(410).send("weg"); })
      .pipe(res);
  } catch (e) {
    res.status(500).send("er ging iets mis");
  }
});

app.post("/admin/login-screen", requireAdmin, async (req, res) => {
  const s = await getSettings();
  if (typeof req.body.title === "string") s.loginTitle = req.body.title.slice(0, 80);
  if (typeof req.body.text === "string") s.loginText = req.body.text.slice(0, 400);
  if (typeof req.body.bg === "string") {
    if (!LOGIN_BG.includes(req.body.bg)) return res.status(400).json({ error: "onbekende achtergrond" });
    s.loginBg = req.body.bg;
  }
  if (req.body.clearImage) {
    s.loginImage = null;
    if (s.loginBg === "afbeelding") s.loginBg = "leeg";
  }
  s.updatedAt = Date.now();
  await s.save();
  res.json({ success: true, title: s.loginTitle, text: s.loginText, image: s.loginImage, bg: s.loginBg });
});

app.post("/admin/login-screen/image", requireAdmin, memUpload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "geen afbeelding" });
  const s = await getSettings();
  s.loginImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  // wie een afbeelding kiest, wil ze ook zien
  s.loginBg = "afbeelding";
  s.updatedAt = Date.now();
  await s.save();
  res.json({ success: true, image: s.loginImage, bg: s.loginBg });
});

// eigen iconen: alles wat in frontend/icons staat vervangt de emoji met dezelfde naam
const ICON_EXT = [".png", ".svg", ".webp", ".jpg", ".jpeg", ".gif", ".avif"];
app.get("/api/icons", (req, res) => {
  const dir = path.join(__dirname, "../frontend/icons");
  const map = {};
  try {
    for (const f of fs.readdirSync(dir)) {
      const ext = path.extname(f).toLowerCase();
      if (!ICON_EXT.includes(ext)) continue;
      map[path.basename(f, ext).toLowerCase()] = "icons/" + f;
    }
  } catch (e) { /* map blijft leeg, dan gebruiken we de emoji's */ }
  res.json({ icons: map });
});

/* ----------------------------- groepen ---------------------------- */

app.get("/groups", requireAuth, magGroepen, async (req, res) => {
  const list = await Group.find({ members: req.username });
  const out = await Promise.all(list.map(async g => {
    const last = await GroupMessage.findOne({ groupId: g.id }).sort({ time: -1 });
    return {
      id: g.id, name: g.name, code: g.code, owner: g.owner,
      members: g.members, memberCount: g.members.length,
      lastText: last ? (last.kind === "image" ? "foto" : last.kind === "file" ? last.fileName : last.text) : "",
      lastFrom: last ? last.displayName : "",
      lastTime: last ? last.time : g.createdAt,
    };
  }));
  out.sort((a, b) => b.lastTime - a.lastTime);
  res.json({ groups: out });
});

app.post("/groups", requireAuth, magGroepen, async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "geef je groep een naam" });
  if (name.length > 40) return res.status(400).json({ error: "naam is te lang" });
  const g = await Group.create({
    id: rid(8),
    name,
    code: crypto.randomBytes(3).toString("hex").toUpperCase(),
    owner: req.username,
    members: [req.username],
  });
  res.json({ success: true, group: { id: g.id, name: g.name, code: g.code, owner: g.owner, members: g.members } });
});

app.post("/groups/join", requireAuth, magGroepen, async (req, res) => {
  const code = (req.body.code || "").trim().toUpperCase();
  const g = await Group.findOne({ code });
  if (!g) return res.status(404).json({ error: "geen groep met die code" });
  if (!g.members.includes(req.username)) {
    g.members.push(req.username);
    await g.save();
    io.to("group:" + g.id).emit("group:members", { groupId: g.id, members: g.members });
  }
  res.json({ success: true, group: { id: g.id, name: g.name, code: g.code, owner: g.owner, members: g.members } });
});

app.get("/groups/:id", requireAuth, magGroepen, async (req, res) => {
  const g = await Group.findOne({ id: req.params.id });
  if (!g) return res.status(404).json({ error: "groep niet gevonden" });
  if (!g.members.includes(req.username)) return res.status(403).json({ error: "je zit niet in deze groep" });
  res.json({
    group: {
      id: g.id, name: g.name, code: g.code, owner: g.owner,
      bgPreset: g.bgPreset, bgFileId: g.bgFileId,
      members: g.members.map(m => ({ username: m, displayName: NAMES[m] || m })),
    },
  });
});

app.get("/groups/:id/messages", requireAuth, magGroepen, async (req, res) => {
  const g = await Group.findOne({ id: req.params.id });
  if (!g || !g.members.includes(req.username)) return res.status(403).json({ error: "geen toegang" });
  const msgs = await GroupMessage.find({ groupId: g.id }).sort({ time: 1 }).limit(200);
  res.json({ messages: msgs });
});

app.post("/groups/:id/leave", requireAuth, magGroepen, async (req, res) => {
  const g = await Group.findOne({ id: req.params.id });
  if (!g) return res.status(404).json({ error: "groep niet gevonden" });
  g.members = g.members.filter(m => m !== req.username);
  if (!g.members.length) {
    await GroupMessage.deleteMany({ groupId: g.id });
    await deleteGroupFiles(g.id);
    await g.deleteOne();
  } else {
    if (g.owner === req.username) g.owner = g.members[0];
    await g.save();
    io.to("group:" + g.id).emit("group:members", { groupId: g.id, members: g.members });
  }
  res.json({ success: true });
});

// upload — afbeeldingen max 5 MB, andere bestanden max 20 MB
app.post("/groups/:id/upload", requireAuth, magGroepen, (req, res) => {
  groupUpload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "bestand is te groot (max 20 MB)" : err.message });
    }
    try {
      const g = await Group.findOne({ id: req.params.id });
      if (!g || !g.members.includes(req.username)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: "geen toegang" });
      }
      if (!req.file) return res.status(400).json({ error: "geen bestand" });

      const isImage = (req.file.mimetype || "").startsWith("image/");
      if (isImage && req.file.size > IMAGE_MAX) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "afbeelding is te groot (max 5 MB)" });
      }

      if (storageUsed + req.file.size > STORAGE_BUDGET) {
        fs.unlinkSync(req.file.path);
        return res.status(507).json({
          error: `de opslag zit vol (${(storageUsed / 1048576).toFixed(0)} van ${(STORAGE_BUDGET / 1048576).toFixed(0)} MB). vraag de beheerder om ruimte vrij te maken.`,
        });
      }

      // naar GridFS in MongoDB, zodat het een deploy of herstart overleeft
      let gridId;
      try {
        gridId = await saveToGridFS(req.file.path, req.file.originalname || "bestand", {
          groupId: g.id, uploader: req.username, mime: req.file.mimetype,
        });
      } finally {
        if (fs.existsSync(req.file.path)) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
      }
      storageUsed += req.file.size;

      const fileId = rid(12);
      await FileDoc.create({
        id: fileId,
        groupId: g.id,
        uploader: req.username,
        name: req.file.originalname,
        mime: req.file.mimetype,
        size: req.file.size,
        stored: String(gridId),
        storage: "gridfs",
        time: Date.now(),
      });

      const msg = await GroupMessage.create({
        id: rid(10),
        groupId: g.id,
        username: req.username,
        displayName: NAMES[req.username] || req.username,
        kind: isImage ? "image" : "file",
        text: (req.body.caption || "").trim(),
        fileId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mime: req.file.mimetype,
        time: Date.now(),
      });

      io.to("group:" + g.id).emit("group:message", msg);
      res.json({ success: true, message: msg });
    } catch (e) {
      console.error("upload error:", e.message);
      res.status(500).json({ error: e.message });
    }
  });
});

// achtergrond van een groepchat — iedereen in de groep mag hem veranderen
app.post("/groups/:id/background", requireAuth, magGroepen, (req, res) => {
  groupUpload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "afbeelding is te groot (max 5 MB)" : err.message });
    }
    try {
      const g = await Group.findOne({ id: req.params.id });
      if (!g || !g.members.includes(req.username)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: "geen toegang" });
      }
      const vorige = g.bgFileId;

      if (req.file) {
        if (!(req.file.mimetype || "").startsWith("image/")) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "dit is geen afbeelding" });
        }
        if (req.file.size > IMAGE_MAX) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "afbeelding is te groot (max 5 MB)" });
        }
        if (storageUsed + req.file.size > STORAGE_BUDGET) {
          fs.unlinkSync(req.file.path);
          return res.status(507).json({ error: "de opslag zit vol, vraag de beheerder om ruimte vrij te maken" });
        }
        g.bgFileId = await saveBackgroundImage(req.file, g.id, req.username, vorige);
        g.bgPreset = "";
      } else if (req.body.clear) {
        if (vorige) await removeBackgroundImage(vorige);
        g.bgFileId = null; g.bgPreset = "";
      } else {
        const preset = String(req.body.preset || "");
        if (!PRESETS.includes(preset)) return res.status(400).json({ error: "onbekende achtergrond" });
        if (vorige) await removeBackgroundImage(vorige);
        g.bgPreset = preset; g.bgFileId = null;
      }

      await g.save();
      const payload = { groupId: g.id, bgPreset: g.bgPreset, bgFileId: g.bgFileId, door: NAMES[req.username] || req.username };
      io.to("group:" + g.id).emit("group:background", payload);
      res.json(Object.assign({ success: true }, payload));
    } catch (e) {
      console.error("groep achtergrond:", e.message);
      res.status(500).json({ error: e.message });
    }
  });
});

app.get("/files/:id", async (req, res) => {
  const token = req.query.t || req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).send("niet ingelogd");
  const f = await FileDoc.findOne({ id: req.params.id });
  if (!f) return res.status(404).send("bestand niet gevonden");
  // de achtergrond van een bord is voor iedereen die dat bord mag zien
  if (!BORD_BG_GROUPS.has(f.groupId)) {
    const g = await Group.findOne({ id: f.groupId });
    if (!g || !g.members.includes(tokens[token])) return res.status(403).send("geen toegang");
  }
  res.setHeader("Content-Type", f.mime || "application/octet-stream");
  const inline = (f.mime || "").startsWith("image/");
  res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(f.name)}`);
  res.setHeader("Cache-Control", "private, max-age=86400");

  if (f.storage === "gridfs") {
    if (!bucket) return res.status(503).send("opslag nog niet klaar");
    bucket.openDownloadStream(new mongoose.Types.ObjectId(String(f.stored)))
      .on("error", () => { if (!res.headersSent) res.status(410).send("bestand is weg"); })
      .pipe(res);
    return;
  }

  // oude bestanden die nog op de schijf stonden
  const full = path.join(UPLOAD_DIR, f.stored || "");
  if (!f.stored || !fs.existsSync(full)) return res.status(410).send("bestand is weg");
  fs.createReadStream(full).pipe(res);
});

/* --------------------------- downloads ---------------------------- */
/* Programma's die de klas mag ophalen, zoals MaasAI.exe. Twee dingen maken
   dit anders dan een bijlage in een groep:

   Het staat achter de login. Niet omdat het geheim is, maar omdat een .exe die
   voor iedereen op het open internet staat vroeg of laat ergens opduikt waar
   niemand hem gezet heeft. Wie ingelogd is mag hem hebben.

   Alleen de beheerder zet hem neer. Een upload vervangt de vorige versie en
   ruimt die meteen op, zodat er nooit twee builds tegelijk in de opslag
   staan. */

function opruimen(pad) {
  try { if (pad && fs.existsSync(pad)) fs.unlinkSync(pad); } catch (e) { /* niet erg */ }
}

const downloadUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    filename: (req, file, cb) =>
      cb(null, "dl-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex")),
  }),
  limits: { fileSize: DOWNLOAD_MAX },
});

function downloadPubliek(d) {
  return {
    sleutel: d.sleutel,
    titel: d.titel,
    omschrijving: d.omschrijving,
    bestandsnaam: d.bestandsnaam,
    versie: d.versie,
    grootte: d.grootte,
    uploadedAt: d.uploadedAt,
    keer: d.keer,
    // waar de bytes vandaan komen; de link zelf gaat niet mee, die krijg je
    // pas als je op downloaden klikt
    extern: !!d.url,
  };
}

// wat er klaarstaat; het scherm gebruikt dit om de knop te tonen of te verbergen
app.get("/downloads", requireAuth, async (req, res) => {
  try {
    const alles = await Download.find().sort({ titel: 1 });
    res.json({ success: true, downloads: alles.map(downloadPubliek) });
  } catch (e) {
    console.error("downloads lijst:", e.message);
    res.status(500).json({ error: e.message });
  }
});

/* Waar de bytes vandaan komen, en waarom dat uitmaakt.

   Een build van MaasAI is bijna 80 MB. Het Hobby-plan van Render geeft 5 GB
   uitgaand verkeer per maand, en wie daaroverheen gaat zonder betaalmiddel
   krijgt zijn services stilgelegd tot de eerste van de volgende maand. Niet
   alleen de download: de hele site. Zestig keer downloaden en het lokaal ligt
   plat.

   Vandaar deze constructie. Staat er een url bij, dan sturen we de browser
   daarheen en gaan de bytes buiten Render om; wij betalen alleen de paar
   honderd bytes van de omleiding. Staat er geen url, dan streamen we het
   bestand gewoon uit GridFS zoals eerst — voor iets kleins is dat prima.

   Wat de login dan nog waard is: hij bepaalt wie de link krijgt, niet wie het
   bestand kan ophalen. Wie ingelogd is kan de link doorgeven. Voor een
   programma dat je sowieso aan je klas uitdeelt is dat de juiste ruil; voor
   iets vertrouwelijks zou je de bytes door de server moeten blijven trekken. */

/* Het bestand zelf. De token mag hier ook in de query, want een download is
   een gewone navigatie van de browser en die stuurt geen x-auth-token mee.
   Zelfde afweging als bij /files/:id hierboven. */
app.get("/downloads/:sleutel/bestand", async (req, res) => {
  const token = req.query.t || req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).send("niet ingelogd");

  const d = await Download.findOne({ sleutel: req.params.sleutel });
  if (!d || (!d.stored && !d.url)) return res.status(404).send("er staat hier niets klaar");

  // staat het bestand elders, dan is de login hierboven het hele werk dat wij
  // doen: verder sturen we alleen door
  if (d.url) {
    Download.updateOne({ sleutel: d.sleutel }, { $inc: { keer: 1 } }).catch(() => {});
    return res.redirect(302, d.url);
  }

  if (!bucket) return res.status(503).send("opslag nog niet klaar");

  res.setHeader("Content-Type", d.mime || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename*=UTF-8''" + encodeURIComponent(d.bestandsnaam)
  );
  if (d.grootte) res.setHeader("Content-Length", String(d.grootte));
  // een programma van tientallen megabytes hoort niet in een browsercache
  res.setHeader("Cache-Control", "private, no-store");

  // pas tellen als het downloaden echt begint, en het mag stilletjes mislukken
  Download.updateOne({ sleutel: d.sleutel }, { $inc: { keer: 1 } }).catch(() => {});

  bucket.openDownloadStream(new mongoose.Types.ObjectId(String(d.stored)))
    .on("error", () => { if (!res.headersSent) res.status(410).send("bestand is weg"); })
    .pipe(res);
});

// neerzetten of vervangen; alleen de beheerder
app.post("/downloads/:sleutel", requireAdmin, (req, res) => {
  downloadUpload.single("file")(req, res, async err => {
    if (err) {
      const teGroot = err.code === "LIMIT_FILE_SIZE";
      return res.status(teGroot ? 413 : 400).json({
        error: teGroot
          ? "het bestand is groter dan " + (DOWNLOAD_MAX / 1048576).toFixed(0) + " MB"
          : err.message,
      });
    }
    if (!req.file) return res.status(400).json({ error: "geen bestand meegestuurd" });
    if (!bucket) {
      opruimen(req.file.path);
      return res.status(503).json({ error: "opslag nog niet klaar" });
    }

    try {
      const oud = await Download.findOne({ sleutel: req.params.sleutel });
      // de vorige versie telt niet mee: die gaat er zo uit
      const inGebruik = storageUsed - (oud ? oud.grootte : 0);
      if (inGebruik + req.file.size > STORAGE_BUDGET) {
        opruimen(req.file.path);
        return res.status(507).json({
          error: "dit past niet: " + (req.file.size / 1048576).toFixed(0) + " MB erbij op "
            + (inGebruik / 1048576).toFixed(0) + " van "
            + (STORAGE_BUDGET / 1048576).toFixed(0) + " MB.",
        });
      }

      const naam = req.body.bestandsnaam || req.file.originalname || "download";
      const id = await saveToGridFS(req.file.path, naam, {
        soort: "download",
        sleutel: req.params.sleutel,
      });
      opruimen(req.file.path);

      // pas nu de oude weg: mislukt het wegschrijven hierboven, dan staat de
      // vorige versie er nog gewoon
      if (oud && oud.stored) await deleteFromGridFS(oud.stored);

      const doc = await Download.findOneAndUpdate(
        { sleutel: req.params.sleutel },
        {
          sleutel: req.params.sleutel,
          titel: req.body.titel || (oud && oud.titel) || req.params.sleutel,
          omschrijving: req.body.omschrijving || (oud ? oud.omschrijving : ""),
          bestandsnaam: naam,
          versie: req.body.versie || "",
          mime: req.file.mimetype || "application/octet-stream",
          grootte: req.file.size,
          stored: String(id),
          // stond er een link, dan is die nu niet meer waar: het bestand staat
          // hier. Laten staan zou betekenen dat de omleiding wint en deze
          // upload nooit iemand bereikt.
          url: "",
          uploader: req.username,
          uploadedAt: Date.now(),
          keer: 0,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await recalcStorage();
      console.log('download "' + doc.sleutel + '" bijgewerkt door ' + req.username + ": "
        + doc.bestandsnaam + ", " + (doc.grootte / 1048576).toFixed(1) + " MB");
      res.json({ success: true, download: downloadPubliek(doc) });
    } catch (e) {
      opruimen(req.file.path);
      console.error("download upload:", e.message);
      res.status(500).json({ error: e.message });
    }
  });
});


/* Een link neerzetten in plaats van een bestand. Alleen de beheerder.

   De grootte halen we zelf op met een HEAD, zodat het scherm "76 MB" kan tonen
   zonder dat iemand dat met de hand moet intikken en zonder dat wij het bestand
   binnentrekken. Lukt dat niet, dan mag het: dan staat er gewoon geen grootte
   bij. Een link weigeren omdat een HEAD faalt zou erger zijn dan het gemis. */
app.post("/downloads/:sleutel/link", requireAdmin, async (req, res) => {
  const url = String(req.body.url || "").trim();
  if (!/^https:\/\//i.test(url)) {
    return res.status(400).json({ error: "de link moet met https:// beginnen" });
  }

  try {
    let grootte = 0;
    try {
      const head = await fetch(url, { method: "HEAD", redirect: "follow" });
      if (!head.ok) return res.status(400).json({ error: "die link geeft " + head.status });
      grootte = Number(head.headers.get("content-length")) || 0;
    } catch (e) {
      return res.status(400).json({ error: "die link is niet bereikbaar: " + e.message });
    }

    const oud = await Download.findOne({ sleutel: req.params.sleutel });
    // stond het bestand hier nog, dan mag het weg: het komt nu van elders en
    // anders blijft het onze opslag bezet houden
    if (oud && oud.stored) await deleteFromGridFS(oud.stored);

    const doc = await Download.findOneAndUpdate(
      { sleutel: req.params.sleutel },
      {
        sleutel: req.params.sleutel,
        titel: req.body.titel || (oud && oud.titel) || req.params.sleutel,
        omschrijving: req.body.omschrijving || (oud ? oud.omschrijving : ""),
        bestandsnaam: req.body.bestandsnaam || url.split("/").pop() || "download",
        versie: req.body.versie || "",
        mime: "application/octet-stream",
        grootte,
        stored: "",
        url,
        uploader: req.username,
        uploadedAt: Date.now(),
        keer: 0,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await recalcStorage();
    console.log('download "' + doc.sleutel + '" wijst nu naar ' + url
      + " (" + (grootte / 1048576).toFixed(1) + " MB), gezet door " + req.username);
    res.json({ success: true, download: downloadPubliek(doc) });
  } catch (e) {
    console.error("download link:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.delete("/downloads/:sleutel", requireAdmin, async (req, res) => {
  try {
    const d = await Download.findOne({ sleutel: req.params.sleutel });
    if (!d) return res.status(404).json({ error: "bestaat niet" });
    if (d.stored) await deleteFromGridFS(d.stored);
    await Download.deleteOne({ sleutel: req.params.sleutel });
    await recalcStorage();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---------------------------- Maes-AI ----------------------------- */

app.get("/maes/info", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  res.json({
    trialEuro: TRIAL_EURO,
    maxEuro: MAX_EURO, budget: budgetOf(data), earned: data.earned || 0,
    spend: data.spend,
    pct: pctOf(data),
    notice: `geniet nu van gratis ${Math.round(TRIAL_EURO * 100)} cent krediet van Maes AI om het uit te testen. Je kan Maes-AI ook via /Maes oproepen in je groepchat.`,
  });
});

app.get("/slots", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  res.json({ slots: data.chats.map(s => ({ id: s.id, title: s.title, empty: s.messages.length === 0 })) });
});

app.get("/slots/:id", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  const slot = data.chats.find(s => s.id === parseInt(req.params.id));
  if (!slot) return res.status(404).json({ error: "chat niet gevonden" });
  res.json({ messages: slot.messages });
});

app.post("/slots/:id/clear", requireAuth, async (req, res) => {
  const slotId = parseInt(req.params.id);
  const data = await getUserData(req.username);
  const slot = data.chats.find(s => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "chat niet gevonden" });
  slot.messages = [];
  slot.title = `chat ${slotId}`;
  data.markModified("chats");
  await data.save();
  res.json({ success: true });
});

app.post("/chat", requireAuth, chatUpload.single("image"), async (req, res) => {
  try {
    const { message, slotId, mode = "regular", personaId } = req.body;
    const username = req.username;
    const name = NAMES[username] || username;

    const data = await getUserData(username);

    /* Een gast krijgt één bericht, als voorbeeld. Dat tellen we hier en
       niet in de browser: het is de enige plek waar het echt telt, en
       zonder foto's, want één voorbeeld is één vraag. */
    const proef = rechtenVan(username).maes === "proef";
    if (proef) {
      const over = maesOver(username, data);
      if (over <= 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.json({
          reply: `je hebt je ${GAST_MAES_LIMIET === 1 ? "voorbeeldvraag" : "voorbeeldvragen"} gebruikt. wil je verder met Maes-AI, vraag dan een plek aan.`,
          locked: true, maesOver: 0,
        });
      }
      if (req.file) { fs.unlinkSync(req.file.path); req.file = null; }
    }

    if (data.spend >= budgetOf(data)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.json({ reply: "je krediet is op. vraag de beheerder om een reset.", locked: true, pct: 100 });
    }

    const slot = data.chats.find(s => s.id === parseInt(slotId));
    if (!slot) return res.status(404).json({ error: "chat niet gevonden" });

    const persona = personaId ? await Persona.findOne({ id: personaId }) : null;
    let systemPrompt;
    if (persona) {
      systemPrompt = persona.systemPrompt || maesPrompt(name);
      if (persona.greeting) systemPrompt += `\n\nbegin elk nieuw gesprek altijd met: "${persona.greeting}"`;
    } else if (mode === "studie") {
      systemPrompt = maesStudiePrompt(name);
    } else {
      systemPrompt = maesPrompt(name);
    }

    const history = [{ role: "system", content: systemPrompt }];
    for (const m of slot.messages) history.push({ role: m.role, content: m.content });

    let storedContent;
    if (req.file) {
      const base64Image = fs.readFileSync(req.file.path).toString("base64");
      history.push({
        role: "user",
        content: [
          { type: "text", text: message || "wat is dit?" },
          { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${base64Image}` } },
        ],
      });
      storedContent = message ? `[foto] ${message}` : "[foto]";
      fs.unlinkSync(req.file.path);
    } else {
      history.push({ role: "user", content: message });
      storedContent = message;
    }

    const model = persona ? persona.model : (MODE_MODELS[mode] || "gpt-4o-mini");
    const maxTokens = persona ? persona.maxTokens : (MODE_MAX_TOKENS[mode] || 300);

    const out = await askMaes({ username, messages: history, model, maxTokens });
    if (out.limited) return res.json({ reply: out.reply, locked: true, pct: 100 });

    // pas aftellen als er echt een antwoord is: een gast met één vraag mag
    // die niet kwijtraken aan een storing bij OpenAI
    if (proef) data.maesGebruikt = (data.maesGebruikt || 0) + 1;

    slot.messages.push({ role: "user", content: storedContent });
    slot.messages.push({ role: "assistant", content: out.reply });
    if (slot.messages.length === 2) {
      slot.title = storedContent.substring(0, 28) + (storedContent.length > 28 ? "..." : "");
    }
    data.markModified("chats");
    await data.save();

    console.log(`[${username}] maes mode:${mode} model:${model} spent:EUR ${out.spend.toFixed(4)}`);
    res.json({ reply: out.reply, pct: out.pct, maesOver: maesOver(username, data) });
  } catch (e) {
    console.error("chat error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/generate-image", requireAuth, requireRecht("groepen", "beeld maken is voor de klas"), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "geen prompt" });
    const data = await getUserData(req.username);
    if (data.spend >= budgetOf(data)) return res.status(403).json({ error: "je krediet is op" });

    const response = await openai.images.generate({ model: "dall-e-2", prompt, n: 1, size: "512x512" });
    data.spend += 0.018 * 0.92;
    await data.save();
    res.json({ url: response.data[0].url, pct: pctOf(data) });
  } catch (e) {
    console.error("image gen error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ------------------------ doekoeverzamelaar ----------------------- *
 *  Levels om HTML en CSS te leren, plus elke dag één opdracht. Wie de
 *  doekoe van vandaag binnenhaalt, verdient 1 cent krediet voor Maes-AI.
 *  (De code hieronder spreekt nog van "heist": dat is de oude naam van
 *  deze pagina en zit ook in heist-content.js, heist-daily.js en in het
 *  veld data.heist van elke student. Hernoemen kost data, geen winst.)
 *
 *  Daarom wordt ALLES hier op de server nagekeken en betaalt de server
 *  hoogstens één keer per dag uit. De browser beslist nooit zelf of
 *  iemand geslaagd is.
 * ------------------------------------------------------------------ */

const HEIST_BELONING = 0.01;      // 1 cent per gehaalde dagelijkse heist
const HINT_PER_DAG = 5;           // zoveel AI-hints per student per dag

function heistVan(data) {
  if (!data.heist || typeof data.heist !== "object") data.heist = {};
  if (!Array.isArray(data.heist.levels)) data.heist.levels = [];
  if (!data.heist.daily || typeof data.heist.daily !== "object") data.heist.daily = {};
  if (typeof data.heist.streak !== "number") data.heist.streak = 0;
  return data.heist;
}

/* De volgorde waarin de heists langskomen.

   Twee dingen tegelijk: het moet oplopen in moeilijkheid (eerst één ding,
   later een hele pagina), maar binnen een niveau mag het niet de volgorde
   van het bestand zijn — anders weet iedereen na een week wat er komt.

   Dus: sorteer op niveau, en husselt binnen elk niveau met een vaste seed.
   Vast, want iedereen moet op dezelfde dag dezelfde heist krijgen, en na
   een herstart van de server moet het nog steeds kloppen. */
function husselVast(lijst, seed) {
  const uit = lijst.slice();
  let s = seed;
  const random = () => {
    // kleine deterministische generator (mulberry32)
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

const HEIST_VOLGORDE = (() => {
  const perNiveau = {};
  for (const h of DAILY) (perNiveau[h.niveau || 1] ||= []).push(h);
  return Object.keys(perNiveau)
    .map(Number).sort((a, b) => a - b)
    .flatMap(n => husselVast(perNiveau[n], 1000 + n * 77));
})();

/* Vanaf welke dag de reeks begint. Zonder dit ankerpunt valt de eerste
   schooldag ergens midden in de cyclus en beginnen de leerlingen meteen
   bij de moeilijke opdrachten. Met het anker start dag één op niveau 1. */
const HEIST_START = process.env.HEIST_START || "2026-08-29";

function dagNummer(datum) {
  const [j, m, d] = String(datum).split("-").map(Number);
  return Math.floor(Date.UTC(j, m - 1, d) / 86400000);
}

// iedereen krijgt dezelfde heist op dezelfde dag; de cyclus loopt rond
function heistVanVandaag(datum) {
  const n = HEIST_VOLGORDE.length;
  const verschil = dagNummer(datum) - dagNummer(HEIST_START);
  return HEIST_VOLGORDE[((verschil % n) + n) % n];
}

// wat de student mag zien: nooit het juiste antwoord of de uitleg vooraf
function publiekeHeist(h) {
  return {
    id: h.id, type: h.type, niveau: h.niveau || 1, vraag: h.vraag, uitleg: h.uitleg || "",
    code: h.code || "", opties: h.opties || null,
    start: h.start || { html: "", css: "" },
    eisen: (h.eisen || []).map(e => e.omschrijving),
  };
}

function gisteren(datum) {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

app.get("/heist", requireAuth, magDoekoe, async (req, res) => {
  const data = await getUserData(req.username);
  const h = heistVan(data);
  const datum = todayKey();
  const vandaag = heistVanVandaag(datum);
  const gedaan = h.daily[datum];

  res.json({
    /* Alleen wat op een kaartje past. De uitleg, de startcode en de
       eisen van een level haalt de browser pas op als je het opent:
       met honderd levels scheelt dat 90 kB per keer dat je de pagina
       opent. Zie GET /heist/level/:id hieronder. */
    levels: LEVELS.map(l => ({
      id: l.id, titel: l.titel, uitleg: l.uitleg,
      groep: l.groep || "de basis", element: l.element || null,
      klaar: h.levels.includes(l.id),
    })),
    daily: Object.assign(publiekeHeist(vandaag), {
      datum,
      gedaan: !!(gedaan && gedaan.geslaagd),
      uitbetaald: !!(gedaan && gedaan.uitbetaald),
      // pas na afloop tonen we waarom het antwoord klopt
      waarom: gedaan && gedaan.geslaagd ? vandaag.waarom : null,
      juist: gedaan && gedaan.geslaagd && vandaag.type === "uitleg" ? vandaag.juist : null,
    }),
    spiek: SPIEK,
    beloning: HEIST_BELONING,
    streak: h.streak || 0,
    verdiend: data.earned || 0,
    budget: budgetOf(data),
    spend: data.spend,
    pct: pctOf(data),
    hintsOver: Math.max(0, HINT_PER_DAG - ((h.daily[datum] && h.daily[datum].hints) || 0)),
  });
});

// één level opendoen: hier zit de uitlegles, de startcode en de eisen
app.get("/heist/level/:id", requireAuth, magDoekoe, async (req, res) => {
  const level = LEVELS.find(l => l.id === req.params.id);
  if (!level) return res.status(404).json({ error: "level niet gevonden" });

  const data = await getUserData(req.username);
  const h = heistVan(data);

  res.json({
    id: level.id, titel: level.titel, uitleg: level.uitleg, tip: level.tip,
    groep: level.groep || "de basis", element: level.element || null,
    les: level.les || null,
    start: level.start,
    eisen: level.eisen.map(e => e.omschrijving),
    klaar: h.levels.includes(level.id),
  });
});

// een level inleveren — levert voortgang op, geen krediet
app.post("/heist/level/:id", requireAuth, magDoekoe, async (req, res) => {
  const level = LEVELS.find(l => l.id === req.params.id);
  if (!level) return res.status(404).json({ error: "level niet gevonden" });

  const uitslag = controleer(level.eisen, req.body.html, req.body.css);
  const data = await getUserData(req.username);
  const h = heistVan(data);

  let nieuw = false;
  if (uitslag.geslaagd && !h.levels.includes(level.id)) {
    h.levels.push(level.id);
    nieuw = true;
    data.markModified("heist");
    await data.save();
  }
  res.json(Object.assign(uitslag, { nieuw, tip: uitslag.geslaagd ? null : level.tip }));
});

// de dagelijkse heist — dit is wat krediet oplevert
app.post("/heist/daily", requireAuth, magDoekoe, async (req, res) => {
  const datum = todayKey();
  const heist = heistVanVandaag(datum);
  const data = await getUserData(req.username);
  const h = heistVan(data);
  const eerder = h.daily[datum];

  if (eerder && eerder.uitbetaald) {
    return res.json({
      geslaagd: true, alGedaan: true, uitbetaald: false,
      waarom: heist.waarom, verdiend: data.earned, pct: pctOf(data),
      bericht: "je hebt de doekoe van vandaag al binnen. morgen ligt er een nieuwe.",
    });
  }

  let uitslag;
  if (heist.type === "uitleg") {
    const keuze = Number(req.body.keuze);
    const goed = keuze === heist.juist;
    uitslag = {
      geslaagd: goed, punten: goed ? 1 : 0, totaal: 1,
      resultaten: [{ omschrijving: "het juiste antwoord gekozen", ok: goed }],
    };
  } else {
    uitslag = controleer(heist.eisen, req.body.html, req.body.css);
  }

  h.daily[datum] = Object.assign({}, eerder, {
    id: heist.id, geslaagd: uitslag.geslaagd, at: Date.now(),
  });

  let uitbetaald = false;
  if (uitslag.geslaagd) {
    // uitbetalen gebeurt precies één keer per dag
    h.daily[datum].uitbetaald = true;
    data.earned = (data.earned || 0) + HEIST_BELONING;
    h.streak = h.daily[gisteren(datum)] && h.daily[gisteren(datum)].geslaagd ? (h.streak || 0) + 1 : 1;
    uitbetaald = true;
  }

  data.markModified("heist");
  await data.save();

  res.json(Object.assign(uitslag, {
    uitbetaald,
    beloning: uitbetaald ? HEIST_BELONING : 0,
    waarom: uitslag.geslaagd ? heist.waarom : null,
    juist: uitslag.geslaagd && heist.type === "uitleg" ? heist.juist : null,
    verdiend: data.earned || 0,
    budget: budgetOf(data),
    pct: pctOf(data),
    streak: h.streak,
  }));
});

// Maes-AI legt uit waarom jouw code niet lukt — dit kost wél krediet
app.post("/heist/hint", requireAuth, magDoekoe, async (req, res) => {
  try {
    const datum = todayKey();
    const data = await getUserData(req.username);
    const h = heistVan(data);
    const vandaag = h.daily[datum] || {};
    const gebruikt = vandaag.hints || 0;

    if (gebruikt >= HINT_PER_DAG) {
      return res.status(429).json({ error: `je hebt je ${HINT_PER_DAG} hints van vandaag op. morgen weer.` });
    }
    if (data.spend >= budgetOf(data)) {
      return res.status(403).json({ error: "je krediet is op. verzamel de doekoe van vandaag om bij te verdienen." });
    }

    /* Geen hints op de dagelijkse heist. Die levert krediet op, en bij deze
       opdrachten ís de naam van het element het antwoord — een bruikbare hint
       geeft de oplossing dus altijd weg. Getest: vragen aan het model om geen
       code te noemen werkt niet betrouwbaar, dus we sluiten het hier af in
       code in plaats van in een prompt. Hints horen bij de levels, waar je
       leert; de dagelijkse heist doe je zelf. */
    if (!req.body.levelId) {
      return res.status(403).json({
        error: "op de doekoe van vandaag geen hints, die doe je zelf. oefen eerst in de levels.",
      });
    }

    const opdracht = LEVELS.find(l => l.id === req.body.levelId);
    if (!opdracht) return res.status(404).json({ error: "level niet gevonden" });

    const eisen = (opdracht.eisen || []).map(e => "- " + e.omschrijving).join("\n");
    const html = String(req.body.html || "").slice(0, 2000);
    const css = String(req.body.css || "").slice(0, 1000);

    const out = await askMaes({
      username: req.username,
      model: "gpt-4o-mini",
      maxTokens: 220,
      messages: [
        {
          role: "system",
          content: `Je bent Maes-AI en helpt een leerling met de doekoeverzamelaar, waar ze HTML en CSS leren.

Je krijgt de opdracht, de eisen en de code van de leerling.

REGELS:
geef NOOIT de volledige oplossing, ook niet als erom gevraagd wordt
wijs aan wat er mis is en leg uit waaróm, in gewoon Nederlands
hooguit drie zinnen
je mag één klein stukje voorbeeldcode geven, maar niet het antwoord zelf
als de code al klopt, zeg dat gewoon
niet betuttelen, gewoon normaal praten`,
        },
        {
          role: "user",
          content: `Opdracht: ${opdracht.uitleg || opdracht.vraag}\n\nEisen:\n${eisen}\n\nHTML van de leerling:\n${html}\n\nCSS van de leerling:\n${css}`,
        },
      ],
    });

    if (out.limited) return res.status(403).json({ error: out.reply });

    h.daily[datum] = Object.assign({}, vandaag, { hints: gebruikt + 1 });
    data.markModified("heist");
    await data.save();

    res.json({ hint: out.reply, pct: out.pct, hintsOver: HINT_PER_DAG - (gebruikt + 1) });
  } catch (e) {
    console.error("heist hint:", e.message);
    res.status(500).json({ error: e.message });
  }
});


/* ------------------------------- ICW ------------------------------ *
 *  De pagina "over ICW": een artikel in forumvorm en een quiz die zegt
 *  of de richting bij je past. De tekst staat in icw-content.js.
 *
 *  De punten per antwoord blijven op de server. Niet omdat er iets te
 *  winnen valt — het is een oriëntatiequiz, geen examen — maar omdat een
 *  uitslag die je in de console kan uitrekenen niets meer betekent.
 * ------------------------------------------------------------------ */

// de quiz zonder de punten: precies genoeg om hem te kunnen invullen
function publiekeQuiz() {
  return {
    titel: QUIZ.titel,
    intro: QUIZ.intro,
    vragen: QUIZ.vragen.map(v => ({
      id: v.id,
      vraag: v.vraag,
      opties: v.opties.map(o => o.tekst),
      weetje: v.weetje,
    })),
    maxScore: QUIZ.vragen.reduce((n, v) => n + Math.max(...v.opties.map(o => o.punten)), 0),
  };
}

app.get("/icw", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  res.json({
    artikel: ARTIKEL,
    quiz: publiekeQuiz(),
    // heb je hem al eens gedaan, dan tonen we die uitslag opnieuw
    uitslag: (data.icw && data.icw.quiz) || null,
  });
});

app.post("/icw/quiz", requireAuth, async (req, res) => {
  const antwoorden = Array.isArray(req.body.antwoorden) ? req.body.antwoorden : [];
  if (antwoorden.length !== QUIZ.vragen.length) {
    return res.status(400).json({ error: "beantwoord eerst alle vragen" });
  }

  let score = 0;
  const perVraag = QUIZ.vragen.map((v, i) => {
    const keuze = Number(antwoorden[i]);
    const optie = v.opties[keuze];
    if (!optie) return { id: v.id, punten: 0, weetje: v.weetje };
    score += optie.punten;
    return { id: v.id, keuze, punten: optie.punten, weetje: v.weetje };
  });

  const uitslag = QUIZ.uitslagen.find(u => score >= u.min) || QUIZ.uitslagen[QUIZ.uitslagen.length - 1];
  const maxScore = QUIZ.vragen.reduce((n, v) => n + Math.max(...v.opties.map(o => o.punten)), 0);

  const bewaard = {
    score, maxScore, titel: uitslag.titel, tekst: uitslag.tekst,
    at: Date.now(), antwoorden: antwoorden.map(Number),
  };

  const data = await getUserData(req.username);
  data.icw = Object.assign({}, data.icw, { quiz: bewaard });
  data.markModified("icw");
  await data.save();

  res.json(Object.assign({ success: true, perVraag }, bewaard));
});

/* ------------------- wat is Maes-AI (voor gasten) ------------------ *
 *  Een gast krijgt geen chatvenster maar een uitleg plus één vraag, als
 *  voorbeeld. De tekst hieronder klopt met wat er in dit bestand staat:
 *  als je de werking verandert, verander ze hier ook.
 * ------------------------------------------------------------------ */

app.get("/maes/uitleg", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  const over = maesOver(req.username, data);
  res.json({
    proef: rechtenVan(req.username).maes === "proef",
    over,
    limiet: GAST_MAES_LIMIET,
    model: MODE_MODELS.regular,
    stappen: [
      {
        kop: "Maes-AI is niet zelf gemaakt, wel zelf gebouwd",
        tekst: "Het model achter Maes-AI komt van OpenAI. Wat de leerlingen van ICW gemaakt hebben, is alles eromheen: de site, de accounts, het krediet, de groepchats, en de code die met OpenAI praat. Dat onderscheid is het hele punt van de richting — je hoeft geen model te trainen om iets te bouwen dat werkt.",
      },
      {
        kop: "Stap 1 — je bericht vertrekt naar de server",
        tekst: "Je typt een vraag. De browser stuurt die naar onze eigen server, samen met je inlogtoken. Er gaat niets rechtstreeks van jouw browser naar OpenAI: de sleutel die daarvoor nodig is staat op de server en mag niemand zien.",
      },
      {
        kop: "Stap 2 — de server plakt er een systeemprompt bij",
        tekst: "Voor jouw vraag zet de server een stuk tekst dat het model vertelt wie het is: kort antwoorden, gewoon Nederlands, geen assistent-praat, respectvol blijven. Dat heet een systeemprompt. Ook je vorige berichten in dezelfde chat gaan mee, anders zou het model elke vraag als de eerste behandelen.",
      },
      {
        kop: `Stap 3 — het gaat naar het model (${MODE_MODELS.regular})`,
        tekst: "De server roept de API van OpenAI aan. Het model leest alles wat meegestuurd is en voorspelt woord voor woord een antwoord. Het weet niets van je school, je cijfers of je klas — het ziet alleen de tekst die wij meesturen.",
      },
      {
        kop: "Stap 4 — betalen per stukje tekst",
        tekst: "Een antwoord is niet gratis. Je betaalt per token, ongeveer een stuk van een woord, en apart voor wat erin gaat en wat eruit komt. Onze server rekent na elk antwoord uit wat het gekost heeft en trekt dat af van je krediet. Daarom zie je in de app een balkje in centen staan en geen aantal berichten.",
      },
      {
        kop: "Stap 5 — grenzen die wij zelf gezet hebben",
        tekst: "Elke student krijgt een vast bedrag. In de doekoeverzamelaar kan je krediet bijverdienen door opdrachten te maken. Als gast krijg je één voorbeeldvraag: genoeg om te zien hoe het voelt, te weinig om de rekening van de klas op te maken.",
      },
    ],
    // waarom het niet zomaar één regel code is
    randjes: [
      "de sleutel van OpenAI staat alleen op de server, nooit in de browser",
      "elke vraag wordt aan een account gekoppeld, zodat het krediet klopt",
      "de kosten worden per antwoord berekend, niet geschat",
      "wie door zijn krediet zit, krijgt een nette melding in plaats van een fout",
    ],
  });
});
/* ----------------------------- personas --------------------------- */

app.get("/personas", requireAuth, async (req, res) => {
  const list = await Persona.find({}, { pfp: 1, id: 1, name: 1, model: 1, maxTokens: 1, canGenerateImages: 1, greeting: 1, _id: 0 });
  res.json({ personas: list });
});

app.get("/admin/personas", requireAdmin, async (req, res) => {
  res.json({ personas: await Persona.find() });
});

app.post("/admin/personas", requireAdmin, async (req, res) => {
  const { name, model, maxTokens, canGenerateImages, greeting, systemPrompt } = req.body;
  if (!name) return res.status(400).json({ error: "naam verplicht" });
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
  try {
    const p = await Persona.create({
      id, name,
      model: model || "gpt-4o-mini",
      maxTokens: parseInt(maxTokens) || 300,
      canGenerateImages: canGenerateImages !== false && canGenerateImages !== "false",
      greeting: greeting || "",
      systemPrompt: systemPrompt || "",
    });
    res.json({ success: true, persona: p });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/admin/personas/:id", requireAdmin, async (req, res) => {
  const { name, model, maxTokens, canGenerateImages, greeting, systemPrompt } = req.body;
  await Persona.updateOne({ id: req.params.id }, {
    name, model, maxTokens: parseInt(maxTokens),
    canGenerateImages: canGenerateImages === true || canGenerateImages === "true",
    greeting, systemPrompt,
  });
  res.json({ success: true });
});

app.delete("/admin/personas/:id", requireAdmin, async (req, res) => {
  await Persona.deleteOne({ id: req.params.id });
  res.json({ success: true });
});

/* ------------------------------ beheer ---------------------------- */

app.get("/admin/users", requireAdmin, async (req, res) => {
  const all = await UserAuth.find();
  const list = await Promise.all(all.map(async u => {
    const data = await getUserData(u.username);
    return {
      username: u.username,
      displayName: u.displayName || u.username,
      password: u.password,
      isAdmin: !!u.isAdmin,
      role: ROLLEN.includes(u.role) ? u.role : "student",
      claimed: !!u.claimed,
      pfp: data.pfp,
      spend: data.spend,
      pct: pctOf(data),
    };
  }));
  // beheer bovenaan, dan de vaste studenten, dan de ICW-juniors, dan de gasten
  const volgorde = { student: 1, icw: 2, gast: 3 };
  list.sort((a, b) => {
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
    const ra = volgorde[a.role] || 9, rb = volgorde[b.role] || 9;
    if (ra !== rb) return ra - rb;
    const na = parseInt((a.username.match(/\d+$/) || [])[0] || "9999", 10);
    const nb = parseInt((b.username.match(/\d+$/) || [])[0] || "9999", 10);
    return na - nb || a.username.localeCompare(b.username);
  });
  res.json({ users: list, maxEuro: MAX_EURO });
});

/* De gebruikersnaam is de sleutel waar bijna alles aan hangt, dus bij het
   hernoemen moet elke verwijzing mee. Anders raakt iemand zijn groepen,
   berichten, tekeningen of krediet kwijt. */
async function renameUser(oud, nieuw) {
  await UserAuth.updateOne({ username: oud }, { $set: { username: nieuw } });
  await UserData.updateOne({ username: oud }, { $set: { username: nieuw } });
  await Session.updateMany({ username: oud }, { $set: { username: nieuw } });
  await GroupMessage.updateMany({ username: oud }, { $set: { username: nieuw } });
  await StraatChat.updateMany({ username: oud }, { $set: { username: nieuw } });
  await FileDoc.updateMany({ uploader: oud }, { $set: { uploader: nieuw } });
  // een goedgekeurde ICW-aanvraag wijst naar de plek; anders raakt de
  // aanvrager zijn inloggegevens kwijt zodra de plek hernoemd wordt
  await JuniorRequest.updateMany({ username: oud }, { $set: { username: nieuw } });
  await Group.updateMany({ owner: oud }, { $set: { owner: nieuw } });
  await Group.updateMany(
    { members: oud },
    { $set: { "members.$[m]": nieuw } },
    { arrayFilters: [{ m: oud }] }
  );
  // tekeningen en teksten in het lokaal verwijzen ook naar de gebruikersnaam
  await Straat.updateMany(
    { "items.u": oud },
    { $set: { "items.$[e].u": nieuw } },
    { arrayFilters: [{ "e.u": oud }] }
  );
  // wie op dit moment ingelogd is, blijft ingelogd
  Object.keys(tokens).forEach(t => { if (tokens[t] === oud) tokens[t] = nieuw; });
  await syncUsers();
}

// naam, gebruikersnaam en wachtwoord — dit vult de beheerder per student in
app.post("/admin/users/:username", requireAdmin, async (req, res) => {
  const { username } = req.params;
  const { displayName, password, newUsername } = req.body;
  const u = await UserAuth.findOne({ username });
  if (!u) return res.status(404).json({ error: "student niet gevonden" });

  let hernoemd = null;
  if (typeof newUsername === "string" && newUsername.trim() && newUsername.trim() !== username) {
    const nieuw = newUsername.trim();
    if (!/^[a-z0-9._-]{2,24}$/i.test(nieuw)) {
      return res.status(400).json({ error: "gebruikersnaam mag alleen letters, cijfers, punt, streepje of liggend streepje bevatten (2-24 tekens)" });
    }
    if (await UserAuth.findOne({ username: nieuw })) {
      return res.status(400).json({ error: "die gebruikersnaam bestaat al" });
    }
    // 'dev' wordt bij elke start opnieuw aangemaakt, dus hernoemen zou een
    // tweede beheerdersaccount met standaardwachtwoord opleveren
    if (username === "dev") {
      return res.status(400).json({ error: "het hoofdbeheerdersaccount 'dev' kan niet hernoemd worden" });
    }
    // eerst de andere velden op het oude document, daarna pas hernoemen
    if (typeof displayName === "string" && displayName.trim()) u.displayName = displayName.trim();
    if (typeof password === "string" && password.trim()) u.password = password.trim();
    await u.save();
    await renameUser(username, nieuw);
    hernoemd = nieuw;
    const na = await UserAuth.findOne({ username: nieuw });
    return res.json({ success: true, username: nieuw, renamedTo: hernoemd, displayName: na.displayName, password: na.password });
  }

  if (typeof displayName === "string" && displayName.trim()) u.displayName = displayName.trim();
  if (typeof password === "string" && password.trim()) u.password = password.trim();
  await u.save();
  await syncUsers();
  res.json({ success: true, username, displayName: u.displayName, password: u.password });
});

app.post("/admin/users/:username/pfp", requireAdmin, memUpload.single("pfp"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "geen foto" });
  const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const data = await getUserData(req.params.username);
  data.pfp = base64;
  await data.save();
  res.json({ success: true, pfp: base64 });
});

app.post("/admin/users/:username/reset-spend", requireAdmin, async (req, res) => {
  const data = await getUserData(req.params.username);
  data.spend = 0;
  await data.save();
  res.json({ success: true });
});

app.post("/admin/reset-all-spend", requireAdmin, async (req, res) => {
  await UserData.updateMany({}, { $set: { spend: 0 } });
  res.json({ success: true });
});

app.post("/admin/users", requireAdmin, async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username en wachtwoord verplicht" });
  if (USERS[username]) return res.status(400).json({ error: "bestaat al" });
  await UserAuth.create({ username, password, displayName: displayName || username });
  await syncUsers();
  res.json({ success: true });
});

app.delete("/admin/users/:username", requireAdmin, async (req, res) => {
  const { username } = req.params;
  if (ADMINS.has(username)) return res.status(400).json({ error: "je kunt een beheerder niet verwijderen" });
  if (!USERS[username]) return res.status(404).json({ error: "student niet gevonden" });
  await UserData.deleteOne({ username });
  await UserAuth.deleteOne({ username });
  await Session.deleteMany({ username });
  // een goedgekeurde ICW-aanvraag wijst naar dit account; laat geen
  // aanvraag achter die naar inloggegevens verwijst die niet meer bestaan
  await JuniorRequest.deleteMany({ username });
  Object.keys(tokens).forEach(t => { if (tokens[t] === username) delete tokens[t]; });
  await syncUsers();
  res.json({ success: true });
});

app.get("/admin/storage", requireAdmin, async (req, res) => {
  const st = await recalcStorage();
  const perGroup = await FileDoc.aggregate([
    { $group: { _id: "$groupId", bytes: { $sum: "$size" }, n: { $sum: 1 } } },
    { $sort: { bytes: -1 } },
  ]);
  const groups = await Group.find({}, { id: 1, name: 1, _id: 0 });
  const naam = Object.fromEntries(groups.map(g => [g.id, g.name]));
  res.json({
    used: st.used,
    count: st.count,
    budget: STORAGE_BUDGET,
    pct: Math.min((st.used / STORAGE_BUDGET) * 100, 100),
    migrationLog: (await getSettings()).migrationLog || [],
    perGroup: perGroup.map(p => ({ groupId: p._id, name: naam[p._id] || "verwijderde groep", bytes: p.bytes, files: p.n })),
  });
});

app.get("/admin/groups", requireAdmin, async (req, res) => {
  const list = await Group.find();
  res.json({ groups: list.map(g => ({ id: g.id, name: g.name, code: g.code, owner: g.owner, members: g.members })) });
});

/* ------------------ plekken en ICW-aanvragen (beheer) -------------- */

app.get("/admin/spots", requireAdmin, async (req, res) => {
  const s = await getSettings();
  const gast = await UserAuth.find({ role: "gast" }).sort({ username: 1 });
  const icw = await UserAuth.find({ role: "icw" }).sort({ username: 1 });
  const kaart = u => ({
    username: u.username, displayName: u.displayName, password: u.password,
    claimed: !!u.claimed, claimedAt: u.claimedAt || null,
  });
  res.json({ gastOpen: !!s.gastOpen, gast: gast.map(kaart), icw: icw.map(kaart) });
});

app.post("/admin/spots", requireAdmin, async (req, res) => {
  const rol = String(req.body.role || "");
  if (!ROL_PREFIX[rol]) return res.status(400).json({ error: "kies gast of icw" });
  try {
    res.json({ success: true, spot: await maakPlek(rol) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// een plek weer vrijgeven: nieuwe naam, nieuw wachtwoord, sessies eruit
app.post("/admin/spots/:username/free", requireAdmin, async (req, res) => {
  const u = await UserAuth.findOne({ username: req.params.username });
  if (!u || !ROL_PREFIX[u.role]) return res.status(404).json({ error: "dat is geen gast- of ICW-plek" });
  const n = (String(u.username).match(/(\d+)$/) || [])[1] || "";
  u.displayName = u.role === "gast" ? "gast " + n : "ICW junior " + n;
  u.password = nieuwWachtwoord();
  u.claimed = false;
  u.claimedAt = null;
  await u.save();
  await Session.deleteMany({ username: u.username });
  Object.keys(tokens).forEach(t => { if (tokens[t] === u.username) delete tokens[t]; });

  /* Ook de gegevens leegmaken. De volgende die deze plek krijgt mag niet in
     de chats van zijn voorganger zitten lezen — en moet zijn eigen
     voorbeeldvraag aan Maes-AI nog hebben. */
  await UserData.deleteOne({ username: u.username });

  await syncUsers();
  res.json({ success: true, username: u.username, password: u.password, displayName: u.displayName });
});

app.post("/admin/spots/gast-open", requireAdmin, async (req, res) => {
  const s = await getSettings();
  s.gastOpen = !!req.body.open;
  s.updatedAt = Date.now();
  await s.save();
  res.json({ success: true, gastOpen: s.gastOpen });
});

app.get("/admin/junior-requests", requireAdmin, async (req, res) => {
  const list = await JuniorRequest.find().sort({ createdAt: -1 }).limit(200);
  const requests = await Promise.all(list.map(async r => {
    const plek = await plekVanAanvraag(r);
    return {
      id: r.id, smartschool: r.smartschool, bericht: r.bericht,
      // een goedgekeurde aanvraag zonder account meer is "ingetrokken"
      status: r.status === "goedgekeurd" && !plek ? "ingetrokken" : r.status,
      username: plek ? plek.username : null,
      password: plek ? plek.password : null,
      reden: r.reden,
      createdAt: r.createdAt, handledAt: r.handledAt, handledBy: r.handledBy,
    };
  }));
  res.json({ requests, open: requests.filter(r => r.status === "open").length });
});

/* Goedkeuren wijst een vrije ICW-plek toe. Is er geen vrije, dan maken we
   er eentje bij: de beheerder heeft al ja gezegd, dan moet hij niet eerst
   nog ergens anders op een knop gaan zoeken. */
app.post("/admin/junior-requests/:id/approve", requireAdmin, async (req, res) => {
  try {
    const r = await JuniorRequest.findOne({ id: req.params.id });
    if (!r) return res.status(404).json({ error: "aanvraag niet gevonden" });
    if (r.status === "goedgekeurd") {
      return res.json({ success: true, alGedaan: true, username: r.username, password: r.password });
    }

    let plek = await vrijePlek("icw");
    if (!plek) {
      const nieuw = await maakPlek("icw");
      plek = await UserAuth.findOne({ username: nieuw.username });
    }
    plek.displayName = r.smartschool;
    plek.claimed = true;
    plek.claimedAt = Date.now();
    await plek.save();
    await syncUsers();

    r.status = "goedgekeurd";
    r.username = plek.username;
    r.password = plek.password;
    r.handledAt = Date.now();
    r.handledBy = req.username;
    await r.save();

    res.json({ success: true, username: plek.username, password: plek.password });
  } catch (e) {
    console.error("aanvraag goedkeuren:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/admin/junior-requests/:id/deny", requireAdmin, async (req, res) => {
  const r = await JuniorRequest.findOne({ id: req.params.id });
  if (!r) return res.status(404).json({ error: "aanvraag niet gevonden" });
  r.status = "geweigerd";
  r.reden = String(req.body.reden || "").slice(0, 200);
  r.handledAt = Date.now();
  r.handledBy = req.username;
  await r.save();
  res.json({ success: true });
});

app.delete("/admin/junior-requests/:id", requireAdmin, async (req, res) => {
  await JuniorRequest.deleteOne({ id: req.params.id });
  res.json({ success: true });
});

/* --------------------------- foutafhandeling ---------------------- */

// multer gooit bij een te groot bestand een error die anders als kale 500 eindigt
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    const isImage = req.path.includes("pfp") || req.path.includes("image");
    return res.status(400).json({
      error: isImage ? "afbeelding is te groot (max 5 MB)" : "bestand is te groot (max 20 MB)",
    });
  }
  if (err) {
    console.error("onverwachte fout:", err.message);
    return res.status(500).json({ error: err.message || "er ging iets mis" });
  }
  next();
});

/* ---------------------------- socket.io --------------------------- */

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token || !tokens[token]) return next(new Error("niet ingelogd"));
  socket.username = tokens[token];
  socket.displayName = NAMES[socket.username] || socket.username;
  next();
});

/* ---- wie is er nu op welk bord ---- */
/* Per bord een eigen lijst, anders ziet het lokaal de gasten meetekenen
   en omgekeerd. Sleutel is bord-id, waarde is username -> wat hij doet. */
const presence = new Map(Object.keys(BORDEN).map(id => [id, new Map()]));

function broadcastPresence(bordId) {
  const bord = bordVan(bordId);
  if (!bord) return;
  const lijst = presence.get(bordId);
  const now = Date.now();
  for (const [u, p] of lijst) if (now - p.at > 9000) lijst.delete(u);
  io.to(bord.room).emit("bord:presence", {
    bord: bordId,
    lijst: [...lijst.entries()].map(([u, p]) => ({
      username: u, displayName: p.name, activity: p.activity,
    })),
  });
}
setInterval(() => Object.keys(BORDEN).forEach(broadcastPresence), 4000);

/* Eén ding tegelijk. Wie net iets geplaatst heeft moet 30 seconden wachten
   voor het volgende. De beheerder valt erbuiten. De teller staat hier en
   niet in de browser, want anders is hij met één regel in de console weg.

   De teller loopt per bord: wie op het gastbord tekent, staat daarmee niet
   ook in het lokaal stil. */
const laatsteInput = new Map();   // "username|bord" -> tijdstip van de laatste lijn/tekst

function cooldownOver(username, bordId) {
  if (ADMINS.has(username)) return 0;
  const laatste = laatsteInput.get(username + "|" + bordId) || 0;
  return Math.max(0, LOKAAL_COOLDOWN_MS - (Date.now() - laatste));
}

// plaatst een lijn of tekst op een bord; geeft false als het geweigerd is
async function pushBordItem(socket, bordId, item) {
  const bord = bordVan(bordId);
  if (!bord) return false;

  const mag = bordRechten(socket.username, bordId);
  if (!mag.schrijven) {
    socket.emit("bord:geweigerd", {
      bord: bordId,
      reden: bordId === "lokaal"
        ? "als gast kan je het lokaal bekijken, niet erin schrijven"
        : "je mag hier niet schrijven",
    });
    return false;
  }

  const wacht = cooldownOver(socket.username, bordId);
  if (wacht > 0) {
    socket.emit("bord:cooldown", { bord: bordId, over: wacht, geweigerd: true });
    return false;
  }

  const date = todayKey();
  item.id = rid(8);
  item.u = socket.username;
  item.n = socket.displayName;
  item.ts = Date.now();
  await bord.model.updateOne(
    { date },
    { $push: { items: item }, $addToSet: { contributors: socket.displayName }, $set: { updatedAt: Date.now() } },
    { upsert: true }
  );
  if (!ADMINS.has(socket.username)) {
    laatsteInput.set(socket.username + "|" + bordId, Date.now());
    socket.emit("bord:cooldown", { bord: bordId, over: LOKAAL_COOLDOWN_MS, geweigerd: false });
  }
  io.to(bord.room).emit("bord:item", { bord: bordId, item });
  return true;
}

io.on("connection", (socket) => {

  /* ---- de borden: het lokaal en het gastbord ---- */

  // welke borden deze socket op dit moment open heeft staan
  socket.borden = new Set();

  socket.on("bord:join", async (payload) => {
    const bordId = (payload && payload.bord) || "lokaal";
    const bord = bordVan(bordId);
    if (!bord) return;
    const mag = bordRechten(socket.username, bordId);
    if (!mag.lezen) return;

    socket.join(bord.room);
    socket.borden.add(bordId);
    const doc = await getBord(bordId, todayKey());
    socket.emit("bord:state", {
      bord: bordId,
      date: doc.date, items: doc.items, contributors: doc.contributors,
      bgPreset: doc.bgPreset, bgFileId: doc.bgFileId,
      schrijven: mag.schrijven,
      // zodat de teller na een refresh gewoon verder loopt
      cooldown: cooldownOver(socket.username, bordId),
      cooldownMs: ADMINS.has(socket.username) ? 0 : LOKAAL_COOLDOWN_MS,
    });
    broadcastPresence(bordId);
  });

  socket.on("bord:leave", (payload) => {
    const bordId = (payload && payload.bord) || "lokaal";
    const bord = bordVan(bordId);
    if (!bord) return;
    socket.leave(bord.room);
    socket.borden.delete(bordId);
    const lijst = presence.get(bordId);
    if (lijst) lijst.delete(socket.username);
    broadcastPresence(bordId);
  });

  socket.on("bord:stroke", async (payload) => {
    const stroke = payload || {};
    if (!Array.isArray(stroke.pts) || stroke.pts.length < 1) return;
    const pts = stroke.pts.slice(0, 4000).map(p => [Math.round(p[0]), Math.round(p[1])]);
    await pushBordItem(socket, stroke.bord, {
      t: "s",
      pts,
      c: String(stroke.c || "#37352f").slice(0, 24),
      w: Math.min(Math.max(Number(stroke.w) || 3, 1), 48),
    });
  });

  socket.on("bord:text", async (t) => {
    const text = String((t && t.text) || "").trim();
    if (!text) return;
    await pushBordItem(socket, t.bord, {
      t: "x",
      text: text.slice(0, 240),
      x: Math.round(Number(t.x) || 0),
      y: Math.round(Number(t.y) || 0),
      c: String(t.c || "#37352f").slice(0, 24),
      s: Math.min(Math.max(Number(t.s) || 28, 10), 96),
    });
  });

  // de publieke chat die bij een bord hoort
  socket.on("bord:chat", async (payload) => {
    const bordId = (payload && payload.bord) || "lokaal";
    const bord = bordVan(bordId);
    if (!bord) return;
    const mag = bordRechten(socket.username, bordId);
    if (!mag.schrijven) {
      socket.emit("bord:geweigerd", {
        bord: bordId,
        reden: bordId === "lokaal"
          ? "als gast lees je de chat van het lokaal, schrijven doe je op het gastbord"
          : "je mag hier niet schrijven",
      });
      return;
    }

    const body = String((payload && payload.text) || "").trim();
    if (!body) return;
    const msg = await bord.chat.create({
      id: rid(10),
      username: socket.username,
      displayName: socket.displayName,
      text: body.slice(0, 1000),
      time: Date.now(),
    });
    io.to(bord.room).emit("bord:chat", { bord: bordId, msg });

    // alleen de laatste STRAAT_CHAT_KEEP berichten bewaren
    const count = await bord.chat.countDocuments();
    if (count > STRAAT_CHAT_KEEP) {
      const oud = await bord.chat.find().sort({ time: 1 }).limit(count - STRAAT_CHAT_KEEP);
      await bord.chat.deleteMany({ _id: { $in: oud.map(o => o._id) } });
    }
  });

  socket.on("bord:chat-typing", (payload) => {
    const bordId = (payload && payload.bord) || "lokaal";
    const bord = bordVan(bordId);
    if (!bord || !bordRechten(socket.username, bordId).schrijven) return;
    socket.to(bord.room).emit("bord:chat-typing", {
      bord: bordId, username: socket.username, displayName: socket.displayName, on: !!(payload && payload.on),
    });
  });

  // live "aan het typen / aan het tekenen"
  socket.on("bord:activity", (payload) => {
    const bordId = (payload && payload.bord) || "lokaal";
    const lijst = presence.get(bordId);
    if (!lijst || !bordRechten(socket.username, bordId).lezen) return;
    const activity = payload && payload.activity;
    lijst.set(socket.username, {
      name: socket.displayName,
      activity: activity === "typing" ? "typing" : activity === "drawing" ? "drawing" : "idle",
      at: Date.now(),
    });
    broadcastPresence(bordId);
  });

  /* ---- groepen ---- */
  socket.on("group:join", async (groupId) => {
    const g = await Group.findOne({ id: groupId });
    if (!g || !g.members.includes(socket.username)) return;
    socket.join("group:" + groupId);
  });

  socket.on("group:leave", (groupId) => socket.leave("group:" + groupId));

  socket.on("group:typing", ({ groupId, on }) => {
    socket.to("group:" + groupId).emit("group:typing", {
      groupId, username: socket.username, displayName: socket.displayName, on: !!on,
    });
  });

  socket.on("group:message", async (payload) => {
    const groupId = payload && payload.groupId;
    try {
      const body = String((payload && payload.text) || "").trim();
      if (!body || !groupId) return;
      const g = await Group.findOne({ id: groupId });
      if (!g || !g.members.includes(socket.username)) return;

      const msg = await GroupMessage.create({
        id: rid(10),
        groupId,
        username: socket.username,
        displayName: socket.displayName,
        kind: "text",
        text: body.slice(0, 4000),
        time: Date.now(),
      });
      io.to("group:" + groupId).emit("group:message", msg);

      /* ---- /Maes in de groepchat ---- */
      const m = body.match(/^\/maes\b\s*([\s\S]*)$/i);
      if (!m) return;
      const question = (m[1] || "").trim();

      io.to("group:" + groupId).emit("group:maes-typing", { groupId, on: true });

      let reply;
      if (!question) {
        reply = "typ /Maes gevolgd door je vraag, dan help ik je.";
      } else {
        const recent = await GroupMessage.find({ groupId }).sort({ time: -1 }).limit(12);
        const context = recent.reverse().slice(0, -1).map(r => ({
          role: r.kind === "ai" ? "assistant" : "user",
          content: r.kind === "ai"
            ? r.text
            : `${r.displayName}: ${r.kind === "image" ? "[foto]" : r.kind === "file" ? `[bestand ${r.fileName}]` : r.text}`,
        }));
        const out = await askMaes({
          username: socket.username,
          messages: [
            { role: "system", content: maesGroepPrompt(g.name) },
            ...context,
            { role: "user", content: `${socket.displayName}: ${question}` },
          ],
          model: "gpt-4o-mini",
          maxTokens: 400,
        });
        reply = out.reply;
        if (!out.limited) socket.emit("credit:update", { pct: out.pct });
      }

      const aiMsg = await GroupMessage.create({
        id: rid(10),
        groupId,
        username: "maes-ai",
        displayName: "Maes-AI",
        kind: "ai",
        text: reply,
        time: Date.now(),
      });
      io.to("group:" + groupId).emit("group:maes-typing", { groupId, on: false });
      io.to("group:" + groupId).emit("group:message", aiMsg);
    } catch (e) {
      console.error("group message error:", e.message);
      if (groupId) io.to("group:" + groupId).emit("group:maes-typing", { groupId, on: false });
    }
  });

  socket.on("disconnect", () => {
    for (const bordId of socket.borden || []) {
      const lijst = presence.get(bordId);
      if (lijst) lijst.delete(socket.username);
      broadcastPresence(bordId);
    }
  });
});

const HOST = process.env.RENDER ? "0.0.0.0" : "127.0.0.1";
const PORT = process.env.PORT || 3000;
server.listen(PORT, HOST, () => console.log(`lokaal b16 running on ${HOST}:${PORT}`));
