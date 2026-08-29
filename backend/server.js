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

dotenv.config();

/* ------------------------------------------------------------------ *
 *  drerries-ai  —  backend
 *  de straat (dagelijkse tekening + typen) · groepen · Maes-AI
 * ------------------------------------------------------------------ */

const MAX_EURO = 0.25;        // harde limiet per student
const TRIAL_EURO = 0.15;      // "gratis krediet" op de Maes-AI pagina
const STUDENT_COUNT = 20;

const IMAGE_MAX = 5 * 1024 * 1024;    // 5 MB
const FILE_MAX = 20 * 1024 * 1024;    // 20 MB

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
});

const UserDataSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  spend: { type: Number, default: 0 },
  chats: { type: Array, default: [] },
  pfp: { type: String, default: null },
});

const SessionSchema = new mongoose.Schema({
  token: { type: String, unique: true },
  username: String,
  createdAt: { type: Date, default: Date.now },
});

// één document per dag — de straat
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
// publieke chat op de straat — iedereen zit hier samen in
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
  migrationLog: { type: Array, default: [] },
  straatBgPreset: { type: String, default: "" },
  straatBgFileId: { type: String, default: null },
  updatedAt: { type: Number, default: () => Date.now() },
});

const Persona = mongoose.model("Persona", PersonaSchema);
const StraatChat = mongoose.model("StraatChat", StraatChatSchema);
const Settings = mongoose.model("Settings", SettingsSchema);

const STRAAT_CHAT_KEEP = 200;

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

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../frontend")));

/* ---------------------------- helpers ----------------------------- */

const USERS = {};   // username -> password
const NAMES = {};   // username -> displayName
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

function pctOf(spend) {
  return Math.min((spend / MAX_EURO) * 100, 100);
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
    // 20 studenten — de beheerder vult naam en wachtwoord in via /beheer
    for (let i = 1; i <= STUDENT_COUNT; i++) {
      const u = "user" + i;
      await UserAuth.updateOne(
        { username: u },
        { $setOnInsert: { password: u, displayName: u, isAdmin: false } },
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
  ADMINS.clear();
  all.forEach(u => {
    USERS[u.username] = u.password;
    NAMES[u.username] = u.displayName || u.username;
    if (u.isAdmin) ADMINS.add(u.username);
  });
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
   die net als andere uploads in GridFS staat. De straat-achtergrond hoort
   bij niemand in het bijzonder en krijgt daarom een vaste "groep". */

const STRAAT_BG_GROUP = "__straat__";
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

async function getStraat(date) {
  let doc = await Straat.findOne({ date });
  if (!doc) {
    const s = await getSettings();
    doc = await Straat.create({
      date, items: [], contributors: [],
      bgPreset: s.straatBgPreset || "", bgFileId: s.straatBgFileId || null,
    });
  }
  return doc;
}

/* --------------------------- Maes-AI ------------------------------ */

function maesPrompt(name) {
  return `Je bent Maes-AI, de AI van drerries-ai. Je helpt studenten. Je antwoordt in gewoon, casual Nederlands, zoals je een klasgenoot een berichtje stuurt.

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
  return `Je bent Maes-AI, opgeroepen met /Maes in de groepchat "${groupName}" van drerries-ai.

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
  if (data.spend >= MAX_EURO) {
    return { limited: true, reply: "je krediet is op. vraag de beheerder om een reset.", pct: 100 };
  }
  const completion = await openai.chat.completions.create({ model, messages, max_tokens: maxTokens });
  const reply = completion.choices[0].message.content;
  data.spend += calcCostEuro(completion.usage);
  await data.save();
  return { reply, pct: pctOf(data.spend), spend: data.spend };
}

/* ---------------------------- auth mw ----------------------------- */

function requireAuth(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "niet ingelogd" });
  req.username = tokens[token];
  req.authToken = token;
  next();
}

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
      pfp: data.pfp,
      isAdmin: ADMINS.has(u),
      pct: pctOf(data.spend),
    });
  } catch (e) {
    console.error("login error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
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
    pfp: data.pfp,
    isAdmin: ADMINS.has(req.username),
    spend: data.spend,
    pct: pctOf(data.spend),
    maxEuro: MAX_EURO,
    trialEuro: TRIAL_EURO,
    limits: { image: IMAGE_MAX, file: FILE_MAX },
  });
});

