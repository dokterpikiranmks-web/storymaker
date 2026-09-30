#!/usr/bin/env node
import fs from "fs";
import gracefulFs from "graceful-fs";
gracefulFs.gracefulify(fs);

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
import path from "node:path";
import { fileURLToPath } from "node:url";
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";

const fsp = fs.promises;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VERSION = "1.0.0";
const CONFIG = {
  apiUrl: (process.env.STORY_MAKER_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, ""),
  secret: process.env.WORKER_SECRET || "",
  pollMs: Math.max(15, Number(process.env.POLL_INTERVAL_SECONDS) || 60) * 1000,
  authDir: path.resolve(process.env.WA_AUTH_DIR || path.join(__dirname, "auth_info_baileys")),
  contactsFile: path.resolve(process.env.WA_CONTACTS_FILE || path.join(__dirname, "contacts.json")),
  audience: (process.env.WA_STATUS_AUDIENCE || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  dispatchInstagram: process.env.DISPATCH_INSTAGRAM !== "false",
  dryRun: process.env.DRY_RUN === "true",
  logLevel: process.env.LOG_LEVEL || "silent",
  timezone: process.env.APP_TIMEZONE || "Asia/Jakarta",
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
    const raw = JSON.parse(await fsp.readFile(CONFIG.contactsFile, "utf8"));
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
      fsp.writeFile(CONFIG.contactsFile, JSON.stringify([...contacts])).catch(() => undefined);
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

// ── Auth cache & concurrency limiter (EMFILE protection) ───────────────────
/**
 * In-memory cache layer & concurrency limiter for Baileys auth state keys.
 * Caches sessions, sender-keys, pre-keys, etc. in memory (including nulls for missing files)
 * and throttles file reads/writes to small batches (default 50) to prevent EMFILE
 * errors when broadcasting to 7,000+ contacts.
 */
function makeCachedAuthState(state, { batchSize = 50 } = {}) {
  const cache = new Map();
  const originalGet = state.keys.get.bind(state.keys);
  const originalSet = state.keys.set.bind(state.keys);

  state.keys = {
    ...state.keys,

    get: async (type, ids) => {
      const data = {};
      const missingIds = [];

      for (const id of ids) {
        const cacheKey = `${type}:${id}`;
        if (cache.has(cacheKey)) {
          const val = cache.get(cacheKey);
          data[id] = val;
        } else {
          missingIds.push(id);
        }
      }

      if (missingIds.length > 0) {
        for (let i = 0; i < missingIds.length; i += batchSize) {
          const chunk = missingIds.slice(i, i + batchSize);
          const chunkData = await originalGet(type, chunk);
          for (const id of chunk) {
            const val = chunkData[id] ?? null;
            cache.set(`${type}:${id}`, val);
            data[id] = val;
          }
        }
      }

      return data;
    },

    set: async (data) => {
      // 1. Synchronously update in-memory cache
      const entries = [];
      for (const category of Object.keys(data)) {
        for (const id of Object.keys(data[category])) {
          const value = data[category][id];
          cache.set(`${category}:${id}`, value ?? null);
          entries.push({ category, id, value });
        }
      }

      // 2. Persist to disk in bounded batches to prevent EMFILE
      for (let i = 0; i < entries.length; i += batchSize) {
        const chunk = entries.slice(i, i + batchSize);
        const chunkData = {};
        for (const { category, id, value } of chunk) {
          if (!chunkData[category]) chunkData[category] = {};
          chunkData[category][id] = value;
        }
        await originalSet(chunkData);
      }
    },

    clear: async () => {
      cache.clear();
      if (typeof state.keys.clear === "function") {
        await state.keys.clear();
      }
    },
  };

  return state;
}

// ── WhatsApp socket ────────────────────────────────────────────────────────
let sock = null;
let connected = false;
let meJid = null;
let busy = false;
let reconnectAttempts = 0;

async function connect() {
  const { state: rawState, saveCreds } = await useMultiFileAuthState(CONFIG.authDir);
  const state = makeCachedAuthState(rawState, { batchSize: 50 });
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
        await fsp.rm(CONFIG.authDir, { recursive: true, force: true });
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

/**
 * Memeriksa apakah slide siap diposting:
 * 1. Jika ada instruksi force post (forcePost === true, force === true, atau status === "READY_TO_POST") -> langsung kirim!
 * 2. Jika status SCHEDULED, periksa waktu:
 *    - scheduledAt (ISO string UTC) dibandingkan dengan Date.now() (UTC).
 *    - Fallback targetTime (HH:MM / HH:MM:SS) dibandingkan dengan jam lokal WIB (Asia/Jakarta)
 *      agar terhindar dari bug pembanding waktu WIB vs UTC.
 */
function checkDue(item) {
  const isForce = Boolean(item.forcePost || item.force || item.status === "READY_TO_POST");
  if (isForce) {
    return { due: true, isForce: true, reason: "instruksi force post" };
  }

  if (item.status && item.status !== "SCHEDULED") {
    return { due: false, isForce: false, reason: `status: ${item.status}` };
  }

  // 1. Cek scheduledAt (ISO UTC timestamp)
  if (item.scheduledAt) {
    const scheduledTime = new Date(item.scheduledAt).getTime();
    if (Number.isFinite(scheduledTime)) {
      if (scheduledTime <= Date.now()) {
        return { due: true, isForce: false, reason: `jadwal tercapai (${item.scheduledAt})` };
      }
      return { due: false, isForce: false, reason: `belum waktu tayang (${item.scheduledAt})` };
    }
  }

  // 2. Fallback cek targetTime terhadap jam lokal di zona waktu target (default Asia/Jakarta / WIB)
  if (item.targetTime) {
    const tz = CONFIG.timezone || "Asia/Jakarta";
    const nowTimeStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

    const target = item.targetTime.length === 5 ? `${item.targetTime}:00` : item.targetTime;
    if (target <= nowTimeStr) {
      return { due: true, isForce: false, reason: `targetTime ${target} <= ${nowTimeStr} (${tz})` };
    }
    return { due: false, isForce: false, reason: `targetTime ${target} > ${nowTimeStr} (${tz})` };
  }

  return { due: true, isForce: false, reason: "siap diproses" };
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
    if (items.length) log(`📬 ${items.length} slide diterima dari antrean`);
    for (const item of items) {
      const check = checkDue(item);
      if (!check.due) {
        log(`⏳ Slide ${item.label || item.id} dilewati (${check.reason})`);
        continue;
      }

      if (check.isForce) {
        log(`⚡ Force post diproses: ${item.label || item.id}`);
      }

      if (item.postToWhatsapp && !item.waPosted) {
        if (!connected) {
          log(`⚠ WhatsApp belum terhubung — ${item.label || item.id} menunggu koneksi WA`);
        } else if (item.waLeased || check.isForce) {
          await postWhatsapp(item);
        }
      }

      if (CONFIG.dispatchInstagram && item.postToInstagram && !item.igPosted) {
        await postInstagram(item);
      }
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
