const express = require("express");
const cors = require("cors");
const multer = require("multer");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const fs = require("fs");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

const sessions = {};

const USERS = {
  drerrie1: "pass1",
  drerrie2: "pass2",
  drerrie3: "pass3",
  drerrie4: "pass4",
  drerrie5: "pass5",
};

const tokens = {};

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (USERS[username] && USERS[username] === password) {
    const token = Math.random().toString(36).substring(2);
    tokens[token] = username;
    res.json({ success: true, token });
  } else {
    res.json({ success: false });
  }
});

function requireAuth(req, res, next) {
  const token = req.headers["x-auth-token"];
  if (!token || !tokens[token]) return res.status(401).json({ error: "Locked out g" });
  next();
}

const SYSTEM_PROMPT = `You are Abdel AI, a chill and helpful homework assistant.
You explain things in a casual, friendly way that's easy to understand.
You break concepts down simply, use relatable examples, and never sound like a textbook.
Keep it real, keep it clear, and make sure the person actually gets it.`;

app.post("/chat", requireAuth, upload.single("image"), async (req, res) => {
  const { message, sessionId } = req.body;

  if (!sessions[sessionId]) {
    sessions[sessionId] = [{ role: "system", content: SYSTEM_PROMPT }];
  }

  const history = sessions[sessionId];
  let userMessage;

  if (req.file) {
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString("base64");
    const mimeType = req.file.mimetype;

    userMessage = {
      role: "user",
      content: [
        { type: "text", text: message || "What is this?" },
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64Image}` },
        },
      ],
    };

    fs.unlinkSync(req.file.path);
  } else {
    userMessage = { role: "user", content: message };
  }

  history.push(userMessage);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: history,
  });

  const reply = completion.choices[0].message.content;
  history.push({ role: "assistant", content: reply });

  res.json({ reply });
});

app.listen(3000, () => console.log("Abdel AI running on port 3000"));
