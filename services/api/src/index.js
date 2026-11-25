import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import db, { purgeExpiredMessages, RETENTION_DAYS } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT) || 8787;

app.use(cors());
app.use(express.json({ limit: "32kb" }));

/** Stub auth: Bearer token → user row. Not production-grade. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }
  const user = db.prepare("SELECT * FROM users WHERE token = ?").get(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.user = user;
  next();
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "whatsapp-kids-api",
    retentionDays: RETENTION_DAYS,
  });
});

/**
 * Stub login — pick a role and display name; get a bearer token.
 * Body: { role: "kid" | "parent", displayName: string }
 */
app.post("/auth/login", (req, res) => {
  const role = req.body?.role;
  const displayName = String(req.body?.displayName || "").trim();
  if (role !== "kid" && role !== "parent") {
    return res.status(400).json({ error: 'role must be "kid" or "parent"' });
  }
  if (!displayName || displayName.length > 64) {
    return res
      .status(400)
      .json({ error: "displayName required (1–64 chars)" });
  }

  const id = uuid();
  const token = uuid();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, role, display_name, token, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, role, displayName, token, createdAt);

  res.status(201).json({
    token,
    user: { id, role, displayName, createdAt },
    note: "Stub auth only — tokens are opaque UUIDs stored in SQLite.",
  });
});

/** List messages. Purges rows older than RETENTION_DAYS first. */
app.get("/messages", requireAuth, (_req, res) => {
  const purge = purgeExpiredMessages();
  const messages = db
    .prepare(
      `SELECT id, sender_id AS senderId, sender_name AS senderName, body, created_at AS createdAt
       FROM messages
       ORDER BY created_at ASC`
    )
    .all();
  res.json({
    retentionDays: RETENTION_DAYS,
    purged: purge,
    messages,
  });
});

/** Send a message. Body: { body: string } */
app.post("/messages", requireAuth, (req, res) => {
  const body = String(req.body?.body || "").trim();
  if (!body || body.length > 4000) {
    return res.status(400).json({ error: "body required (1–4000 chars)" });
  }

  const id = uuid();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (id, sender_id, sender_name, body, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, req.user.id, req.user.display_name, body, createdAt);

  res.status(201).json({
    id,
    senderId: req.user.id,
    senderName: req.user.display_name,
    body,
    createdAt,
  });
});

/** Explicit retention purge (any authenticated user in v0). */
app.post("/admin/purge", requireAuth, (_req, res) => {
  res.json(purgeExpiredMessages());
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal error" });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`whatsapp-kids api on http://127.0.0.1:${PORT}`);
  console.log(`retention: ${RETENTION_DAYS} days (purge on GET /messages)`);
});
