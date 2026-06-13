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

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log("MongoDB connected"); syncUsersFromDB(); })
  .catch(e => console.error("MongoDB error:", e));

// Schemas
const UserDataSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  spend: { type: Number, default: 0 },
  chats: { type: Array, default: [] },
  pfp: { type: String, default: null },
});

const RoomSchema = new mongoose.Schema({
  id: String,
  username: String,
  displayName: String,
  text: String,
  time: Number,
});

const UserAuthSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  displayName: String,
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

const UserData = mongoose.model("UserData", UserDataSchema);
const RoomMessage = mongoose.model("RoomMessage", RoomSchema);
const UserAuth = mongoose.model("UserAuth", UserAuthSchema);
const Persona = mongoose.model("Persona", PersonaSchema);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const upload = multer({ dest: "uploads/", limits: { fileSize: 8 * 1024 * 1024 } });
const uploadPfp = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../frontend")));

const USERS = {
  dev: "proteine1234",
  drerrie2: "pass2",
  drerrie3: "pass3",
  drerrie4: "pass4",
  drerrie5: "pass5",
};

const NAMES = {
  dev: "Zi",
  drerrie2: "drerrie 2",
  drerrie3: "drerrie 3",
  drerrie4: "drerrie 4",
  drerrie5: "drerrie 5",
};

const tokens = {};
const MAX_EURO = 2.0;

async function syncUsersFromDB() {
  try {
    const dbUsers = await UserAuth.find();
    if (!dbUsers.length) {
      const seeds = Object.keys(USERS).map(u => ({ username: u, password: USERS[u], displayName: NAMES[u] || u }));
      await UserAuth.insertMany(seeds, { ordered: false }).catch(() => {});
    } else {
      dbUsers.forEach(u => {
        USERS[u.username] = u.password;
        NAMES[u.username] = u.displayName;
      });
    }
    console.log("users synced from DB:", Object.keys(USERS).join(", "));
  } catch (e) {
    console.error("syncUsersFromDB error:", e.message);
  }
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

function calcCostEuro(usage) {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
  return (inputCost + outputCost) * 0.92;
}

function newPassword() {
  return Math.random().toString(36).substring(2, 8);
}

function buildSystemPrompt(name) {
  return `Je bent drerries-ai, een slimme AI voor een kleine vriendengroep. Je antwoordt in gewoon, casual Nederlands. Niet formeel, niet stijf, gewoon zoals je een vriend een berichtje stuurt.

STIJL:
direct en kort, geen lange uitleg tenzij het echt nodig is
geen opsommingstekens, geen lijsten, gewoon praten
geen "hoe kan ik je helpen", geen assistent-energie
als je iets uitlegt, doe het simpel en to the point
kleine letters en weinig leestekens in casual berichten is ok

TAAL:
gewoon Nederlands, een paar losse woorden zijn ok als het natuurlijk vloeit
"patat" (nice/goed), "iyeee" (nice/wow), "drerrie" (vriend) zijn ok
geen zware dialect, geen afkortingen, geen straatslang
geen ge/gij of andere Vlaamse constructies

VERBODEN:
geen disclaimers of "als AI kan ik..."
geen vloekwoorden
geen geforceerde slang
niet over-uitleggen

REGELS:
1. geen rwina, niemand afmaken
2. geen snitchings, niks doorvertellen
3. begin elk nieuw gesprek altijd met: "iyeee daar ${name}"
4. geen streepjes of opsommingstekens
5. altijd kort tenzij de vraag om uitleg vraagt`;
}

function buildMoradScientificPrompt(name) {
  return `Je bent Morad, een speciale wetenschappelijke editie van drerries-ai voor ${name}.

KERNREGEL: drop formules en berekeningen onmiddellijk. geen inleiding, geen uitleg over de uitleg, direct de essentie.

AANPAK:
begin met "iyeee daar ${name}" dan meteen de kern
formules schrijf je direct, geen opbouw ernaartoe
lange redenering is ok maar houd de taal kort en strak
geen opsommingstekens, geen bullet points
als er een berekening nodig is, doe ze volledig en direct
gewone Nederlandse uitleg, geen slang

VERBODEN:
geen disclaimers
geen uitgebreide intro
geen herhaling van de vraag
geen vloekwoorden

REGELS:
1. geen rwina
2. geen snitchings
3. begin altijd met iyeee daar ${name}
4. drop formules meteen
5. redeneer volledig maar schrijf weinig`;
}

function buildFastAnswerPrompt() {
  return `You are FastAnswer, a direct homework answer bot. The user sends you a photo of homework, exercises or a textbook page.

YOUR ONLY JOB: look at what is literally in the image and give direct answers.

RULES:
- Answer only what is literally visible in the image. Never invent or assume.
- For each question, exercise or blank you see: give only the direct answer. No explanation unless the question explicitly asks for it.
- If you see a math problem: solve it and show only the result (and working if needed).
- If you see fill-in-the-blank: fill in the blank.
- If you see multiple choice: pick the answer.
- Keep answers as short as possible.

RETURN FORMAT - always return valid JSON like this:
{"answers": [{"label": "vraag 1", "answer": "direct antwoord", "area": "top"}, {"label": "vraag 2", "answer": "direct antwoord", "area": "middle"}]}

Use area: "top", "middle" or "bottom" based on where in the image the question appears.
If no image is provided, respond normally in Dutch, fast and direct, no fluff.`;
}

function requireAuth(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "Locked out g" });
  req.username = tokens[token];
  req.authToken = token;
  next();
}