app.post("/me/pfp", requireAuth, memUpload.single("pfp"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "geen foto" });
  const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const data = await getUserData(req.username);
  data.pfp = base64;
  await data.save();
  res.json({ success: true, pfp: base64 });
});

/* ----------------------------- straat ----------------------------- */

// het bord van vandaag
app.get("/straat", requireAuth, async (req, res) => {
  const date = todayKey();
  const doc = await getStraat(date);
  res.json({ date, items: doc.items, contributors: doc.contributors, bgPreset: doc.bgPreset, bgFileId: doc.bgFileId });
});

// archief — elke dag, nieuwste eerst
app.get("/straat/archive", requireAuth, async (req, res) => {
  const today = todayKey();
  const docs = await Straat.find({}, { date: 1, items: 1, contributors: 1, _id: 0 }).sort({ date: -1 }).limit(120);
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

// publieke chat van de straat
app.get("/straat/chat", requireAuth, async (req, res) => {
  const messages = await StraatChat.find().sort({ time: -1 }).limit(STRAAT_CHAT_KEEP);
  res.json({ messages: messages.reverse() });
});

// één dag uit het archief, alleen-lezen
app.get("/straat/:date", requireAuth, async (req, res) => {
  const doc = await Straat.findOne({ date: req.params.date });
  if (!doc) return res.status(404).json({ error: "die dag bestaat niet" });
  res.json({ date: doc.date, items: doc.items, contributors: doc.contributors, readonly: doc.date !== todayKey(), bgPreset: doc.bgPreset, bgFileId: doc.bgFileId });
});

// achtergrond van de straat — alleen de beheerder
app.post("/straat/background", requireAdmin, (req, res) => {
  groupUpload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "afbeelding is te groot (max 5 MB)" : err.message });
    }
    try {
      const date = todayKey();
      const doc = await getStraat(date);
      const instellingen = await getSettings();
      const vorige = doc.bgFileId;

      if (req.file) {
        if ((req.file.mimetype || "").startsWith("image/") && req.file.size > IMAGE_MAX) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "afbeelding is te groot (max 5 MB)" });
        }
        const fileId = await saveBackgroundImage(req.file, STRAAT_BG_GROUP, req.username, vorige);
        doc.bgFileId = fileId; doc.bgPreset = "";
        instellingen.straatBgFileId = fileId; instellingen.straatBgPreset = "";
      } else if (req.body.clear) {
        if (vorige) await removeBackgroundImage(vorige);
        doc.bgFileId = null; doc.bgPreset = "";
        instellingen.straatBgFileId = null; instellingen.straatBgPreset = "";
      } else {
        const preset = String(req.body.preset || "");
        if (!PRESETS.includes(preset)) return res.status(400).json({ error: "onbekende achtergrond" });
        if (vorige) await removeBackgroundImage(vorige);
        doc.bgPreset = preset; doc.bgFileId = null;
        instellingen.straatBgPreset = preset; instellingen.straatBgFileId = null;
      }

      await doc.save();
      await instellingen.save();
      const payload = { bgPreset: doc.bgPreset, bgFileId: doc.bgFileId };
      io.to("straat").emit("straat:background", payload);
      res.json(Object.assign({ success: true }, payload));
    } catch (e) {
      console.error("straat achtergrond:", e.message);
      res.status(500).json({ error: e.message });
    }
  });
});

// beheerder mag het bord van vandaag leegmaken
app.post("/straat/clear", requireAdmin, async (req, res) => {
  const date = todayKey();
  await Straat.updateOne({ date }, { $set: { items: [], contributors: [], updatedAt: Date.now() } }, { upsert: true });
  io.to("straat").emit("straat:cleared");
  res.json({ success: true });
});

