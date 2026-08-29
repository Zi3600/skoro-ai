/* ------------------------------------------------------------------ *
 *  drerries-ai — client
 * ------------------------------------------------------------------ */

const BACKEND = location.protocol === "file:" ? "https://skoro-ai.onrender.com" : location.origin;

let token = localStorage.getItem("token");
if (!token) location.replace("index.html");

let me = {
  username: localStorage.getItem("username") || "",
  displayName: localStorage.getItem("displayName") || "",
  isAdmin: localStorage.getItem("isAdmin") === "1",
  pfp: null,
};

let socket = null;
let groups = [];
let activeGroupId = null;
let activeSlot = 1;
let slots = [];

/* ---------------------------- utilities --------------------------- */

const $ = id => document.getElementById(id);

function api(path, opts = {}) {
  const headers = Object.assign({ "x-auth-token": token }, opts.headers || {});
  if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(opts.json);
    opts.method = opts.method || "POST";
  }
  return fetch(BACKEND + path, Object.assign({}, opts, { headers })).then(async res => {
    if (res.status === 401) { hardLogout(); throw new Error("niet ingelogd"); }
    const ct = res.headers.get("content-type") || "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) throw new Error((data && data.error) || "er ging iets mis");
    return data;
  });
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/);
  return ((parts[0] || "?")[0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

const AV_COLORS = ["#1a8fd4", "#2f9a52", "#d9a300", "#d33a3a", "#7a5ad6", "#e07b2a", "#c0399b"];
function avatarColor(key) {
  let h = 0;
  for (const ch of String(key || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

// bestanden ophalen met de token in de header, niet in de URL
const fileUrlCache = new Map();
async function fileUrl(fileId) {
  if (fileUrlCache.has(fileId)) return fileUrlCache.get(fileId);
  const res = await fetch(`${BACKEND}/files/${fileId}`, { headers: { "x-auth-token": token } });
  if (!res.ok) throw new Error("kon bestand niet laden");
  const url = URL.createObjectURL(await res.blob());
  fileUrlCache.set(fileId, url);
  return url;
}

function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateLong(key) {
  const [y, m, dd] = key.split("-").map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString("nl-BE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function todayKey() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Brussels" });
}

function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 180) + "px";
}

/* ------------------------------ iconen ---------------------------- */
/* Zet een bestand in frontend/icons/ met de naam van een slot en het
   vervangt automatisch de emoji. Bv. icons/straat.png -> data-icon="straat".
   Slots: straat archief groepen nieuwe-groep code maes chat instellingen
          beheer uitloggen tekenen typen ongedaan leegmaken afbeelding bestand */

let ICONS = {};

async function loadIcons() {
  try {
    const data = await api("/api/icons");
    ICONS = data.icons || {};
  } catch (e) { ICONS = {}; }
  applyIcons();
}

// vervangt elke <span data-icon="naam">emoji</span> door het geüploade plaatje
function applyIcons(root) {
  if (!Object.keys(ICONS).length) return;
  (root || document).querySelectorAll("[data-icon]").forEach(el => {
    const src = ICONS[el.dataset.icon];
    if (!src || el.dataset.iconDone === src) return;
    el.dataset.iconDone = src;
    el.innerHTML = "";
    const img = document.createElement("img");
    img.className = "icon-img";
    img.src = src;
    img.alt = "";
    el.appendChild(img);
  });
}

/* ------------------------------ theme ----------------------------- */

function applyTheme() {
  const dark = localStorage.getItem("darkMode") === "1";
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const btn = $("theme-btn");
  if (btn) btn.textContent = dark ? "uitzetten" : "aanzetten";
}
function toggleTheme() {
  localStorage.setItem("darkMode", localStorage.getItem("darkMode") === "1" ? "0" : "1");
  applyTheme();
  redrawStraat();
}
applyTheme();

/* ------------------------------ sidebar --------------------------- */

function openSidebar() { $("sidebar").classList.add("open"); $("scrim").classList.add("on"); }
function closeSidebar() { $("sidebar").classList.remove("open"); $("scrim").classList.remove("on"); }

let myBudget = 0.25;   // groeit mee met wat je in Code Heist verdient

function setCredit(pct, budget) {
  if (budget) myBudget = budget;
  if (pct === undefined || pct === null) return;
  const bar = $("credit-bar");
  bar.style.width = Math.min(pct, 100) + "%";
  bar.style.background = pct < 55 ? "var(--green)" : pct < 85 ? "var(--yellow)" : "var(--red)";
  // in centen tonen, anders zie je niet dat een gehaalde heist er krediet bij zet
  const overCent = Math.max(0, myBudget * (1 - Math.min(pct, 100) / 100) * 100);
  $("credit-label").textContent = overCent.toFixed(overCent < 10 ? 1 : 0) + " cent over";
  const sb = $("settings-bar");
  if (sb) {
    sb.style.width = Math.min(pct, 100) + "%";
    sb.style.background = bar.style.background;
    $("settings-credit").textContent = Math.round(Math.min(pct, 100)) + "% gebruikt";
  }
}

function paintAvatar(el, name, pfp) {
  if (!el) return;
  if (pfp) { el.innerHTML = `<img src="${esc(pfp)}" alt="" />`; el.style.background = "transparent"; }
  else { el.textContent = initials(name); el.style.background = avatarColor(name); }
}

/* ------------------------------ routing --------------------------- */

const VIEWS = ["straat", "archief", "archiefdag", "groepen", "groep", "maes", "heist", "instellingen", "beheer"];

function go(hash) { closeSidebar(); if (location.hash === hash) route(); else location.hash = hash; }

function showView(name) {
  VIEWS.forEach(v => { const el = $("v-" + v); if (el) el.hidden = v !== name; });
  document.querySelectorAll(".sb-item[data-route]").forEach(b => {
    b.classList.toggle("active", b.dataset.route === name);
  });
  document.querySelectorAll(".sb-item[data-group]").forEach(b => b.classList.remove("active"));
}

function crumb(parts) {
  $("crumb").innerHTML = parts.map((p, i) =>
    (i ? '<span class="sep">/</span>' : "") + `<span class="${i < parts.length - 1 ? "dim" : ""}">${esc(p)}</span>`
  ).join("");
}

function route() {
  const h = location.hash.replace(/^#\/?/, "") || "straat";
  const [head, arg] = h.split("/");
  $("topbar-actions").innerHTML = "";
  if (head !== "groep") activeGroupId = null;

  if (head === "archief" && arg) { showView("archiefdag"); crumb(["archief", arg]); openArchiefDag(arg); return; }
  if (head === "archief") { showView("archief"); crumb(["archief"]); loadArchief(); return; }
  if (head === "groepen") { showView("groepen"); crumb(["groepen"]); renderGroups(); return; }
  if (head === "groep" && arg) { showView("groep"); openGroup(arg); return; }
  if (head === "maes") { showView("maes"); crumb(["Maes-AI"]); openMaes(); return; }
  if (head === "heist") { showView("heist"); crumb(["Code Heist"]); openHeist(); return; }
  if (head === "instellingen") { showView("instellingen"); crumb(["instellingen"]); openSettings(); return; }
  if (head === "beheer") { showView("beheer"); crumb(["beheer"]); loadAdmin(); return; }

  showView("straat");
  crumb(["straat"]);
  if (me.isAdmin) {
    $("topbar-actions").innerHTML =
      '<button class="btn ghost sm" onclick="openBackgroundPicker(\'straat\', null)">achtergrond</button>';
  }
  openStraat();
}

window.addEventListener("hashchange", route);

/* -------------------------------- boot ---------------------------- */

async function boot() {
  try {
    const info = await api("/me");
    me = { username: info.username, displayName: info.displayName, isAdmin: info.isAdmin, pfp: info.pfp };
    localStorage.setItem("displayName", me.displayName);
    localStorage.setItem("isAdmin", me.isAdmin ? "1" : "0");
  } catch (e) { return; }

  $("me-name").textContent = me.displayName;
  $("me-sub").textContent = me.isAdmin ? "beheerder" : me.username;
  paintAvatar($("me-av"), me.displayName, me.pfp);
  if (me.isAdmin) { $("sb-beheer").hidden = false; $("clear-tool").hidden = false; }
  setCredit(0);
  api("/me").then(i => setCredit(i.pct, i.budget)).catch(() => {});

  initSocket();
  await loadIcons();
  await loadGroups();
  route();
}

function initSocket() {
  socket = io(BACKEND, { auth: { token } });

  socket.on("straat:state", onStraatState);
  socket.on("straat:item", onStraatItem);
  socket.on("straat:presence", renderPresence);
  socket.on("straat:background", bg => applyStraatBackground(bg));
  socket.on("group:background", onGroupBackground);
  socket.on("straat:cleared", () => { straatItems = []; redrawStraat(); updateStraatFoot([]); });

  socket.on("straat:chat", onStraatChat);
  socket.on("straat:chat-typing", onStraatChatTyping);

  socket.on("group:message", onGroupMessage);
  socket.on("group:typing", onGroupTyping);
  socket.on("group:maes-typing", onMaesTyping);
  socket.on("group:members", () => { if (activeGroupId) loadGroups(); });

  socket.on("credit:update", d => setCredit(d.pct));
  socket.on("connect_error", () => toast("verbinding met de server kwijt"));
}

function hardLogout() {
  localStorage.removeItem("token");
  location.replace("index.html");
}

async function logout() {
  try { await api("/logout", { method: "POST" }); } catch (e) {}
  hardLogout();
}

/* ================================================================== *
 *  DE STRAAT — dagelijkse tekening + typen
 * ================================================================== */

const CANVAS_W = 1600, CANVAS_H = 900;
const PALETTE = ["#37352f", "#2383e2", "#0f7b6c", "#cb912f", "#e03e3e", "#6940a5", "#d9730d", "#ffffff"];
const SIZES = [2, 4, 8, 16];

let straatItems = [];
let straatBg = { bgPreset: "", bgFileId: null };
let straatBgImage = null;
let straatJoined = false;
let tool = "pen";
let penColor = "#37352f";
let penSize = 4;
let drawing = false;
let currentPts = [];
let textPos = null;
let activityTimer = null;

const canvas = $("straat-canvas");
const ctx = canvas.getContext("2d");

function buildToolbar() {
  $("swatches").innerHTML = PALETTE.map(c =>
    `<button class="swatch${c === penColor ? " on" : ""}" data-c="${c}" style="background:${c}" title="${c}"></button>`
  ).join(" ");
  $("swatches").querySelectorAll(".swatch").forEach(b => {
    b.onclick = () => {
      penColor = b.dataset.c;
      $("swatches").querySelectorAll(".swatch").forEach(x => x.classList.toggle("on", x === b));
    };
  });

  $("sizes").innerHTML = SIZES.map(s =>
    `<button class="size-dot${s === penSize ? " on" : ""}" data-s="${s}"><i style="width:${Math.min(s + 2, 14)}px;height:${Math.min(s + 2, 14)}px"></i></button>`
  ).join("");
  $("sizes").querySelectorAll(".size-dot").forEach(b => {
    b.onclick = () => {
      penSize = Number(b.dataset.s);
      $("sizes").querySelectorAll(".size-dot").forEach(x => x.classList.toggle("on", x === b));
    };
  });
}
buildToolbar();

function setTool(t) {
  tool = t;
  $("tool-pen").classList.toggle("on", t === "pen");
  $("tool-text").classList.toggle("on", t === "text");
  $("canvas-wrap").classList.toggle("text-mode", t === "text");
  if (t !== "text") hideCaret();
}

let presenceHeartbeat = null;
function openStraat() {
  if (!socket) return;
  socket.emit("straat:join");
  socket.emit("straat:activity", "idle");
  straatJoined = true;
  $("straat-live").hidden = false;
  loadStraatChat();
  // laat de anderen zien dat je meekijkt zolang je op de straat staat
  clearInterval(presenceHeartbeat);
  presenceHeartbeat = setInterval(() => {
    if ($("v-straat").hidden) { clearInterval(presenceHeartbeat); return; }
    if (drawing || caret.style.display === "block") return;   // niet overschrijven tijdens tekenen/typen
    socket.emit("straat:activity", "idle");
  }, 5000);
}

function onStraatState(state) {
  straatItems = state.items || [];
  applyStraatBackground({ bgPreset: state.bgPreset, bgFileId: state.bgFileId });
  $("straat-sub").textContent =
    `${fmtDateLong(state.date)} — iedereen tekent en typt hier live mee. morgen begint een nieuwe en gaat deze naar het archief.`;
  redrawStraat();
  updateStraatFoot(state.contributors || []);
}

function onStraatItem(item) {
  straatItems.push(item);
  drawItem(ctx, item, CANVAS_W, CANVAS_H);
  $("straat-count").textContent = countLabel(straatItems);
}

function countLabel(items) {
  const s = items.filter(i => i.t === "s").length;
  const x = items.filter(i => i.t === "x").length;
  return `${s} lijn${s === 1 ? "" : "en"} · ${x} tekst${x === 1 ? "" : "en"}`;
}

function updateStraatFoot(contribs) {
  $("straat-count").textContent = countLabel(straatItems);
  $("straat-contribs").textContent = contribs.length ? "vandaag: " + contribs.join(", ") : "nog niemand vandaag";
}

function clearCanvas(c, w, h, bg) {
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, w, h);
  if (!bg) return;
  if (bg.image && bg.image.complete && bg.image.naturalWidth) {
    // vullen zonder de verhoudingen te vervormen
    const s = Math.max(w / bg.image.naturalWidth, h / bg.image.naturalHeight);
    const iw = bg.image.naturalWidth * s, ih = bg.image.naturalHeight * s;
    c.drawImage(bg.image, (w - iw) / 2, (h - ih) / 2, iw, ih);
  } else if (bg.grad) {
    const g = c.createLinearGradient(0, 0, w * 0.35, h);
    bg.grad.forEach((kleur, i) => g.addColorStop(i / (bg.grad.length - 1), kleur));
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
}

function drawItem(c, item, w, h) {
  const sx = w / CANVAS_W, sy = h / CANVAS_H;
  if (item.t === "s") {
    if (!item.pts || !item.pts.length) return;
    c.strokeStyle = item.c || "#37352f";
    c.lineWidth = Math.max((item.w || 3) * sx, 0.5);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(item.pts[0][0] * sx, item.pts[0][1] * sy);
    if (item.pts.length === 1) c.lineTo(item.pts[0][0] * sx + 0.1, item.pts[0][1] * sy);
    for (let i = 1; i < item.pts.length; i++) c.lineTo(item.pts[i][0] * sx, item.pts[i][1] * sy);
    c.stroke();
  } else if (item.t === "x") {
    const size = (item.s || 28) * sy;
    c.fillStyle = item.c || "#37352f";
    c.font = `600 ${size}px ui-sans-serif, -apple-system, "Segoe UI", Inter, sans-serif`;
    c.textBaseline = "alphabetic";
    c.fillText(item.text, item.x * sx, item.y * sy);
  }
}

function renderItems(c, items, w, h, bg) {
  clearCanvas(c, w, h, bg);
  items.forEach(i => drawItem(c, i, w, h));
}

function redrawStraat() {
  renderItems(ctx, straatItems, CANVAS_W, CANVAS_H, canvasBg(straatBg, straatBgImage));
}

// zet {bgPreset,bgFileId} om naar iets dat clearCanvas kan tekenen
const PRESET_STOPS = {
  aqua: ["#a8e4f7", "#c9f0c8", "#7ecff5"],
  lucht: ["#dff4ff", "#9fd8f6", "#5fb6e8"],
  gras: ["#eafbe4", "#b6e8a6", "#6fc46b"],
  zonsondergang: ["#ffe9c7", "#ffb887", "#ef7a91"],
  nacht: ["#12305e", "#0a1c3f", "#050d1f"],
  papier: ["#ffffff", "#f7f5ef", "#f2f0e9"],
};

function canvasBg(bg, image) {
  if (!bg) return null;
  if (bg.bgFileId && image) return { image };
  if (bg.bgPreset && PRESET_STOPS[bg.bgPreset]) return { grad: PRESET_STOPS[bg.bgPreset] };
  return null;
}

async function applyStraatBackground(bg) {
  straatBg = { bgPreset: bg.bgPreset || "", bgFileId: bg.bgFileId || null };
  straatBgImage = null;
  if (straatBg.bgFileId) {
    try {
      const url = await fileUrl(straatBg.bgFileId);
      await new Promise((res) => {
        const img = new Image();
        img.onload = () => { straatBgImage = img; res(); };
        img.onerror = res;
        img.src = url;
      });
    } catch (e) {}
  }
  redrawStraat();
}

/* ----- pointer -> canvas coords ----- */
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return [
    ((e.clientX - r.left) / r.width) * CANVAS_W,
    ((e.clientY - r.top) / r.height) * CANVAS_H,
  ];
}

function pingActivity(kind) {
  if (!socket) return;
  socket.emit("straat:activity", kind);
  clearTimeout(activityTimer);
  activityTimer = setTimeout(() => socket.emit("straat:activity", "idle"), 3500);
}

canvas.addEventListener("pointerdown", e => {
  if (tool === "text") { showCaret(e); return; }
  drawing = true;
  canvas.setPointerCapture(e.pointerId);
  currentPts = [canvasPoint(e)];
  pingActivity("drawing");
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  const p = canvasPoint(e);
  const last = currentPts[currentPts.length - 1];
  if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2) return;
  currentPts.push(p);
  // teken alvast lokaal, de server bevestigt straks
  ctx.strokeStyle = penColor;
  ctx.lineWidth = penSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(last[0], last[1]);
  ctx.lineTo(p[0], p[1]);
  ctx.stroke();
});

function endStroke() {
  if (!drawing) return;
  drawing = false;
  if (currentPts.length) {
    socket.emit("straat:stroke", { pts: currentPts, c: penColor, w: penSize });
  }
  currentPts = [];
  pingActivity("idle");
}
canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);