function requireAdmin(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "nie geautoriseerd" });
  if (tokens[token] !== "dev") return res.status(403).json({ error: "alleen voor Zi g" });
  req.username = tokens[token];
  next();
}

// Auth
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const devBypass = process.env.DEV_PASSWORD && password === process.env.DEV_PASSWORD;
    if (devBypass || (USERS[username] && USERS[username] === password)) {
      const token = Math.random().toString(36).substring(2);
      tokens[token] = username;
      const data = await getUserData(username);
      const slots = data.chats.map(s => ({ id: s.id, title: s.title, empty: s.messages.length === 0 }));
      const pct = Math.min((data.spend / MAX_EURO) * 100, 100);
      res.json({ success: true, token, slots, username, pfp: data.pfp, isAdmin: username === "dev", pct });
    } else {
      res.json({ success: false });
    }
  } catch (e) {
    console.error("login error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get slots
app.get("/slots", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  const slots = data.chats.map(s => ({ id: s.id, title: s.title, empty: s.messages.length === 0 }));
  res.json({ slots });
});

// Get messages for a slot
app.get("/slots/:id", requireAuth, async (req, res) => {
  const slotId = parseInt(req.params.id);
  const data = await getUserData(req.username);
  const slot = data.chats.find(s => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "slot nie gevonden" });
  res.json({ messages: slot.messages });
});

// Clear a slot
app.post("/slots/:id/clear", requireAuth, async (req, res) => {
  const slotId = parseInt(req.params.id);
  const data = await getUserData(req.username);
  const slot = data.chats.find(s => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "slot nie gevonden" });
  slot.messages = [];
  slot.title = `chat ${slotId}`;
  data.markModified("chats");
  await data.save();
  res.json({ success: true });
});

// Get room messages
app.get("/room", requireAuth, async (req, res) => {
  const msgs = await RoomMessage.find().sort({ time: 1 }).limit(20);
  res.json({ messages: msgs });
});

// Delete room message (dev only)
app.delete("/room/:msgId", requireAuth, async (req, res) => {
  if (req.username !== "dev") return res.status(403).json({ error: "nie voor u g" });
  await RoomMessage.deleteOne({ id: req.params.msgId });
  io.emit("room:delete", req.params.msgId);
  res.json({ success: true });
});

const MODE_MODELS = {
  regular: "gpt-4o-mini",
  smart: "gpt-4o",
  morad: "gpt-4o",
  fastanswer: "gpt-4o-mini",
};

const MODE_MAX_TOKENS = {
  regular: 300,
  smart: 600,
  morad: 800,
  fastanswer: 600,
};

