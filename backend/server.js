const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const upload = multer({ dest: "uploads/" });
const uploadPfp = multer({ dest: "pfps/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use("/pfps", express.static("pfps"));
app.use(express.static(require("path").join(__dirname, "../frontend")));

const USERS = {
  drerrie1: "pass1",
  drerrie2: "pass2",
  drerrie3: "pass3",
  drerrie4: "pass4",
  drerrie5: "pass5",
};

const NAMES = {
  drerrie1: "Zi",
  drerrie2: "drerrie 2",
  drerrie3: "drerrie 3",
  drerrie4: "drerrie 4",
  drerrie5: "drerrie 5",
};

const tokens = {};
const MAX_EURO = 2.0;
const SPEND_FILE = "spend.json";
const CHATS_FILE = "chats.json";
const ROOM_FILE = "room.json";
const PFPS_FILE = "pfps.json";

if (!fs.existsSync("pfps")) fs.mkdirSync("pfps");

function loadJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file)); } catch { return fallback !== undefined ? fallback : {}; }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const userSpend = loadJSON(SPEND_FILE);
const userChats = loadJSON(CHATS_FILE);
let roomMessages = loadJSON(ROOM_FILE, []);
const userPfps = loadJSON(PFPS_FILE);

function requireAdmin(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "nie geautoriseerd" });
  if (tokens[token] !== "drerrie1") return res.status(403).json({ error: "alleen voor Zi g" });
  req.username = tokens[token];
  next();
}

function calcCostEuro(usage) {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
  const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
  return (inputCost + outputCost) * 0.92;
}

function newPassword() {
  return Math.random().toString(36).substring(2, 8);
}

function savePasswords() {
  const lines = Object.entries(USERS).map(([u, p]) => `${u}: ${p}`).join("\n");
  fs.writeFileSync("passwords.txt", lines);
}

function buildSystemPrompt(name) {
  return `ge zijt Morad, de AI van drerries-ai. ge zijt die ene s7ab die altijd uitleg geeft zoals een echte broer dat zou doen. geen assistent-energie, geen service desk vibes. gewoon aanwezig, warm, heeft uw rug.

GOUDEN REGEL — lees dit eerst:
slang is kruiding, nie het eten. gebruik het alleen als het natuurlijk vloeit. als een zin properder klinkt in gewoon nederlands, laat het gewoon gewoon. één natuurlijke wesh slaat beter dan drie geforceerde. de broederlijke toon en warmte tellen meer dan slang quotas. een antwoord zonder slang maar met de juiste vibe land altijd.

TAAL — ge/gij skelet (vlaams/belgisch, leesbaar voor heel BE en NL):
gebruik "ge/gij" ipv "jij/je" → "wa zegde gij", "hebde gij dat gezien"
gebruik "wa" voor "wat" → "wa doede", "wa is er"
ge-werkwoorden → "zegde", "hebde", "kunde", "moete"
vlaamse constructies → "da's", "ni/nie" (niet), "ik zweer u", "em/m" (hem)
geen zware dialectwoorden → geen zenne, awel, amai, allei, sebiet

WOORDENSCHAT — gebruik wanneer het vloeit, niet altijd:
aanspreekvormen: drerrie, sa7bi, niffo, broer, neef, baas, koning, soldaat
bevestiging: kzeg u g, echt, serieus, facts, no cap
uitroep/vraag: wesh
toestand: skeer, patat, iyeee, bizar, ghaataarr, lijp, hard
chill: sahla, kalm
algemeen: fissa, tori, doekoe, lowkey, highkey, mid
geen tiktok-woorden van deze week — die zijn snel gedateerd

GRAMMATICA die het verkoopt:
gaan/pakken/krijgen constructies → "ga me ni stressen", "ge gaat zien"
de/het collapse → "die probleem", "deze ding"
korte bursts, geen paragrafen — dm energie: kleine letters, weinig leestekens
code-switch vrij tussen gewoon nl, ge/gij en slang mid-message — dat is natuurlijk

PERSOONLIJKHEID:
broer, niet assistent — geen "hoe kan ik je helpen", geen "hier zijn 3 tips"
warm en loyaal — "ik snap u", "kga u helpen drerrie"
kan gechill zijn, licht roasten, hypen — reageert zoals een vriend
weet wanneer het serieus wordt — voor school/werk zaken dropped het de slang en praat gewoon. echte drerries doen dit ook.

VERBODEN:
geen disclaimers, geen "als ai kan ik..."
geen perfecte hoofdletters en leestekens in casual replies
geen geforceerde slang in elke zin
geen lange lijsten als twee zinnen genoeg zijn
niet over-uitleggen — antwoord als een vriend die sms't, dan stoppen

REGELS:
1. geen rwina — niemand afmaken, positief blijven
2. geen snitchings — niks doorvertellen
3. begin elk nieuw gesprek altijd met: "iyeee daar ${name}"
4. gebruik nooit streepjes of opsommingstekens
5. geen vloekwoorden
6. altijd kort en to the point
7. leg uit zoals ge het aan uw beste s7ab uitlegt die er niks van weet`;
}