/* ----- typen op de straat ----- */
const caret = $("text-caret");
const textInput = $("text-input");

function showCaret(e) {
  const r = canvas.getBoundingClientRect();
  const p = canvasPoint(e);
  textPos = p;
  const scale = r.width / CANVAS_W;
  caret.style.display = "block";
  caret.style.left = Math.min(e.clientX - r.left, r.width - 200) + "px";
  caret.style.top = (e.clientY - r.top - 26) + "px";
  textInput.style.fontSize = Math.max(penSize * 3.5 * scale, 13) + "px";
  textInput.style.color = penColor === "#ffffff" ? "#9b9a97" : penColor;
  textInput.value = "";
  textInput.focus();
  pingActivity("typing");
}

function hideCaret() { caret.style.display = "none"; textPos = null; }

textInput.addEventListener("input", () => pingActivity("typing"));
textInput.addEventListener("keydown", e => {
  if (e.key === "Escape") { hideCaret(); pingActivity("idle"); return; }
  if (e.key !== "Enter") return;
  e.preventDefault();
  const text = textInput.value.trim();
  if (text && textPos) {
    socket.emit("straat:text", {
      text, x: textPos[0], y: textPos[1],
      c: penColor === "#ffffff" ? "#9b9a97" : penColor,
      s: Math.max(penSize * 7, 20),
    });
  }
  hideCaret();
  pingActivity("idle");
});

