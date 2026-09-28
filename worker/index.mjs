#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════════
 *  Story Maker — WhatsApp Status Bridge Daemon  (PRD §3.4 / Task 5.1)
 * ════════════════════════════════════════════════════════════════════════
 *  • Runs on your own computer / free mini VPS (residential IP → low ban risk).
 *  • Authenticates to WhatsApp Web with a QR code (Baileys multi-device).
 *  • Every POLL_INTERVAL_SECONDS (default 60s) asks the Story Maker API for
 *    SCHEDULED slides whose time has come, posts them to WhatsApp Status via
 *    sock.sendMessage('status@broadcast', { image, caption }, { statusJidList })
 *    and acknowledges the result.
 *  • Security: talks to the portal over HTTPS with a shared bearer secret —
 *    no database credentials ever live on this machine.
 * ════════════════════════════════════════════════════════════════════════
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

const VERSION = "1.0.0";
const CONFIG = {
  apiUrl: (process.env.STORY_MAKER_URL || "http://localhost:3000").replace(/\/+$/, ""),
  secret: process.env.WORKER_SECRET || "",
  pollMs: Math.max(15, Number(process.env.POLL_INTERVAL_SECONDS) || 60) * 1000,
  authDir: path.resolve(process.env.WA_AUTH_DIR || "./auth_info_baileys"),
  contactsFile: path.resolve(process.env.WA_CONTACTS_FILE || "./contacts.json"),
  audience: (process.env.WA_STATUS_AUDIENCE || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  dispatchInstagram: process.env.DISPATCH_INSTAGRAM !== "false",
  dryRun: process.env.DRY_RUN === "true",
  logLevel: process.env.LOG_LEVEL || "silent",
};

const log = (...args) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args);

if (!CONFIG.secret) {
  console.error("✖ WORKER_SECRET wajib diisi dan harus sama dengan WORKER_SECRET di server Story Maker.");
  process.exit(1);
}

// ── Contact store → statusJidList (who can see the Status) ─────────────────
const contacts = new Set();
let saveTimer = null;

async function loadContacts() {
  try {
    const raw = JSON.parse(await fs.readFile(CONFIG.contactsFile, "utf8"));
    if (Array.isArray(raw)) raw.forEach((jid) => contacts.add(jid));
    log(`📇 ${contacts.size} kontak dimuat dari cache`);
  } catch {
    /* first run */
  }
}

function addContact(jid) {
  if (typeof jid !== "string" || !/@(s\.whatsapp\.net|lid)$/.test(jid)) return;
  const before = contacts.size;
  contacts.add(jid);
  if (contacts.size !== before) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fs.writeFile(CONFIG.contactsFile, JSON.stringify([...contacts])).catch(() => undefined);
    }, 2_000);
  }
}

const normalizeJid = (jid) => (jid ? jid.replace(/:\d+@/, "@") : null);
const phoneToJid = (value) => {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? `${digits}@s.whatsapp.net` : null;
};

function statusAudience(meJid) {
  const list = CONFIG.audience.length ? CONFIG.audience.map(phoneToJid).filter(Boolean) : [...contacts];
  if (meJid) list.push(meJid);
  return [...new Set(list)];
}