function requireAuth(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "Locked out g" });
  req.username = tokens[token];
  req.authToken = token;
  next();
}

function getSlots(username) {
  if (!userChats[username]) {
    userChats[username] = [
      { id: 1, title: "chat 1", messages: [] },
      { id: 2, title: "chat 2", messages: [] },
      { id: 3, title: "chat 3", messages: [] },
    ];
    saveJSON(CHATS_FILE, userChats);
  }
  return userChats[username];
}

// Auth
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const devBypass = process.env.DEV_PASSWORD && password === process.env.DEV_PASSWORD;
  if (devBypass || (USERS[username] && USERS[username] === password)) {
    const token = Math.random().toString(36).substring(2);
    tokens[token] = username;
    const slots = getSlots(username).map(s => ({ id: s.id, title: s.title, empty: s.messages.length === 0 }));
    res.json({ success: true, token, slots, username, pfp: userPfps[username] || null, isAdmin: username === "drerrie1" });
  } else {
    res.json({ success: false });
  }
});

// Get slots
app.get("/slots", requireAuth, (req, res) => {
  const slots = getSlots(req.username).map(s => ({ id: s.id, title: s.title, empty: s.messages.length === 0 }));
  res.json({ slots });
});

// Get messages for a slot
app.get("/slots/:id", requireAuth, (req, res) => {
  const slotId = parseInt(req.params.id);
  const slots = getSlots(req.username);
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "slot nie gevonden" });
  res.json({ messages: slot.messages });
});

// Clear a slot
app.post("/slots/:id/clear", requireAuth, (req, res) => {
  const slotId = parseInt(req.params.id);
  const slots = getSlots(req.username);
  const slot = slots.find(s => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "slot nie gevonden" });
  slot.messages = [];
  slot.title = `chat ${slotId}`;
  saveJSON(CHATS_FILE, userChats);
  res.json({ success: true });
});

// Get room messages
app.get("/room", requireAuth, (req, res) => {
  res.json({ messages: roomMessages });
});

// Delete room message (drerrie1 only)
app.delete("/room/:msgId", requireAuth, (req, res) => {
  if (req.username !== "drerrie1") return res.status(403).json({ error: "nie voor u g" });
  roomMessages = roomMessages.filter(m => m.id !== req.params.msgId);
  saveJSON(ROOM_FILE, roomMessages);
  io.emit("room:delete", req.params.msgId);
  res.json({ success: true });
});

// Chat
app.post("/chat", requireAuth, upload.single("image"), async (req, res) => {
  const { message, slotId } = req.body;
  const username = req.username;
  const name = NAMES[username] || username;

  if (!userSpend[username]) userSpend[username] = 0;

  if (userSpend[username] >= MAX_EURO) {
    const newPass = newPassword();
    USERS[username] = newPass;
    savePasswords();
    delete tokens[req.authToken];
    return res.json({ reply: "ge zit op uw limiet broeder, vraag een nieuw wachtwoord aan Zi3600", locked: true });
  }

  const slots = getSlots(username);
  const slot = slots.find(s => s.id === parseInt(slotId));
  if (!slot) return res.status(404).json({ error: "slot nie gevonden" });

  const history = [{ role: "system", content: buildSystemPrompt(name) }];
  for (const m of slot.messages) {
    history.push({ role: m.role, content: m.content });
  }

  let userMessage;
  let storedContent;

  if (req.file) {
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString("base64");
    const mimeType = req.file.mimetype;
    userMessage = {
      role: "user",
      content: [
        { type: "text", text: message || "wat is dit?" },
        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      ],
    };
    storedContent = message || "wat is dit?";
    fs.unlinkSync(req.file.path);
  } else {
    userMessage = { role: "user", content: message };
    storedContent = message;
  }

  history.push(userMessage);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: history,
    max_tokens: 300,
  });

  const reply = completion.choices[0].message.content;

  slot.messages.push({ role: "user", content: storedContent });
  slot.messages.push({ role: "assistant", content: reply });

  if (slot.messages.length === 2) {
    slot.title = storedContent.substring(0, 28) + (storedContent.length > 28 ? "..." : "");
  }

  saveJSON(CHATS_FILE, userChats);

  const cost = calcCostEuro(completion.usage);
  userSpend[username] += cost;
  saveJSON(SPEND_FILE, userSpend);

  const pct = Math.min((userSpend[username] / MAX_EURO) * 100, 100);
  console.log(`[${username}] slot ${slotId} | spent: €${userSpend[username].toFixed(4)}`);

  res.json({ reply, pct });
});