function renderPresence(list) {
  const others = (list || []).filter(p => p.username !== me.username);
  $("presence").innerHTML = others.length
    ? others.map(p => {
        const label = p.activity === "typing" ? "typt" : p.activity === "drawing" ? "tekent" : "kijkt mee";
        return `<span class="pchip ${p.activity}"><span class="dot"></span>${esc(p.displayName)} ${label}</span>`;
      }).join("")
    : '<span class="pchip"><span class="dot"></span>je bent alleen op straat</span>';
}

function undoMine() {
  for (let i = straatItems.length - 1; i >= 0; i--) {
    if (straatItems[i].u === me.username) {
      straatItems.splice(i, 1);
      redrawStraat();
      toast("lokaal ongedaan gemaakt — na verversen staat het er weer");
      return;
    }
  }
  toast("je hebt nog niks toegevoegd vandaag");
}

async function clearStraat() {
  if (!confirm("straat van vandaag helemaal leegmaken?")) return;
  try { await api("/straat/clear", { method: "POST" }); toast("straat is leeg"); }
  catch (e) { toast(e.message); }
}

/* --------------------- publieke chat op de straat ------------------ */

let straatChatCount = 0;
let scLastUser = null;
let scTypingTimer = null;
const scTypingUsers = new Map();

async function loadStraatChat() {
  const box = $("sc-messages");
  box.innerHTML = "";
  scLastUser = null;
  try {
    const { messages } = await api("/straat/chat");
    straatChatCount = messages.length;
    if (!messages.length) {
      box.innerHTML = `<div class="sc-empty">nog niks gezegd vandaag. begin maar.</div>`;
    }
    messages.forEach(m => appendStraatChat(m, true));
    $("sc-count").textContent = straatChatCount ? straatChatCount + "" : "";
    box.scrollTop = box.scrollHeight;
  } catch (e) { /* stil, de straat werkt ook zonder chat */ }
}

function appendStraatChat(m, silent) {
  const box = $("sc-messages");
  const empty = box.querySelector(".sc-empty");
  if (empty) empty.remove();

  const mine = m.username === me.username;
  const grouped = scLastUser === m.username;
  scLastUser = m.username;

  const div = document.createElement("div");
  div.className = "sc-msg" + (mine ? " mine" : "") + (grouped ? " grouped" : "");
  div.id = "sc-" + m.id;

  if (!grouped) {
    const who = document.createElement("div");
    who.className = "sc-who";
    const dot = document.createElement("span");
    dot.className = "sc-dot";
    dot.style.background = avatarColor(m.displayName);
    who.appendChild(dot);
    who.appendChild(document.createTextNode(m.displayName));
    const t = document.createElement("span");
    t.className = "sc-t";
    t.textContent = fmtTime(m.time);
    who.appendChild(t);
    div.appendChild(who);
  }

  const tx = document.createElement("div");
  tx.className = "sc-tx";
  tx.textContent = m.text;
  div.appendChild(tx);

  box.appendChild(div);
  if (!silent) box.scrollTop = box.scrollHeight;
}

function onStraatChat(m) {
  straatChatCount++;
  $("sc-count").textContent = straatChatCount + "";
  const box = $("sc-messages");
  const stick = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  appendStraatChat(m, true);
  if (stick || m.username === me.username) box.scrollTop = box.scrollHeight;
  scTypingUsers.delete(m.username);
  renderScTyping();
}

function onStraatChatTyping({ username, displayName, on }) {
  if (username === me.username) return;
  if (on) scTypingUsers.set(username, displayName); else scTypingUsers.delete(username);
  renderScTyping();
}

function renderScTyping() {
  const names = [...scTypingUsers.values()];
  $("sc-typing").textContent = names.length === 1 ? names[0] + " typt..."
    : names.length > 1 ? names.slice(0, 2).join(" en ") + " typen..." : "";
}

function sendStraatChat() {
  const input = $("sc-input");
  const text = input.value.trim();
  if (!text || !socket) return;
  socket.emit("straat:chat", text);
  socket.emit("straat:chat-typing", false);
  input.value = "";
  input.style.height = "auto";
}

