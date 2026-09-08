import { neon } from "@neondatabase/serverless";
import { createClerkClient } from "@clerk/backend";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};

let sqlClient = null;
function getSql() {
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

let clerkClient = null;
function getClerk() {
  if (!clerkClient) clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  return clerkClient;
}

async function requireUserId(req) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const payload = await getClerk().verifyToken(token);
    return payload.sub || null;
  } catch {
    return null;
  }
}

async function ensureSchema(sql) {
  await sql`CREATE TABLE IF NOT EXISTS positions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    qty DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS user_meta (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, key)
  )`;
}

function toValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(204).end();

  const userId = await requireUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const sql = getSql();
  try {
    await ensureSchema(sql);
  } catch (e) {
    console.error("schema", e);
    return res.status(500).json({ error: "Database unavailable" });
  }

  const resource = req.query.resource ? String(req.query.resource) : "";
  const key = req.query.key ? String(req.query.key) : null;
  const id = req.query.id ? parseInt(req.query.id, 10) : null;

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  try {
    if (resource === "positions") {
      if (req.method === "GET") {
        const rows = await sql`SELECT id, ticker, qty, price, date FROM positions WHERE user_id = ${userId} ORDER BY id ASC`;
        return res.status(200).json(
          rows.map((r) => ({ id: Number(r.id), ticker: r.ticker, qty: Number(r.qty), price: Number(r.price), date: r.date }))
        );
      }
      if (req.method === "POST") {
        const { ticker, qty, price, date } = body;
        if (!ticker || !(Number(qty) > 0) || !(Number(price) >= 0)) {
          return res.status(400).json({ error: "Invalid position" });
        }
        const rows = await sql`INSERT INTO positions (user_id, ticker, qty, price, date) VALUES (${userId}, ${ticker}, ${Number(qty)}, ${Number(price)}, ${date || null}) RETURNING id, ticker, qty, price, date`;
        const r = rows[0];
        return res.status(201).json({ id: Number(r.id), ticker: r.ticker, qty: Number(r.qty), price: Number(r.price), date: r.date });
      }
      if (req.method === "PUT" || req.method === "DELETE") {
        if (!Number.isInteger(id)) return res.status(400).json({ error: "Missing id" });
        if (req.method === "DELETE") {
          await sql`DELETE FROM positions WHERE id = ${id} AND user_id = ${userId}`;
          return res.status(204).end();
        }
        const { qty, price } = body;
        if (!(Number(qty) > 0) || !(Number(price) >= 0)) {
          return res.status(400).json({ error: "Invalid position" });
        }
        const rows = await sql`UPDATE positions SET qty = ${Number(qty)}, price = ${Number(price)} WHERE id = ${id} AND user_id = ${userId} RETURNING id, ticker, qty, price, date`;
        if (!rows.length) return res.status(404).json({ error: "Not found" });
        const r = rows[0];
        return res.status(200).json({ id: Number(r.id), ticker: r.ticker, qty: Number(r.qty), price: Number(r.price), date: r.date });
      }
    }

    if (resource === "meta") {
      if (req.method === "GET") {
        if (!key) return res.status(400).json({ error: "Missing key" });
        const rows = await sql`SELECT key, value FROM user_meta WHERE user_id = ${userId} AND key = ${key}`;
        if (!rows.length) return res.status(404).json({ error: "Not found" });
        return res.status(200).json({ key: rows[0].key, value: toValue(rows[0].value) });
      }
      if (req.method === "POST") {
        const metaKey = body.key || key;
        if (!metaKey) return res.status(400).json({ error: "Missing key" });
        const rows = await sql`INSERT INTO user_meta (user_id, key, value) VALUES (${userId}, ${metaKey}, ${JSON.stringify(body.value)}::jsonb) ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now() RETURNING key, value`;
        return res.status(200).json({ key: rows[0].key, value: toValue(rows[0].value) });
      }
    }

    return res.status(405).json({ error: "Method or resource not allowed" });
  } catch (e) {
    console.error("data", e);
    return res.status(500).json({ error: "Internal error" });
  }
}