// ── Story Maker API bridge ─────────────────────────────────────────────────
async function api(pathname, { method = "GET", body } = {}) {
  const res = await fetch(`${CONFIG.apiUrl}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${CONFIG.secret}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(90_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

async function fetchImage(item) {
  const url = item.imagePath ? `${CONFIG.apiUrl}${item.imagePath}` : item.imageUrl;
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Gagal mengambil gambar slide (HTTP ${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// ── WhatsApp socket ────────────────────────────────────────────────────────
let sock = null;
let connected = false;
let meJid = null;
let busy = false;
let reconnectAttempts = 0;

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(CONFIG.authDir);
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch {
    version = undefined;
  }

  sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: CONFIG.logLevel }),
    browser: Browsers.macOS("Desktop"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      log("📱 Scan QR berikut: WhatsApp → Perangkat tertaut → Tautkan perangkat");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      connected = true;
      reconnectAttempts = 0;
      meJid = normalizeJid(sock.user?.id ?? null);
      log(`✅ Terhubung ke WhatsApp sebagai ${meJid}`);
      void tick();
    }
    if (connection === "close") {
      connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        log("⚠ Sesi WhatsApp logout — menghapus sesi lama, QR baru akan muncul…");
        await fs.rm(CONFIG.authDir, { recursive: true, force: true });
      }
      const delay = Math.min(30_000, 2_000 * 2 ** reconnectAttempts++);
      log(`↻ Koneksi tertutup (kode ${code ?? "?"}) — reconnect dalam ${Math.round(delay / 1000)} detik`);
      setTimeout(() => connect().catch((err) => log("✖ Reconnect gagal:", err.message)), delay);
    }
  });

  sock.ev.on("contacts.upsert", (list) => list.forEach((c) => addContact(c.id)));
  sock.ev.on("contacts.update", (list) => list.forEach((c) => addContact(c.id)));
  sock.ev.on("chats.upsert", (list) => list.forEach((c) => addContact(c.id)));
  sock.ev.on("messaging-history.set", ({ contacts: list = [], chats = [] }) => {
    list.forEach((c) => addContact(c.id));
    chats.forEach((c) => addContact(c.id));
  });
}

// ── Dispatch loop ──────────────────────────────────────────────────────────
async function postWhatsapp(item) {
  try {
    const image = await fetchImage(item);
    const audience = statusAudience(meJid);
    if (CONFIG.dryRun) {
      log(`🧪 [DRY RUN] ${item.label} → ${audience.length} penerima (${image.length} bytes)`);
    } else {
      await sock.sendMessage("status@broadcast", { image, caption: item.caption }, { broadcast: true, statusJidList: audience });
    }
    await api("/api/worker/ack", { method: "POST", body: { slideId: item.id, channel: "whatsapp", ok: true } });
    log(`✅ WA Status terkirim: ${item.label} → ${audience.length} penerima`);
  } catch (err) {
    log(`✖ WA Status gagal: ${item.label} — ${err.message}`);
    await api("/api/worker/ack", {
      method: "POST",
      body: { slideId: item.id, channel: "whatsapp", ok: false, error: String(err.message).slice(0, 900) },
    }).catch(() => undefined);
  }
}

async function postInstagram(item) {
  try {
    const result = await api("/api/dispatch/instagram", { method: "POST", body: { slideId: item.id } });
    if (result.ok && !result.skipped) log(`✅ IG Story terpublikasi: ${item.label}`);
  } catch (err) {
    if (!/diproses oleh proses lain/i.test(err.message)) log(`✖ IG Story gagal: ${item.label} — ${err.message}`);
  }
}

async function tick() {
  if (busy) return;
  busy = true;
  try {
    const params = new URLSearchParams({
      connected: connected ? "1" : "0",
      me: meJid ? meJid.split("@")[0] : "",
      version: VERSION,
    });
    const { items = [] } = await api(`/api/worker/queue?${params}`);
    if (items.length) log(`📬 ${items.length} slide jatuh tempo`);
    for (const item of items) {
      if (item.postToWhatsapp && !item.waPosted && item.waLeased && connected) await postWhatsapp(item);
      if (CONFIG.dispatchInstagram && item.postToInstagram && !item.igPosted) await postInstagram(item);
    }
  } catch (err) {
    log("✖ Polling gagal:", err.message);
  } finally {
    busy = false;
  }
}

async function main() {
  log(`🧠 Story Maker WA Daemon v${VERSION} → ${CONFIG.apiUrl} (poll ${CONFIG.pollMs / 1000}s${CONFIG.dryRun ? ", DRY RUN" : ""})`);
  if (CONFIG.audience.length) log(`👥 Audiens Status dibatasi ke ${CONFIG.audience.length} nomor (WA_STATUS_AUDIENCE)`);
  await loadContacts();
  try {
    await api(`/api/worker/queue?connected=0&version=${VERSION}`);
    log("🔐 Terautentikasi ke Story Maker API");
  } catch (err) {
    log("⚠ Belum bisa menghubungi Story Maker API:", err.message);
  }
  await connect();
  setInterval(() => void tick(), CONFIG.pollMs);
}

process.on("SIGINT", () => {
  log("👋 Daemon dimatikan.");
  process.exit(0);
});

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