$("sc-input").addEventListener("input", e => {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 90) + "px";
  if (!socket) return;
  socket.emit("straat:chat-typing", true);
  clearTimeout(scTypingTimer);
  scTypingTimer = setTimeout(() => socket.emit("straat:chat-typing", false), 2200);
});

$("sc-input").addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendStraatChat(); }
});

/* --------------------------- achtergronden ------------------------- */
/* Iedereen in een groep mag de achtergrond van die groepchat kiezen.
   De achtergrond van straat mag alleen de beheerder veranderen. */

const BG_PRESETS = {
  aqua:         { naam: "aqua",         css: "linear-gradient(160deg, #a8e4f7 0%, #c9f0c8 50%, #7ecff5 100%)" },
  lucht:        { naam: "lucht",        css: "linear-gradient(180deg, #dff4ff 0%, #9fd8f6 55%, #5fb6e8 100%)" },
  gras:         { naam: "gras",         css: "linear-gradient(170deg, #eafbe4 0%, #b6e8a6 55%, #6fc46b 100%)" },
  zonsondergang:{ naam: "zonsondergang",css: "linear-gradient(170deg, #ffe9c7 0%, #ffb887 45%, #ef7a91 100%)" },
  nacht:        { naam: "nacht",        css: "linear-gradient(170deg, #12305e 0%, #0a1c3f 55%, #050d1f 100%)" },
  papier:       { naam: "papier",       css: "linear-gradient(180deg, #ffffff 0%, #f2f0e9 100%)" },
};

let bgTarget = null;   // { soort: "groep"|"straat", id }

function openBackgroundPicker(soort, id) {
  bgTarget = { soort, id };
  $("bg-title").textContent = soort === "straat" ? "achtergrond van straat" : "achtergrond van deze groepchat";
  $("bg-sub").textContent = soort === "straat"
    ? "dit is de achtergrond waarop iedereen tekent. alleen jij kan dit veranderen."
    : "iedereen in deze groep kan dit veranderen.";

  const huidig = soort === "straat" ? straatBg : (currentGroup || {});
  $("bg-presets").innerHTML = Object.entries(BG_PRESETS).map(([key, p]) =>
    `<button class="bg-swatch${huidig.bgPreset === key ? " on" : ""}" style="background:${p.css}"
             title="${esc(p.naam)}" onclick="pickBackground('${key}')"><span>${esc(p.naam)}</span></button>`
  ).join("");
  applyIcons($("modal-background"));
  $("modal-background").classList.add("on");
}

async function pickBackground(preset, clear) {
  if (!bgTarget) return;
  const url = bgTarget.soort === "straat" ? "/straat/background" : `/groups/${bgTarget.id}/background`;
  try {
    await api(url, { json: clear ? { clear: true } : { preset } });
    toast(clear ? "achtergrond weggehaald" : "achtergrond aangepast");
    closeModal();
  } catch (e) { toast(e.message); }
}

$("bg-image").addEventListener("change", async e => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f || !bgTarget) return;
  if (!f.type.startsWith("image/")) { toast("kies een afbeelding"); return; }
  if (f.size > IMAGE_MAX) { toast("afbeelding is te groot (max 5 MB)"); return; }
  const fd = new FormData();
  fd.append("image", f);
  const url = bgTarget.soort === "straat" ? "/straat/background" : `/groups/${bgTarget.id}/background`;
  try {
    await api(url, { method: "POST", body: fd });
    toast("achtergrond aangepast");
    closeModal();
  } catch (err) { toast(err.message); }
});