/* -------------------- inlogscherm + eigen iconen ------------------- */

async function getSettings() {
  let s = await Settings.findOne({ key: "app" });
  if (!s) s = await Settings.create({ key: "app" });
  return s;
}

// publiek: het inlogscherm moet dit kunnen ophalen vóór je ingelogd bent
app.get("/public/login-screen", async (req, res) => {
  try {
    const s = await getSettings();
    res.json({ title: s.loginTitle || "", text: s.loginText || "", image: s.loginImage || null });
  } catch (e) {
    res.json({ title: "", text: "", image: null });
  }
});

app.post("/admin/login-screen", requireAdmin, async (req, res) => {
  const s = await getSettings();
  if (typeof req.body.title === "string") s.loginTitle = req.body.title.slice(0, 80);
  if (typeof req.body.text === "string") s.loginText = req.body.text.slice(0, 400);
  if (req.body.clearImage) s.loginImage = null;
  s.updatedAt = Date.now();
  await s.save();
  res.json({ success: true, title: s.loginTitle, text: s.loginText, image: s.loginImage });
});

app.post("/admin/login-screen/image", requireAdmin, memUpload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "geen afbeelding" });
  const s = await getSettings();
  s.loginImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  s.updatedAt = Date.now();
  await s.save();
  res.json({ success: true, image: s.loginImage });
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

