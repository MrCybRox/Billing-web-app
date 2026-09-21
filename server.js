/**
 * Food Shop Billing — License / Admin Server
 * ------------------------------------------
 * Stores your clients (shop name, access code, expiry, enabled/disabled)
 * in a simple JSON file (data/clients.json). No external database needed.
 *
 * Run locally:   npm install   then   npm start
 * Then open:     http://localhost:3000/admin
 *
 * Default admin password: admin123   (CHANGE THIS after first login)
 */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "data");
const CLIENTS_FILE = path.join(DATA_DIR, "clients.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLIENTS_FILE)) fs.writeFileSync(CLIENTS_FILE, "[]");
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ adminPassword: "admin123" }, null, 2));
}

function readJSON(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function writeJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ---- very simple in-memory session tokens (reset on server restart) ----
const sessions = new Set();
function newToken() { return crypto.randomBytes(24).toString("hex"); }
function requireAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token && sessions.has(token)) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ---------------- Admin auth ----------------
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  const config = readJSON(CONFIG_FILE);
  if (password !== config.adminPassword) {
    return res.status(401).json({ error: "Galat password" });
  }
  const token = newToken();
  sessions.add(token);
  res.json({ token });
});

app.post("/api/admin/logout", requireAuth, (req, res) => {
  sessions.delete(req.headers["x-admin-token"]);
  res.json({ ok: true });
});

app.post("/api/admin/change-password", requireAuth, (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "Password kam az kam 4 characters ka ho" });
  }
  const config = readJSON(CONFIG_FILE);
  config.adminPassword = newPassword;
  writeJSON(CONFIG_FILE, config);
  res.json({ ok: true });
});

// ---------------- Client management (protected) ----------------
app.get("/api/admin/clients", requireAuth, (req, res) => {
  res.json(readJSON(CLIENTS_FILE));
});

app.post("/api/admin/clients", requireAuth, (req, res) => {
  const clients = readJSON(CLIENTS_FILE);
  const { shopName, code, expiry, enabled, notes } = req.body || {};
  if (!shopName || !code || !expiry) {
    return res.status(400).json({ error: "shopName, code aur expiry zaroori hain" });
  }
  if (clients.some(c => c.code === code)) {
    return res.status(400).json({ error: "Ye access code pehle se kisi client ko diya hua hai" });
  }
  const client = {
    id: crypto.randomBytes(8).toString("hex"),
    shopName, code, expiry,
    enabled: enabled !== false,
    notes: notes || "",
    createdAt: new Date().toISOString(),
    lastCheckIn: null
  };
  clients.push(client);
  writeJSON(CLIENTS_FILE, clients);
  res.json(client);
});

app.put("/api/admin/clients/:id", requireAuth, (req, res) => {
  const clients = readJSON(CLIENTS_FILE);
  const idx = clients.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Client nahi mila" });
  const { shopName, code, expiry, enabled, notes } = req.body || {};
  if (code && clients.some(c => c.code === code && c.id !== req.params.id)) {
    return res.status(400).json({ error: "Ye access code kisi aur client ke paas hai" });
  }
  if (shopName !== undefined) clients[idx].shopName = shopName;
  if (code !== undefined) clients[idx].code = code;
  if (expiry !== undefined) clients[idx].expiry = expiry;
  if (enabled !== undefined) clients[idx].enabled = enabled;
  if (notes !== undefined) clients[idx].notes = notes;
  writeJSON(CLIENTS_FILE, clients);
  res.json(clients[idx]);
});

app.delete("/api/admin/clients/:id", requireAuth, (req, res) => {
  let clients = readJSON(CLIENTS_FILE);
  clients = clients.filter(c => c.id !== req.params.id);
  writeJSON(CLIENTS_FILE, clients);
  res.json({ ok: true });
});

// ---------------- Public: license check (called by the billing app) ----------------
app.get("/api/check", (req, res) => {
  const code = (req.query.code || "").trim();
  const clients = readJSON(CLIENTS_FILE);
  const client = clients.find(c => c.code === code);
  if (!client) {
    return res.json({ valid: false, message: "Access code nahi mila." });
  }
  client.lastCheckIn = new Date().toISOString();
  writeJSON(CLIENTS_FILE, clients);

  const today = new Date().toISOString().slice(0, 10);
  if (!client.enabled) {
    return res.json({ valid: false, message: "Ye software band kar diya gaya hai. Vendor se rabta karein." });
  }
  if (today > client.expiry) {
    return res.json({ valid: false, message: "Access code expire ho chuka hai. Vendor se naya code lein.", expiry: client.expiry });
  }
  return res.json({ valid: true, expiry: client.expiry, shopName: client.shopName });
});

// ---------------- Serve the admin panel ----------------
app.use("/admin", express.static(path.join(__dirname, "public", "admin")));

app.get("/", (req, res) => res.redirect("/admin"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Food Shop license server running on port " + PORT));