// zet een achtergrond op een element, als preset of als geüploade afbeelding
async function paintBackground(el, bgPreset, bgFileId) {
  if (!el) return;
  el.classList.toggle("heeft-achtergrond", !!(bgPreset || bgFileId));
  if (bgFileId) {
    try {
      const url = await fileUrl(bgFileId);
      el.style.backgroundImage = `url("${url}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundAttachment = "local";
    } catch (e) { el.style.backgroundImage = ""; }
  } else if (bgPreset && BG_PRESETS[bgPreset]) {
    el.style.backgroundImage = BG_PRESETS[bgPreset].css;
    el.style.backgroundSize = "cover";
    el.style.backgroundAttachment = "local";
  } else {
    el.style.backgroundImage = "";
  }
}

/* ------------------------------ archief --------------------------- */

async function loadArchief() {
  try {
    const { days } = await api("/straat/archive");
    const grid = $("arch-grid");
    grid.innerHTML = "";
    $("arch-empty").hidden = days.length > 0;

    days.forEach(d => {
      const card = document.createElement("button");
      card.className = "arch-card";
      card.onclick = () => go("#/archief/" + d.date);
      card.innerHTML = `
        <canvas width="400" height="225"></canvas>
        <div class="arch-meta">
          <div class="d">${esc(fmtDateLong(d.date).replace(/,.*$/, ""))} ${d.isToday ? '<span class="tag green">vandaag</span>' : ""}</div>
          <div class="s">${d.strokes} lijn${d.strokes === 1 ? "" : "en"} · ${d.texts} tekst${d.texts === 1 ? "" : "en"}${d.contributors.length ? " · " + esc(d.contributors.slice(0, 3).join(", ")) : ""}</div>
        </div>`;
      grid.appendChild(card);

      const c = card.querySelector("canvas").getContext("2d");
      clearCanvas(c, 400, 225);
      api("/straat/" + d.date)
        .then(async doc => renderItems(c, doc.items, 400, 225, await archiveBg(doc)))
        .catch(() => {});
    });
  } catch (e) { toast(e.message); }
}

async function openArchiefDag(date) {
  try {
    const doc = await api("/straat/" + date);
    $("ad-title").textContent = fmtDateLong(date);
    $("ad-sub").textContent = doc.readonly ? "uit het archief — alleen kijken" : "dit is straat van vandaag";
    $("ad-count").textContent = countLabel(doc.items);
    $("ad-contribs").textContent = doc.contributors.length ? doc.contributors.join(", ") : "niemand";
    const c = $("ad-canvas").getContext("2d");
    renderItems(c, doc.items, CANVAS_W, CANVAS_H, await archiveBg(doc));
  } catch (e) { toast(e.message); go("#/archief"); }
}

// laadt de achtergrond die bij die archiefdag hoorde
async function archiveBg(doc) {
  if (doc.bgFileId) {
    try {
      const url = await fileUrl(doc.bgFileId);
      const img = await new Promise(res => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => res(null);
        i.src = url;
      });
      if (img) return { image: img };
    } catch (e) {}
  }
  return canvasBg({ bgPreset: doc.bgPreset, bgFileId: null }, null);
}

/* ================================================================== *
 *  GROEPEN
 * ================================================================== */

async function loadGroups() {
  try {
    const data = await api("/groups");
    groups = data.groups;
    renderSidebarGroups();
    renderGroups();
  } catch (e) {}
}

function renderSidebarGroups() {
  const box = $("sb-groups");
  box.innerHTML = groups.map(g =>
    `<button class="sb-item" data-group="${esc(g.id)}" onclick="go('#/groep/${esc(g.id)}')">
       <span class="ico">#</span><span class="txt">${esc(g.name)}</span>
     </button>`).join("");
  if (activeGroupId) markActiveGroup();
}

function markActiveGroup() {
  document.querySelectorAll(".sb-item[data-group]").forEach(b =>
    b.classList.toggle("active", b.dataset.group === activeGroupId));
}

function renderGroups() {
  const grid = $("grp-grid");
  if (!grid) return;
  $("grp-empty").hidden = groups.length > 0;
  grid.innerHTML = groups.map(g => `
    <button class="grp-card" onclick="go('#/groep/${esc(g.id)}')">
      <div class="n">${esc(g.name)} ${g.owner === me.username ? '<span class="tag">jouw groep</span>' : ""}</div>
      <div class="l">${g.lastText ? esc(g.lastFrom + ": " + g.lastText) : "nog geen berichten"}</div>
      <div class="m">${g.memberCount} ${g.memberCount === 1 ? "lid" : "leden"} · code <span class="code">${esc(g.code)}</span></div>
    </button>`).join("");
}

function openModal(which) {
  $("modal-" + which).classList.add("on");
  const inp = $("modal-" + which).querySelector("input");
  if (inp) { inp.value = ""; setTimeout(() => inp.focus(), 40); }
}
function closeModal() { document.querySelectorAll(".modal-back").forEach(m => m.classList.remove("on")); }
document.querySelectorAll(".modal-back").forEach(m => {
  m.addEventListener("click", e => { if (e.target === m) closeModal(); });
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closeModal(); $("lightbox").classList.remove("on"); }
});

async function createGroup() {
  const name = $("new-group-name").value.trim();
  if (!name) return;
  try {
    const { group } = await api("/groups", { json: { name } });
    closeModal();
    await loadGroups();
    toast("groep gemaakt — deel code " + group.code);
    go("#/groep/" + group.id);
  } catch (e) { toast(e.message); }
}

async function joinGroup() {
  const code = $("join-code").value.trim().toUpperCase();
  if (!code) return;
  try {
    const { group } = await api("/groups/join", { json: { code } });
    closeModal();
    await loadGroups();
    go("#/groep/" + group.id);
  } catch (e) { toast(e.message); }
}

/* --------------------------- groepchat ---------------------------- */

let currentGroup = null;
let lastMsgUser = null;
let pendingFile = null;
let typingTimer = null;
const typingUsers = new Map();

async function openGroup(id) {
  if (activeGroupId && activeGroupId !== id) socket.emit("group:leave", activeGroupId);
  activeGroupId = id;
  markActiveGroup();

  try {
    const { group } = await api("/groups/" + id);
    currentGroup = group;
  } catch (e) { toast(e.message); go("#/groepen"); return; }

  crumb(["groepen", currentGroup.name]);
  paintBackground($("grp-scroll"), currentGroup.bgPreset, currentGroup.bgFileId);
  $("topbar-actions").innerHTML = `
    <span class="tag" title="deel deze code zodat anderen erbij kunnen">code ${esc(currentGroup.code)}</span>
    <button class="btn ghost sm" onclick="copyCode()">kopieer</button>
    <button class="btn ghost sm" onclick="openBackgroundPicker(&#39;groep&#39;, activeGroupId)">achtergrond</button>
    <button class="btn ghost sm danger" onclick="leaveGroup()">verlaten</button>`;

  socket.emit("group:join", id);

  const box = $("grp-messages");
  box.innerHTML = "";
  lastMsgUser = null;
  typingUsers.clear();
  maesTypingOn = false;
  renderTypingLine();
  clearPending();

  try {
    const { messages } = await api("/groups/" + id + "/messages");
    if (!messages.length) {
      box.innerHTML = `<div class="empty"><span class="big" data-icon="chat">💬</span>nog geen berichten.
        typ <code style="font-family:var(--mono)">/Maes</code> om Maes-AI erbij te halen.</div>`;
    }
    messages.forEach(m => appendGroupMessage(m, true));
    applyIcons();
    scrollChat("grp-scroll");
  } catch (e) { toast(e.message); }
}

function copyCode() {
  navigator.clipboard.writeText(currentGroup.code)
    .then(() => toast("code gekopieerd"))
    .catch(() => toast("code: " + currentGroup.code));
}

async function leaveGroup() {
  if (!confirm("deze groep verlaten?")) return;
  try {
    await api("/groups/" + activeGroupId + "/leave", { method: "POST" });
    socket.emit("group:leave", activeGroupId);
    activeGroupId = null;
    await loadGroups();
    go("#/groepen");
  } catch (e) { toast(e.message); }
}

function appendGroupMessage(m, silent) {
  const box = $("grp-messages");
  const emptyEl = box.querySelector(".empty");
  if (emptyEl) emptyEl.remove();

  const isAi = m.kind === "ai";
  const isMine = !isAi && m.username === me.username;
  const grouped = lastMsgUser === m.username && !isAi;
  lastMsgUser = m.username;

  const div = document.createElement("div");
  div.className = "msg" + (isAi ? " ai" : "") + (isMine ? " mine" : "") + (grouped ? " grouped" : "");
  div.id = "gm-" + m.id;

  const av = document.createElement("div");
  av.className = "av";
  if (isAi) { av.textContent = "✦"; av.style.background = "var(--purple)"; }
  else { av.textContent = initials(m.displayName); av.style.background = avatarColor(m.displayName); }

  const bd = document.createElement("div");
  bd.className = "bd";
  bd.innerHTML = `<div class="who">${esc(m.displayName)}<span class="t">${fmtTime(m.time)}</span></div>`;

  if (m.text) {
    const tx = document.createElement("div");
    tx.className = "tx";
    tx.textContent = m.text;
    bd.appendChild(tx);
  }

  if (m.kind === "image") {
    const img = document.createElement("img");
    img.className = "att-img";
    img.alt = m.fileName || "";
    fileUrl(m.fileId).then(url => {
      img.src = url;
      img.onclick = () => { $("lightbox-img").src = url; $("lightbox").classList.add("on"); };
    }).catch(() => { img.replaceWith(document.createTextNode("kon de foto niet laden")); });
    bd.appendChild(img);
  } else if (m.kind === "file") {
    const a = document.createElement("a");
    a.className = "att-file";
    a.href = "#";
    a.innerHTML = `<span class="fi" data-icon="bestand">📄</span><span><span class="fn">${esc(m.fileName)}</span><br>
                   <span class="fs">${fmtSize(m.fileSize)}</span></span>`;
    a.onclick = async e => {
      e.preventDefault();
      try {
        const url = await fileUrl(m.fileId);
        const dl = document.createElement("a");
        dl.href = url;
        dl.download = m.fileName || "bestand";
        dl.click();
      } catch (err) { toast("kon het bestand niet openen"); }
    };
    bd.appendChild(a);
  }

  div.appendChild(av);
  div.appendChild(bd);
  box.appendChild(div);
  if (!silent) scrollChat("grp-scroll");
  if (m.kind === "file") applyIcons(div);
}

function onGroupMessage(m) {
  if (m.groupId !== activeGroupId) { loadGroups(); return; }
  appendGroupMessage(m);
  loadGroups();
}

function scrollChat(id) {
  const el = $(id);
  if (el) el.scrollTop = el.scrollHeight;
}

const grpInput = $("grp-input");
grpInput.addEventListener("input", () => {
  autoGrow(grpInput);
  if (!activeGroupId) return;
  socket.emit("group:typing", { groupId: activeGroupId, on: true });
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => socket.emit("group:typing", { groupId: activeGroupId, on: false }), 2200);
});
grpInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendGroupMessage(); }
});

function onGroupBackground({ groupId, bgPreset, bgFileId, door }) {
  const g = groups.find(x => x.id === groupId);
  if (g) { g.bgPreset = bgPreset; g.bgFileId = bgFileId; }
  if (groupId !== activeGroupId) return;
  if (currentGroup) { currentGroup.bgPreset = bgPreset; currentGroup.bgFileId = bgFileId; }
  paintBackground($("grp-scroll"), bgPreset, bgFileId);
  if (door && door !== me.displayName) toast(door + " veranderde de achtergrond");
}

function onGroupTyping({ groupId, username, displayName, on }) {
  if (groupId !== activeGroupId) return;
  if (on) typingUsers.set(username, displayName); else typingUsers.delete(username);
  renderTypingLine();
}

let maesTypingOn = false;
function onMaesTyping({ groupId, on }) {
  if (groupId !== activeGroupId) return;
  maesTypingOn = on;
  renderTypingLine();
}

function renderTypingLine() {
  const names = [...typingUsers.values()];
  let txt = "";
  if (maesTypingOn) txt = "Maes-AI denkt na";
  else if (names.length === 1) txt = names[0] + " typt";
  else if (names.length > 1) txt = names.slice(0, 2).join(" en ") + " typen";
  $("grp-typing").innerHTML = txt
    ? `${esc(txt)} <span class="dots"><i></i><i></i><i></i></span>` : "";
}

function sendGroupMessage() {
  const text = grpInput.value.trim();
  if (!text || !activeGroupId) return;
  socket.emit("group:message", { groupId: activeGroupId, text });
  socket.emit("group:typing", { groupId: activeGroupId, on: false });
  grpInput.value = "";
  autoGrow(grpInput);
}

/* ------------------------- uploads in groep ----------------------- */

const IMAGE_MAX = 5 * 1024 * 1024;
const FILE_MAX = 20 * 1024 * 1024;

function pickUpload(kind) {
  $(kind === "image" ? "up-image" : "up-file").click();
}

function clearPending() {
  pendingFile = null;
  $("grp-pending").hidden = true;
  $("up-image").value = "";
  $("up-file").value = "";
}

["up-image", "up-file"].forEach(id => {
  $(id).addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    const isImage = (f.type || "").startsWith("image/");
    const cap = isImage ? IMAGE_MAX : FILE_MAX;
    if (f.size > cap) {
      toast(isImage ? "afbeelding is te groot (max 5 MB)" : "bestand is te groot (max 20 MB)");
      clearPending();
      return;
    }
    pendingFile = f;
    $("grp-pending").hidden = false;
    $("grp-pending-name").textContent = `${isImage ? "🖼" : "📄"} ${f.name} · ${fmtSize(f.size)} — versturen...`;
    uploadPending();
  });
});

async function uploadPending() {
  if (!pendingFile || !activeGroupId) return;
  const fd = new FormData();
  fd.append("file", pendingFile);
  fd.append("caption", grpInput.value.trim());
  try {
    await api("/groups/" + activeGroupId + "/upload", { method: "POST", body: fd });
    grpInput.value = "";
    autoGrow(grpInput);
    clearPending();
    loadGroups();
  } catch (e) {
    toast(e.message);
    clearPending();
  }
}

/* ================================================================== *
 *  MAES-AI
 * ================================================================== */

let maesNoticeShown = false;
let maesImage = null;

async function openMaes() {
  $("topbar-actions").innerHTML = "";
  await loadSlots();
  showMaesNotice();
  await loadSlotMessages(activeSlot);
}

async function showMaesNotice() {
  const slot = $("maes-notice-slot");
  if (sessionStorage.getItem("maesNoticeClosed") === "1") { slot.innerHTML = ""; return; }
  let notice = "geniet nu van gratis 15 cent krediet van Maes AI om het uit te testen. Je kan Maes-AI ook via /Maes oproepen in je groepchat.";
  try { const info = await api("/maes/info"); notice = info.notice; setCredit(info.pct); } catch (e) {}

  const html = esc(notice)
    .replace("/Maes", '<code>/Maes</code>')
    .replace(/Maes-AI/g, "<strong>Maes-AI</strong>");

  slot.innerHTML = `
    <div class="callout" style="margin-bottom:18px;">
      <span class="cico" data-icon="maes">✦</span>
      <div class="cbody">${html}</div>
      <button class="cclose" onclick="closeMaesNotice()" title="sluiten">×</button>
    </div>`;
  applyIcons(slot);
  maesNoticeShown = true;
}

function closeMaesNotice() {
  sessionStorage.setItem("maesNoticeClosed", "1");
  $("maes-notice-slot").innerHTML = "";
}

async function loadSlots() {
  try {
    const data = await api("/slots");
    slots = data.slots;
    $("maes-slot").innerHTML = slots.map(s =>
      `<option value="${s.id}"${s.id === activeSlot ? " selected" : ""}>${esc(s.empty ? "chat " + s.id : s.title)}</option>`
    ).join("");
  } catch (e) {}
}

async function switchSlot(id) {
  activeSlot = parseInt(id);
  await loadSlotMessages(activeSlot);
}

async function loadSlotMessages(id) {
  const box = $("maes-messages");
  box.innerHTML = "";
  try {
    const { messages } = await api("/slots/" + id);
    if (!messages.length) {
      box.innerHTML = `<div class="empty"><span class="big" data-icon="maes">✦</span>stel Maes-AI je eerste vraag</div>`;
    }
    messages.forEach(m => appendMaes(m.role, m.content, true));
    applyIcons(box);
    scrollChat("maes-scroll");
  } catch (e) { toast(e.message); }
}

async function clearSlot() {
  try {
    await api("/slots/" + activeSlot + "/clear", { method: "POST" });
    await loadSlots();
    await loadSlotMessages(activeSlot);
    toast("chat leeggemaakt");
  } catch (e) { toast(e.message); }
}

function appendMaes(role, text, silent) {
  const box = $("maes-messages");
  const emptyEl = box.querySelector(".empty");
  if (emptyEl) emptyEl.remove();

  const isAi = role === "assistant";
  const div = document.createElement("div");
  div.className = "msg" + (isAi ? " ai" : " mine");

  const av = document.createElement("div");
  av.className = "av";
  if (isAi) { av.textContent = "✦"; av.style.background = "var(--purple)"; }
  else { av.textContent = initials(me.displayName); av.style.background = avatarColor(me.displayName); }

  const bd = document.createElement("div");
  bd.className = "bd";
  bd.innerHTML = `<div class="who">${isAi ? "Maes-AI" : esc(me.displayName)}</div>`;

  const tx = document.createElement("div");
  tx.className = "tx";
  let body = text || "";
  if (body.startsWith("[foto]")) {
    const label = document.createElement("div");
    label.style.cssText = "font-size:12px;color:var(--text-faint);";
    label.textContent = "🖼 foto";
    bd.appendChild(label);
    body = body.slice(6).trim();
  }
  tx.textContent = body;
  bd.appendChild(tx);

  div.appendChild(av);
  div.appendChild(bd);
  box.appendChild(div);
  if (!silent) scrollChat("maes-scroll");
  return tx;
}

const maesInput = $("maes-input");
maesInput.addEventListener("input", () => autoGrow(maesInput));
maesInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMaes(); }
});

$("maes-image").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > IMAGE_MAX) { toast("afbeelding is te groot (max 5 MB)"); e.target.value = ""; return; }
  maesImage = f;
  $("maes-pending").hidden = false;
  $("maes-pending-name").textContent = `🖼 ${f.name} · ${fmtSize(f.size)}`;
});

function clearMaesImage() {
  maesImage = null;
  $("maes-image").value = "";
  $("maes-pending").hidden = true;
}

async function sendMaes() {
  const message = maesInput.value.trim();
  if (!message && !maesImage) return;

  appendMaes("user", (maesImage ? "[foto] " : "") + message);
  const file = maesImage;
  maesInput.value = "";
  autoGrow(maesInput);
  clearMaesImage();

  $("maes-typing").innerHTML = 'Maes-AI denkt na <span class="dots"><i></i><i></i><i></i></span>';

  const fd = new FormData();
  fd.append("message", message);
  fd.append("slotId", activeSlot);
  fd.append("mode", $("maes-mode").value);
  if (file) fd.append("image", file);

  try {
    const data = await api("/chat", { method: "POST", body: fd });
    $("maes-typing").innerHTML = "";
    appendMaes("assistant", data.reply);
    if (data.pct !== undefined) setCredit(data.pct);
    loadSlots();
  } catch (e) {
    $("maes-typing").innerHTML = "";
    appendMaes("assistant", "er ging iets mis: " + e.message);
  }
}

/* ============================= CODE HEIST ========================== *
 *  Het nakijken gebeurt op de server, want een gehaalde dagelijkse
 *  heist levert echt krediet op. Hier tonen we alleen de uitslag.
 * ================================================================== */

let heistData = null;
let werkOpdracht = null;    // { soort: "level"|"daily", id }

async function openHeist() {
  $("topbar-actions").innerHTML = "";
  try {
    heistData = await api("/heist");
  } catch (e) { toast(e.message); return; }

  const d = heistData.daily;
  $("heist-streak").innerHTML = `<span class="dot"></span>${heistData.streak} dag${heistData.streak === 1 ? "" : "en"} op rij`;
  $("heist-verdiend").innerHTML = `<span class="dot"></span>${(heistData.verdiend * 100).toFixed(0)} cent verdiend`;
  $("heist-pill").hidden = d.gedaan;
  setCredit(heistData.pct, heistData.budget);

  // --- de dagelijkse heist ---
  const soortLabel = { uitleg: "wat doe ik hier?", debug: "zoek de fout", schrijf: "schrijf me" };
  $("daily-type").textContent = (soortLabel[d.type] || "vandaag") + " · niveau " + (d.niveau || 1);
  $("daily-vraag").textContent = d.vraag;
  $("daily-uitleg").textContent = d.uitleg || "";
  $("daily-status").hidden = !d.gedaan;
  $("daily-card").classList.toggle("gehaald", d.gedaan);

  const codeEl = $("daily-code");
  codeEl.hidden = !d.code;
  codeEl.textContent = d.code || "";

  const opties = $("daily-opties");
  const editor = $("daily-editor");
  opties.innerHTML = "";
  editor.hidden = true;

  if (d.type === "uitleg") {
    opties.innerHTML = d.opties.map((o, i) =>
      `<button class="keuze${d.gedaan && d.juist === i ? " goed" : ""}" ${d.gedaan ? "disabled" : ""}
               onclick="antwoordDaily(${i})">${esc(o)}</button>`).join("");
  } else {
    editor.hidden = false;
    editor.innerHTML = d.gedaan
      ? `<p class="hd-uitleg">je hebt deze heist al gehaald.</p>`
      : `<button class="btn primary" onclick="openWerk('daily')">openen en oplossen</button>`;
  }

  const waarom = $("daily-waarom");
  waarom.hidden = !d.waarom;
  if (d.waarom) waarom.innerHTML = `<strong>waarom:</strong> ${esc(d.waarom)}`;

  // --- levels ---
  $("lvl-grid").innerHTML = heistData.levels.map((l, i) => `
    <button class="lvl-card${l.klaar ? " klaar" : ""}" onclick="openWerk('level','${esc(l.id)}')">
      <div class="lvl-n">${i + 1}</div>
      <div class="lvl-b">
        <strong>${esc(l.titel)}</strong>
        <span>${esc(l.uitleg)}</span>
      </div>
      ${l.klaar ? '<span class="tag green">gekraakt</span>' : ""}
    </button>`).join("");

  sluitWerk();
}

// het spiekbriefje: welke tag hoort bij welk woord uit de opdracht
function openSpiek() {
  const groepen = (heistData && heistData.spiek) || [];
  $("spiek-inhoud").innerHTML = groepen.map(g => `
    <div class="spiek-groep">
      <div class="spiek-kop">${esc(g.groep)}</div>
      <table class="spiek-tabel">
        ${g.rijen.map(r => `
          <tr>
            <td class="sp-woord">${esc(r.woord)}</td>
            <td class="sp-tag"><code>${esc(r.tag)}</code></td>
            <td class="sp-uitleg">${esc(r.uitleg)}<br><code class="sp-vb">${esc(r.voorbeeld)}</code></td>
          </tr>`).join("")}
      </table>
    </div>`).join("");
  $("modal-spiek").classList.add("on");
}

function opdrachtVan(soort, id) {
  return soort === "daily" ? heistData.daily : heistData.levels.find(l => l.id === id);
}

function openWerk(soort, id) {
  const o = opdrachtVan(soort, id);
  if (!o) return;
  werkOpdracht = { soort, id: id || o.id };

  $("heist-werk").hidden = false;
  $("werk-titel").textContent = o.titel || o.vraag;
  $("werk-uitleg").textContent = o.uitleg || "";
  $("werk-tag").textContent = soort === "daily" ? "levert 1 cent op" : "level";
  $("werk-tag").className = "tag" + (soort === "daily" ? " green" : "");

  $("werk-html").value = (o.start && o.start.html) || "";
  $("werk-css").value = (o.start && o.start.css) || "";
  toonEisen(o.eisen.map(t => ({ omschrijving: t, ok: null })));
  $("hint-box").hidden = true;
  // hints horen bij de levels; de dagelijkse heist doe je zelf, die levert krediet op
  const isDaily = soort === "daily";
  $("hint-btn").hidden = isDaily;
  $("hint-op").textContent = isDaily
    ? "de dagelijkse heist doe je zonder hulp"
    : heistData.hintsOver + " hints over vandaag";
  ververs();
  $("heist-werk").scrollIntoView({ behavior: "smooth", block: "start" });
}

function sluitWerk() {
  $("heist-werk").hidden = true;
  werkOpdracht = null;
}

function toonEisen(lijst) {
  $("werk-eisen").innerHTML = lijst.map(r =>
    `<div class="eis ${r.ok === null ? "" : r.ok ? "ok" : "fout"}">
       <span class="vink">${r.ok === null ? "○" : r.ok ? "✓" : "✕"}</span>${esc(r.omschrijving)}
     </div>`).join("");
}

// live voorbeeld in een afgeschermde iframe: student-code mag niets van de app zien
function ververs() {
  const html = $("werk-html").value;
  const css = $("werk-css").value;
  $("werk-frame").srcdoc =
    `<!doctype html><meta charset="utf-8"><style>body{font-family:Tahoma,sans-serif;padding:10px;margin:0}${css}</style>${html}`;
}

["werk-html", "werk-css"].forEach(id => {
  const el = $(id);
  if (el) el.addEventListener("input", ververs);
});

async function leverIn() {
  if (!werkOpdracht) return;
  const body = { html: $("werk-html").value, css: $("werk-css").value };
  const url = werkOpdracht.soort === "daily" ? "/heist/daily" : "/heist/level/" + werkOpdracht.id;
  try {
    const r = await api(url, { json: body });
    toonEisen(r.resultaten || []);
    if (r.geslaagd) {
      if (r.uitbetaald) {
        toast(`gekraakt! +${Math.round(r.beloning * 100)} cent krediet erbij`);
        setCredit(r.pct, r.budget);
      } else if (r.alGedaan) {
        toast(r.bericht);
      } else {
        toast(r.nieuw ? "level gekraakt" : "klopt helemaal");
      }
      await openHeist();
    } else {
      toast(`${r.punten} van ${r.totaal} eisen gehaald`);
      if (r.tip) { $("hint-box").hidden = false; $("hint-box").innerHTML = `<strong>tip:</strong> ${esc(r.tip)}`; }
    }
  } catch (e) { toast(e.message); }
}

async function antwoordDaily(keuze) {
  try {
    const r = await api("/heist/daily", { json: { keuze } });
    if (r.geslaagd) {
      toast(r.uitbetaald ? `juist! +${Math.round(r.beloning * 100)} cent krediet erbij` : (r.bericht || "juist"));
      if (r.pct !== undefined) setCredit(r.pct, r.budget);
    } else {
      toast("dat is het niet, probeer opnieuw");
    }
    await openHeist();
  } catch (e) { toast(e.message); }
}

async function vraagHint() {
  if (!werkOpdracht) return;
  const btn = $("hint-btn");
  btn.disabled = true;
  btn.textContent = "Maes-AI kijkt...";
  try {
    const r = await api("/heist/hint", {
      json: {
        levelId: werkOpdracht.soort === "level" ? werkOpdracht.id : null,
        html: $("werk-html").value,
        css: $("werk-css").value,
      },
    });
    $("hint-box").hidden = false;
    $("hint-box").innerHTML = `<strong>Maes-AI:</strong> ${esc(r.hint)}`;
    $("hint-op").textContent = r.hintsOver + " hints over vandaag";
    if (r.pct !== undefined) setCredit(r.pct);
  } catch (e) { toast(e.message); }
  btn.disabled = false;
  btn.textContent = "vraag Maes-AI om een hint";
}

/* ---------------------------- instellingen ------------------------ */

async function openSettings() {
  $("topbar-actions").innerHTML = "";
  $("settings-name").textContent = me.displayName;
  $("settings-user").textContent = me.username;
  paintAvatar($("settings-av"), me.displayName, me.pfp);
  applyTheme();
  try { const info = await api("/me"); setCredit(info.pct, info.budget); } catch (e) {}
}

$("pfp-input").addEventListener("change", async e => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > IMAGE_MAX) { toast("foto is te groot (max 5 MB)"); return; }
  const fd = new FormData();
  fd.append("pfp", f);
  try {
    const data = await api("/me/pfp", { method: "POST", body: fd });
    me.pfp = data.pfp;
    paintAvatar($("me-av"), me.displayName, me.pfp);
    paintAvatar($("settings-av"), me.displayName, me.pfp);
    toast("profielfoto bijgewerkt");
  } catch (err) { toast(err.message); }
});

/* ------------------------------- beheer --------------------------- */

async function loadAdmin() {
  if (!me.isAdmin) return;
  $("topbar-actions").innerHTML = "";
  try {
    const { users, maxEuro } = await api("/admin/users");
    $("admin-rows").innerHTML = users.map(u => `
      <tr>
        <td><input class="cell mono" value="${esc(u.username)}" ${u.isAdmin ? "disabled title=\"het hoofdbeheerdersaccount kan niet hernoemd worden\"" : ""}
             onchange="saveUsername('${esc(u.username)}', this)" />${u.isAdmin ? '<span class="tag purple">beheer</span>' : ""}</td>
        <td><input class="cell" value="${esc(u.displayName)}"
             onchange="saveUser('${esc(u.username)}', this.value, null)" /></td>
        <td><input class="cell" value="${esc(u.password)}"
             onchange="saveUser('${esc(u.username)}', null, this.value)" /></td>
        <td>
          <span class="mini-track"><span class="mini-bar" style="width:${Math.min(u.pct, 100)}%;
            background:${u.pct < 55 ? "var(--green)" : u.pct < 85 ? "var(--yellow)" : "var(--red)"}"></span></span>
          <span style="font-size:12px;color:var(--text-muted);margin-left:7px;">
            ${(u.spend * 100).toFixed(1)} / ${(maxEuro * 100).toFixed(0)} ct</span>
        </td>
        <td><button class="btn ghost sm" onclick="resetSpend('${esc(u.username)}')">reset</button></td>
      </tr>`).join("");

    const { groups: allGroups } = await api("/admin/groups");
    $("admin-groups").innerHTML = allGroups.length
      ? `<table class="tbl"><thead><tr><th>groep</th><th style="width:110px;">code</th>
         <th style="width:120px;">eigenaar</th><th style="width:80px;">leden</th></tr></thead><tbody>` +
        allGroups.map(g => `<tr><td>${esc(g.name)}</td><td><span class="code">${esc(g.code)}</span></td>
          <td>${esc(g.owner)}</td><td>${g.members.length}</td></tr>`).join("") +
        `</tbody></table>`
      : `<div class="empty"><span class="big" data-icon="groepen">👥</span>er zijn nog geen groepen</div>`;
    applyIcons($("v-beheer"));
    await loadLoginScreen();
    await loadStorage();
  } catch (e) { toast(e.message); }
}

/* ------------------------- opslag in Mongo ------------------------- */

async function loadStorage() {
  try {
    const s = await api("/admin/storage");
    $("st-label").textContent =
      `${s.count} bestand${s.count === 1 ? "" : "en"} · ${fmtSize(s.used)} van ${fmtSize(s.budget)}`;
    $("st-pct").textContent = Math.round(s.pct) + "%";
    const bar = $("st-bar");
    bar.style.width = Math.min(s.pct, 100) + "%";
    bar.style.background = s.pct < 60 ? "var(--green)" : s.pct < 85 ? "var(--yellow)" : "var(--red)";

    $("st-groups").innerHTML = s.perGroup.length
      ? s.perGroup.map(g => `
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);padding:3px 0;border-bottom:1px solid var(--line-soft);">
            <span>${esc(g.name)}</span>
            <span>${g.files} × · ${fmtSize(g.bytes)}</span>
          </div>`).join("")
      : `<div style="font-size:12px;color:var(--text-faint);">nog niks geüpload</div>`;
  } catch (e) { /* stil */ }
}

/* --------------- inlogscherm dat de beheerder regelt --------------- */

let loginScreen = { title: "", text: "", image: null };

async function loadLoginScreen() {
  try {
    loginScreen = await api("/public/login-screen");
    $("ls-title").value = loginScreen.title || "";
    $("ls-text").value = loginScreen.text || "";
    renderLoginPreview();
  } catch (e) {}
}

function renderLoginPreview() {
  const img = $("ls-preview-img");
  if (loginScreen.image) {
    img.hidden = false;
    img.style.backgroundImage = `url("${loginScreen.image}")`;
  } else {
    img.hidden = true;
    img.style.backgroundImage = "";
  }
  $("ls-preview-title").textContent = loginScreen.title || "";
  $("ls-preview-text").textContent = loginScreen.text || "";
  $("ls-preview").classList.toggle("leeg", !loginScreen.image && !loginScreen.title && !loginScreen.text);
}

async function saveLoginScreen() {
  try {
    const out = await api("/admin/login-screen", {
      json: { title: $("ls-title").value, text: $("ls-text").value },
    });
    loginScreen.title = out.title;
    loginScreen.text = out.text;
    renderLoginPreview();
    toast("inlogscherm opgeslagen");
  } catch (e) { toast(e.message); }
}

async function clearLoginImage() {
  try {
    await api("/admin/login-screen", { json: { clearImage: true } });
    loginScreen.image = null;
    $("ls-image").value = "";
    renderLoginPreview();
    toast("afbeelding verwijderd");
  } catch (e) { toast(e.message); }
}

$("ls-image").addEventListener("change", async e => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > IMAGE_MAX) { toast("afbeelding is te groot (max 5 MB)"); e.target.value = ""; return; }
  const fd = new FormData();
  fd.append("image", f);
  try {
    const out = await api("/admin/login-screen/image", { method: "POST", body: fd });
    loginScreen.image = out.image;
    renderLoginPreview();
    toast("afbeelding opgeslagen");
  } catch (err) { toast(err.message); }
});

// hernoemt de gebruikersnaam; de server verhuist meteen alle verwijzingen mee
async function saveUsername(oud, input) {
  const nieuw = input.value.trim();
  if (!nieuw || nieuw === oud) { input.value = oud; return; }
  try {
    const out = await api("/admin/users/" + encodeURIComponent(oud), { json: { newUsername: nieuw } });
    toast(oud + " heet nu " + out.username);
    if (oud === me.username) {
      me.username = out.username;
      localStorage.setItem("username", out.username);
    }
    loadAdmin();
  } catch (e) {
    toast(e.message);
    input.value = oud;
    loadAdmin();
  }
}

async function saveUser(username, displayName, password) {
  const json = {};
  if (displayName !== null) json.displayName = displayName;
  if (password !== null) json.password = password;
  try { await api("/admin/users/" + username, { json }); toast(username + " bijgewerkt"); }
  catch (e) { toast(e.message); }
}

async function resetSpend(username) {
  try { await api("/admin/users/" + username + "/reset-spend", { method: "POST" }); loadAdmin(); toast("krediet gereset"); }
  catch (e) { toast(e.message); }
}

async function resetAllSpend() {
  if (!confirm("het krediet van iedereen terugzetten op nul?")) return;
  try { await api("/admin/reset-all-spend", { method: "POST" }); loadAdmin(); toast("alle kredieten gereset"); }
  catch (e) { toast(e.message); }
}

/* -------------------------------- start --------------------------- */

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

boot();