app.get("/groups", requireAuth, async (req, res) => {
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

app.post("/groups", requireAuth, async (req, res) => {
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

app.post("/groups/join", requireAuth, async (req, res) => {
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

app.get("/groups/:id", requireAuth, async (req, res) => {
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

app.get("/groups/:id/messages", requireAuth, async (req, res) => {
  const g = await Group.findOne({ id: req.params.id });
  if (!g || !g.members.includes(req.username)) return res.status(403).json({ error: "geen toegang" });
  const msgs = await GroupMessage.find({ groupId: g.id }).sort({ time: 1 }).limit(200);
  res.json({ messages: msgs });
});

app.post("/groups/:id/leave", requireAuth, async (req, res) => {
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
app.post("/groups/:id/upload", requireAuth, (req, res) => {
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
app.post("/groups/:id/background", requireAuth, (req, res) => {
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
  // de achtergrond van de straat is voor iedereen die ingelogd is
  if (f.groupId !== STRAAT_BG_GROUP) {
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

/* ---------------------------- Maes-AI ----------------------------- */

app.get("/maes/info", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  res.json({
    trialEuro: TRIAL_EURO,
    maxEuro: MAX_EURO,
    spend: data.spend,
    pct: pctOf(data.spend),
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
    if (data.spend >= MAX_EURO) {
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

    slot.messages.push({ role: "user", content: storedContent });
    slot.messages.push({ role: "assistant", content: out.reply });
    if (slot.messages.length === 2) {
      slot.title = storedContent.substring(0, 28) + (storedContent.length > 28 ? "..." : "");
    }
    data.markModified("chats");
    await data.save();

    console.log(`[${username}] maes mode:${mode} model:${model} spent:EUR ${out.spend.toFixed(4)}`);
    res.json({ reply: out.reply, pct: out.pct });
  } catch (e) {
    console.error("chat error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/generate-image", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "geen prompt" });
    const data = await getUserData(req.username);
    if (data.spend >= MAX_EURO) return res.status(403).json({ error: "je krediet is op" });

    const response = await openai.images.generate({ model: "dall-e-2", prompt, n: 1, size: "512x512" });
    data.spend += 0.018 * 0.92;
    await data.save();
    res.json({ url: response.data[0].url, pct: pctOf(data.spend) });
  } catch (e) {
    console.error("image gen error:", e.message);
    res.status(500).json({ error: e.message });
  }
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
      pfp: data.pfp,
      spend: data.spend,
      pct: pctOf(data.spend),
    };
  }));
  list.sort((a, b) => {
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
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
  await Group.updateMany({ owner: oud }, { $set: { owner: nieuw } });
  await Group.updateMany(
    { members: oud },
    { $set: { "members.$[m]": nieuw } },
    { arrayFilters: [{ m: oud }] }
  );
  // tekeningen en teksten op de straat verwijzen ook naar de gebruikersnaam
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

const straatPresence = new Map();   // username -> { name, activity, at }

function broadcastPresence() {
  const now = Date.now();
  for (const [u, p] of straatPresence) if (now - p.at > 9000) straatPresence.delete(u);
  io.to("straat").emit("straat:presence", [...straatPresence.entries()].map(([u, p]) => ({
    username: u, displayName: p.name, activity: p.activity,
  })));
}
setInterval(broadcastPresence, 4000);

async function pushStraatItem(socket, item) {
  const date = todayKey();
  item.id = rid(8);
  item.u = socket.username;
  item.n = socket.displayName;
  item.ts = Date.now();
  await Straat.updateOne(
    { date },
    { $push: { items: item }, $addToSet: { contributors: socket.displayName }, $set: { updatedAt: Date.now() } },
    { upsert: true }
  );
  io.to("straat").emit("straat:item", item);
}

io.on("connection", (socket) => {

  /* ---- de straat ---- */
  socket.on("straat:join", async () => {
    socket.join("straat");
    const doc = await getStraat(todayKey());
    socket.emit("straat:state", { date: doc.date, items: doc.items, contributors: doc.contributors, bgPreset: doc.bgPreset, bgFileId: doc.bgFileId });
    broadcastPresence();
  });

  socket.on("straat:stroke", async (stroke) => {
    if (!stroke || !Array.isArray(stroke.pts) || stroke.pts.length < 1) return;
    const pts = stroke.pts.slice(0, 4000).map(p => [Math.round(p[0]), Math.round(p[1])]);
    await pushStraatItem(socket, {
      t: "s",
      pts,
      c: String(stroke.c || "#37352f").slice(0, 24),
      w: Math.min(Math.max(Number(stroke.w) || 3, 1), 48),
    });
  });

  socket.on("straat:text", async (t) => {
    const text = String((t && t.text) || "").trim();
    if (!text) return;
    await pushStraatItem(socket, {
      t: "x",
      text: text.slice(0, 240),
      x: Math.round(Number(t.x) || 0),
      y: Math.round(Number(t.y) || 0),
      c: String(t.c || "#37352f").slice(0, 24),
      s: Math.min(Math.max(Number(t.s) || 28, 10), 96),
    });
  });

  // publieke chat op de straat
  socket.on("straat:chat", async (text) => {
    const body = String(text || "").trim();
    if (!body) return;
    const msg = await StraatChat.create({
      id: rid(10),
      username: socket.username,
      displayName: socket.displayName,
      text: body.slice(0, 1000),
      time: Date.now(),
    });
    io.to("straat").emit("straat:chat", msg);

    // alleen de laatste STRAAT_CHAT_KEEP berichten bewaren
    const count = await StraatChat.countDocuments();
    if (count > STRAAT_CHAT_KEEP) {
      const oud = await StraatChat.find().sort({ time: 1 }).limit(count - STRAAT_CHAT_KEEP);
      await StraatChat.deleteMany({ _id: { $in: oud.map(o => o._id) } });
    }
  });

  socket.on("straat:chat-typing", (on) => {
    socket.to("straat").emit("straat:chat-typing", {
      username: socket.username, displayName: socket.displayName, on: !!on,
    });
  });

  // live "aan het typen / aan het tekenen" op de straat
  socket.on("straat:activity", (activity) => {
    straatPresence.set(socket.username, {
      name: socket.displayName,
      activity: activity === "typing" ? "typing" : activity === "drawing" ? "drawing" : "idle",
      at: Date.now(),
    });
    broadcastPresence();
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
    straatPresence.delete(socket.username);
    broadcastPresence();
  });
});

const HOST = process.env.RENDER ? "0.0.0.0" : "127.0.0.1";
const PORT = process.env.PORT || 3000;
server.listen(PORT, HOST, () => console.log(`drerries-ai running on ${HOST}:${PORT}`));