// Chat
app.post("/chat", requireAuth, upload.single("image"), async (req, res) => {
  try {
    const { message, slotId, mode = "regular", personaId } = req.body;
    const username = req.username;
    const name = NAMES[username] || username;

    const data = await getUserData(username);

    if (data.spend >= MAX_EURO) {
      const newPass = newPassword();
      USERS[username] = newPass;
      await UserAuth.updateOne({ username }, { password: newPass }).catch(() => {});
      delete tokens[req.authToken];
      return res.json({ reply: "ge zit op uw limiet broeder, vraag een nieuw wachtwoord aan Zi3600", locked: true });
    }

    const slot = data.chats.find(s => s.id === parseInt(slotId));
    if (!slot) return res.status(404).json({ error: "slot nie gevonden" });

    let persona = null;
    if (personaId) persona = await Persona.findOne({ id: personaId });

    let systemPrompt;
    if (persona) {
      systemPrompt = persona.systemPrompt || buildSystemPrompt(name);
      if (persona.greeting) systemPrompt += `\n\nbegin elk nieuw gesprek altijd met: "${persona.greeting}"`;
    } else if (mode === "morad") systemPrompt = buildMoradScientificPrompt(name);
    else if (mode === "fastanswer") systemPrompt = buildFastAnswerPrompt();
    else systemPrompt = buildSystemPrompt(name);

    const history = [{ role: "system", content: systemPrompt }];
    for (const m of slot.messages) {
      history.push({ role: m.role, content: m.content });
    }

    let userMessage;
    let storedContent;
    const isFastAnswerImage = mode === "fastanswer" && req.file;

    if (req.file) {
      const imageData = fs.readFileSync(req.file.path);
      const base64Image = imageData.toString("base64");
      const mimeType = req.file.mimetype;
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: isFastAnswerImage ? "geef direct antwoorden op alles wat je ziet in deze afbeelding. return JSON." : (message || "wat is dit?") },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      };
      storedContent = message ? `[foto] ${message}` : "[foto]";
      fs.unlinkSync(req.file.path);
    } else {
      userMessage = { role: "user", content: message };
      storedContent = message;
    }

    history.push(userMessage);

    const model = persona ? persona.model : (MODE_MODELS[mode] || "gpt-4o-mini");
    const maxTokens = persona ? persona.maxTokens : (MODE_MAX_TOKENS[mode] || 300);

    const completion = await openai.chat.completions.create({
      model,
      messages: history,
      max_tokens: maxTokens,
      ...(isFastAnswerImage ? { response_format: { type: "json_object" } } : {}),
    });

    const reply = completion.choices[0].message.content;

    slot.messages.push({ role: "user", content: storedContent });
    slot.messages.push({ role: "assistant", content: reply });

    if (slot.messages.length === 2) {
      slot.title = storedContent.substring(0, 28) + (storedContent.length > 28 ? "..." : "");
    }

    data.markModified("chats");

    const cost = calcCostEuro(completion.usage);
    data.spend += cost;
    await data.save();

    const pct = Math.min((data.spend / MAX_EURO) * 100, 100);
    console.log(`[${username}] mode:${mode} model:${model} slot:${slotId} spent:€${data.spend.toFixed(4)}`);

    res.json({ reply, pct, isAnnotation: isFastAnswerImage });
  } catch (e) {
    console.error("chat error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Image generation
app.post("/generate-image", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "geen prompt" });
    const data = await getUserData(req.username);
    if (data.spend >= MAX_EURO) return res.status(403).json({ error: "limiet bereikt" });

    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt,
      n: 1,
      size: "512x512",
    });

    const imageCost = 0.018 * 0.92;
    data.spend += imageCost;
    await data.save();

    const pct = Math.min((data.spend / MAX_EURO) * 100, 100);
    res.json({ url: response.data[0].url, pct });
  } catch (e) {
    console.error("image gen error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Admin — list users
app.get("/admin/users", requireAdmin, async (req, res) => {
  const list = await Promise.all(Object.keys(USERS).map(async u => {
    const data = await getUserData(u);
    return { username: u, displayName: NAMES[u] || u, pfp: data.pfp, spend: data.spend };
  }));
  res.json({ users: list });
});

// Admin — change password
app.post("/admin/users/:username/password", requireAdmin, async (req, res) => {
  const { username } = req.params;
  const { password } = req.body;
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  USERS[username] = password;
  await UserAuth.updateOne({ username }, { password });
  res.json({ success: true });
});

// Admin — change display name
app.post("/admin/users/:username/name", requireAdmin, async (req, res) => {
  const { username } = req.params;
  const { name } = req.body;
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  NAMES[username] = name;
  await UserAuth.updateOne({ username }, { displayName: name });
  res.json({ success: true });
});

// Admin — upload pfp (stored as base64 in MongoDB)
app.post("/admin/users/:username/pfp", requireAdmin, uploadPfp.single("pfp"), async (req, res) => {
  const { username } = req.params;
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  if (!req.file) return res.status(400).json({ error: "geen foto" });
  const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const data = await getUserData(username);
  data.pfp = base64;
  await data.save();
  res.json({ success: true, pfp: base64 });
});

// Admin — reset spend
app.post("/admin/users/:username/reset-spend", requireAdmin, async (req, res) => {
  const data = await getUserData(req.params.username);
  data.spend = 0;
  await data.save();
  res.json({ success: true });
});

// Admin — create user
app.post("/admin/users", requireAdmin, async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username en wachtwoord verplicht" });
  if (USERS[username]) return res.status(400).json({ error: "bestaat al g" });
  USERS[username] = password;
  NAMES[username] = displayName || username;
  await UserAuth.create({ username, password, displayName: displayName || username }).catch(() => {});
  res.json({ success: true });
});

// Admin — delete user
app.delete("/admin/users/:username", requireAdmin, async (req, res) => {
  const { username } = req.params;
  if (username === "dev") return res.status(400).json({ error: "ge kunt uzelf nie verwijderen g" });
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  delete USERS[username];
  delete NAMES[username];
  await UserData.deleteOne({ username });
  await UserAuth.deleteOne({ username });
  res.json({ success: true });
});

// Personas — list (for all users)
app.get("/personas", requireAuth, async (req, res) => {
  const list = await Persona.find({}, { pfp: 1, id: 1, name: 1, model: 1, maxTokens: 1, canGenerateImages: 1, greeting: 1, _id: 0 });
  res.json({ personas: list });
});

// Admin — list personas (with systemPrompt)
app.get("/admin/personas", requireAdmin, async (req, res) => {
  const list = await Persona.find();
  res.json({ personas: list });
});

// Admin — create persona
app.post("/admin/personas", requireAdmin, async (req, res) => {
  const { name, model, maxTokens, canGenerateImages, greeting, systemPrompt } = req.body;
  if (!name) return res.status(400).json({ error: "naam verplicht" });
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
  try {
    const p = await Persona.create({ id, name, model: model || "gpt-4o-mini", maxTokens: parseInt(maxTokens) || 300, canGenerateImages: canGenerateImages !== false && canGenerateImages !== "false", greeting: greeting || "", systemPrompt: systemPrompt || "" });
    res.json({ success: true, persona: p });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin — update persona
app.put("/admin/personas/:id", requireAdmin, async (req, res) => {
  const { name, model, maxTokens, canGenerateImages, greeting, systemPrompt } = req.body;
  await Persona.updateOne({ id: req.params.id }, { name, model, maxTokens: parseInt(maxTokens), canGenerateImages: canGenerateImages === true || canGenerateImages === "true", greeting, systemPrompt });
  res.json({ success: true });
});

// Admin — upload persona pfp
app.post("/admin/personas/:id/pfp", requireAdmin, uploadPfp.single("pfp"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "geen foto" });
  const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  await Persona.updateOne({ id: req.params.id }, { pfp: base64 });
  res.json({ success: true, pfp: base64 });
});

// Admin — delete persona
app.delete("/admin/personas/:id", requireAdmin, async (req, res) => {
  await Persona.deleteOne({ id: req.params.id });
  res.json({ success: true });
});

// Get own pfp + current spend %
app.get("/me/pfp", requireAuth, async (req, res) => {
  const data = await getUserData(req.username);
  const pct = Math.min((data.spend / MAX_EURO) * 100, 100);
  res.json({ pfp: data.pfp || null, pct });
});

// Socket.io — chatroom
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token || !tokens[token]) return next(new Error("ongeautoriseerd"));
  socket.username = tokens[token];
  socket.displayName = NAMES[tokens[token]] || tokens[token];
  next();
});

io.on("connection", (socket) => {
  socket.on("room:message", async (text) => {
    if (!text || !text.trim()) return;
    const count = await RoomMessage.countDocuments();
    if (count >= 20) {
      const oldest = await RoomMessage.findOne().sort({ time: 1 });
      if (oldest) {
        io.emit("room:delete", oldest.id);
        await oldest.deleteOne();
      }
    }
    const msg = new RoomMessage({
      id: Math.random().toString(36).substring(2),
      username: socket.username,
      displayName: socket.displayName,
      text: text.trim(),
      time: Date.now(),
    });
    await msg.save();
    io.emit("room:message", msg);
  });
});

const HOST = process.env.RENDER ? "0.0.0.0" : "127.0.0.1";
server.listen(3000, HOST, () => console.log(`drerries-ai running on port 3000 (${HOST})`));