// Admin — list users
app.get("/admin/users", requireAdmin, (req, res) => {
  const list = Object.keys(USERS).map(u => ({
    username: u,
    displayName: NAMES[u] || u,
    pfp: userPfps[u] || null,
    spend: userSpend[u] || 0,
  }));
  res.json({ users: list });
});

// Admin — change password
app.post("/admin/users/:username/password", requireAdmin, (req, res) => {
  const { username } = req.params;
  const { password } = req.body;
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  USERS[username] = password;
  savePasswords();
  res.json({ success: true });
});

// Admin — change display name
app.post("/admin/users/:username/name", requireAdmin, (req, res) => {
  const { username } = req.params;
  const { name } = req.body;
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  NAMES[username] = name;
  res.json({ success: true });
});

// Admin — upload pfp
app.post("/admin/users/:username/pfp", requireAdmin, uploadPfp.single("pfp"), (req, res) => {
  const { username } = req.params;
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  if (!req.file) return res.status(400).json({ error: "geen foto" });
  const ext = req.file.originalname.split(".").pop();
  const filename = `${username}.${ext}`;
  const dest = `pfps/${filename}`;
  if (userPfps[username]) {
    try { fs.unlinkSync(userPfps[username].replace("/pfps/", "pfps/")); } catch {}
  }
  fs.renameSync(req.file.path, dest);
  userPfps[username] = `/pfps/${filename}`;
  saveJSON(PFPS_FILE, userPfps);
  res.json({ success: true, pfp: userPfps[username] });
});

// Admin — reset spend
app.post("/admin/users/:username/reset-spend", requireAdmin, (req, res) => {
  const { username } = req.params;
  userSpend[username] = 0;
  saveJSON(SPEND_FILE, userSpend);
  res.json({ success: true });
});

// Admin — create user
app.post("/admin/users", requireAdmin, (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username en wachtwoord verplicht" });
  if (USERS[username]) return res.status(400).json({ error: "bestaat al g" });
  USERS[username] = password;
  NAMES[username] = displayName || username;
  savePasswords();
  res.json({ success: true });
});

// Admin — delete user
app.delete("/admin/users/:username", requireAdmin, (req, res) => {
  const { username } = req.params;
  if (username === "drerrie1") return res.status(400).json({ error: "ge kunt uzelf nie verwijderen g" });
  if (!USERS[username]) return res.status(404).json({ error: "user nie gevonden" });
  delete USERS[username];
  delete NAMES[username];
  delete userSpend[username];
  delete userChats[username];
  delete userPfps[username];
  saveJSON(SPEND_FILE, userSpend);
  saveJSON(CHATS_FILE, userChats);
  saveJSON(PFPS_FILE, userPfps);
  savePasswords();
  res.json({ success: true });
});

// Get own pfp
app.get("/me/pfp", requireAuth, (req, res) => {
  res.json({ pfp: userPfps[req.username] || null });
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
  socket.on("room:message", (text) => {
    if (!text || !text.trim()) return;
    const msg = {
      id: Math.random().toString(36).substring(2),
      username: socket.username,
      displayName: socket.displayName,
      text: text.trim(),
      time: Date.now(),
    };
    roomMessages.push(msg);
    if (roomMessages.length > 20) {
      const removed = roomMessages.shift();
      io.emit("room:delete", removed.id);
    }
    saveJSON(ROOM_FILE, roomMessages);
    io.emit("room:message", msg);
  });
});

const HOST = process.env.RENDER ? "0.0.0.0" : "127.0.0.1";
server.listen(3000, HOST, () => console.log(`drerries-ai running on port 3000 (${HOST})`));
