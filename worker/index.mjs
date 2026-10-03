#!/usr/bin/env node
// 🛡️ [SHIELD] Global Crash Guard di baris paling atas agar worker tidak pernah mati karena unhandled error
process.on("uncaughtException", (err) => console.error("🛡️ [SHIELD] Uncaught Exception:", err));
process.on("unhandledRejection", (reason) => console.error("🛡️ [SHIELD] Unhandled Rejection:", reason));

import fs from "fs";
import http from "http";
import gracefulFs from "graceful-fs";
gracefulFs.gracefulify(fs);

/**
 * ════════════════════════════════════════════════════════════════════════
 *  Story Maker — WhatsApp Status Bridge Daemon  (PRD §3.4 / Task 5.1)
 * ════════════════════════════════════════════════════════════════════════
 *  • Runs on your own computer / free mini VPS (residential IP → low ban risk).
 *  • Authenticates to WhatsApp Web with a QR code (Baileys multi-device).
 *  • Robust auto-reconnect on connection.update + 60s Watchdog heartbeat.
 *  • Deep unwrapping inbound auto-responder (RESET / VAGUS / SOMATIK / etc).
 *  • Real-time & catch-up dispatch for today's scheduled campaign slides.
 *  • Security: talks to the portal over HTTPS with a shared bearer secret.
 * ════════════════════════════════════════════════════════════════════════
 */
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import { getDbPool, useSupabaseAuthState } from "./supabase-auth.mjs";
import pino from "pino";
import qrcode from "qrcode-terminal";

const fsp = fs.promises;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VERSION = "1.0.0";
const CONFIG = {
  apiUrl: (process.env.STORYMAKER_URL || process.env.STORY_MAKER_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://storymaker-jet.vercel.app").replace(/\/+$/, ""),
  storyMakerUrl: (process.env.STORYMAKER_URL || process.env.STORY_MAKER_URL || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://storymaker-jet.vercel.app").replace(/\/+$/, ""),
  secret: process.env.WORKER_SECRET || "",
  workerSecret: process.env.WORKER_SECRET || "",
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
  timezone: process.env.APP_TIMEZONE || "Asia/Makassar",
};

const log = (...args) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args);

// ── Health Check Server for Render / Cloud Web Services ──────────────────
const PORT = process.env.PORT || 10000;
const healthServer = http.createServer((req, res) => {
  try {
    const rawUrl = req.url || "/";
    const pathname = rawUrl.split("?")[0];

    // GET /ping - respons super cepat untuk keep-alive
    if (pathname === "/ping") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: "pong",
          timestamp: Date.now(),
          uptime: Math.round(process.uptime()),
        })
      );
    }

    // GET /health atau root kembalikan waConnected & uptime detail
    if (pathname === "/health" || pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          status: "ok",
          waConnected: connected,
          uptime: Math.round(process.uptime()),
          service: "Story Maker WhatsApp Daemon",
          timestamp: new Date().toISOString(),
          busy,
          lastTickStarted: lastTickStarted ? new Date(lastTickStarted).toISOString() : null,
        })
      );
    }

    if (pathname === "/post-now" || pathname === "/trigger") {
      log("⚡ Trigger /post-now diterima via HTTP server worker — menjalankan tick()");
      void tick();
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", message: "tick triggered" }));
    }

    // Default response 200 OK untuk path lain
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "Story Maker WhatsApp Daemon" }));
  } catch (httpErr) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "error", error: httpErr.message }));
  }
});

function startHealthServer() {
  healthServer.listen(PORT, "0.0.0.0", () => {
    log(`🌐 Health check server aktif di port ${PORT}`);
  });
}

// ── Internal Anti-Sleep Self-Ping (Render Web Service) ────────────────────
let selfPingInterval = null;

function startSelfPing() {
  const externalUrl = (process.env.RENDER_EXTERNAL_URL || process.env.WORKER_PUBLIC_URL || "").trim();
  if (!externalUrl) {
    log("ℹ️ [ANTI-SLEEP] RENDER_EXTERNAL_URL / WORKER_PUBLIC_URL tidak diset. Self-ping eksternal dinonaktifkan (mode lokal/VPS biasa).");
    return;
  }

  const pingUrl = `${externalUrl.replace(/\/+$/, "")}/health`;
  log(`⏰ [ANTI-SLEEP] Mengaktifkan self-ping keep-alive ke ${pingUrl} setiap 5 menit (300.000 ms)`);

  const doPing = async () => {
    try {
      const res = await fetch(pingUrl, {
        headers: { "User-Agent": "StoryMaker-AntiSleep-Worker/1.0" },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) {
        log(`🏓 [ANTI-SLEEP] Self-ping sukses (HTTP ${res.status}) — container tetap terjaga aktif.`);
      } else {
        log(`⚠️ [ANTI-SLEEP] Self-ping menerima respons HTTP ${res.status}`);
      }
    } catch (err) {
      log(`⚠️ [ANTI-SLEEP] Self-ping gagal (${err.message}) — container mungkin sedang spin-up.`);
    }
  };

  // Ping awal 15 detik setelah boot
  setTimeout(() => {
    void doPing().catch(() => undefined);
  }, 15_000);

  // Interval setiap 5 menit (300.000 ms)
  if (selfPingInterval) clearInterval(selfPingInterval);
  selfPingInterval = setInterval(() => {
    void doPing().catch((err) => log("⚠️ [ANTI-SLEEP] Unhandled self-ping error:", err?.message));
  }, 300_000);
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

// ── In-memory anti-spam debounce cache for inbound auto-responder (5 mins TTL) ──
const autoReplyCooldowns = new Map();
const DEBOUNCE_TTL_MS = 5 * 60 * 1000;

function isInDebounce(jid) {
  const now = Date.now();
  const expiresAt = autoReplyCooldowns.get(jid);
  return Boolean(expiresAt && expiresAt > now);
}

function setDebounce(jid) {
  const now = Date.now();
  autoReplyCooldowns.set(jid, now + DEBOUNCE_TTL_MS);
  if (autoReplyCooldowns.size > 2000) {
    for (const [k, v] of autoReplyCooldowns.entries()) {
      if (v <= now) autoReplyCooldowns.delete(k);
    }
  }
}

function isCoolingDown(jid) {
  if (isInDebounce(jid)) return true;
  setDebounce(jid);
  return false;
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
  const rawUrl = item.rendered_image_url || item.renderedImageUrl || item.imagePath || item.imageUrl;
  if (!rawUrl) throw new Error("URL gambar slide tidak tersedia");
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `${CONFIG.apiUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Gagal mengambil gambar slide (HTTP ${res.status}) dari ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Auth cache & concurrency limiter (EMFILE protection) ───────────────────
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
      const entries = [];
      for (const category of Object.keys(data)) {
        for (const id of Object.keys(data[category])) {
          const value = data[category][id];
          cache.set(`${category}:${id}`, value ?? null);
          entries.push({ category, id, value });
        }
      }

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

// ── Deep Inbound Message Extractor & Keyword Matcher ───────────────────────
const KEYWORDS = ["RESET", "VAGUS", "SOMATIK", "PANDUAN", "PROTOKOL", "KONSUL"];

function extractMessageText(msg) {
  return (
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    msg?.ephemeralMessage?.message?.extendedTextMessage?.text ||
    msg?.ephemeralMessage?.message?.conversation ||
    msg?.ephemeralMessage?.message?.imageMessage?.caption ||
    msg?.viewOnceMessage?.message?.extendedTextMessage?.text ||
    msg?.viewOnceMessage?.message?.conversation ||
    msg?.viewOnceMessageV2?.message?.extendedTextMessage?.text ||
    msg?.viewOnceMessageV2?.message?.conversation ||
    msg?.documentMessage?.caption ||
    ""
  );
}

function isKeywordMatched(text) {
  if (!text || typeof text !== "string") return false;
  const cleanText = text.trim().toUpperCase();
  return KEYWORDS.some((k) => cleanText.includes(k));
}

// ── Supabase Client Initialization & Historical Evergreen Lookup ───────────
let supabaseClient = null;
async function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return supabaseClient;
    } catch (err) {
      log("⚠️ [Supabase Client] Gagal import @supabase/supabase-js:", err.message);
    }
  }
  return null;
}

/**
 * Historical Evergreen Lookup:
 * Mencari kampanye (termasuk kampanye lampau) yang memiliki trigger_keyword cocok dengan teks.
 */
async function findCampaignByKeyword(keyword) {
  if (!keyword || typeof keyword !== "string") return null;
  const clean = keyword.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!clean || clean.length < 2) return null;

  // 1. Query ke Supabase via Supabase Client
  try {
    const sb = await getSupabaseClient();
    if (sb) {
      const { data, error } = await sb
        .from("daily_campaigns")
        .select("id, trigger_keyword, raw_input_notes, theme_topic")
        .eq("trigger_keyword", clean)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        const row = data[0];
        let protocol = null;
        if (row.raw_input_notes && row.raw_input_notes.includes("---LEAD_MAGNET_PROTOCOL_JSON---")) {
          try {
            protocol = JSON.parse(row.raw_input_notes.split("---LEAD_MAGNET_PROTOCOL_JSON---")[1].trim());
          } catch {}
        }
        return {
          id: row.id,
          trigger_keyword: row.trigger_keyword || clean,
          topic: row.theme_topic,
          lead_magnet_protocol: protocol,
        };
      }
    }
  } catch (sbErr) {
    log("⚠️ [Supabase Lookup Error]:", sbErr.message);
  }

  // 2. Query ke Supabase via direct PostgreSQL pool (getDbPool)
  try {
    const pool = getDbPool();
    if (pool) {
      const res = await pool.query(
        `SELECT id, trigger_keyword, theme_topic, raw_input_notes 
         FROM daily_campaigns 
         WHERE UPPER(trigger_keyword) = $1 
            OR raw_input_notes ILIKE $2
         ORDER BY created_at DESC 
         LIMIT 1`,
        [clean, `%"keyword":"${clean}"%`]
      );
      if (res.rows && res.rows.length > 0) {
        const row = res.rows[0];
        let protocol = null;
        if (row.raw_input_notes && row.raw_input_notes.includes("---LEAD_MAGNET_PROTOCOL_JSON---")) {
          try {
            protocol = JSON.parse(row.raw_input_notes.split("---LEAD_MAGNET_PROTOCOL_JSON---")[1].trim());
          } catch {}
        }
        return {
          id: row.id,
          trigger_keyword: row.trigger_keyword || clean,
          topic: row.theme_topic,
          lead_magnet_protocol: protocol,
        };
      }
    }
  } catch (pgErr) {
    log("⚠️ [Postgres Pool Lookup Error]:", pgErr.message);
  }

  // 3. Fallback via Next.js REST API (/api/campaigns/lookup)
  try {
    const baseUrl = CONFIG.storyMakerUrl || "https://storymaker-jet.vercel.app";
    const apiRes = await fetch(`${baseUrl}/api/campaigns/lookup?keyword=${encodeURIComponent(clean)}`, {
      headers: {
        Authorization: `Bearer ${CONFIG.secret}`,
        "x-worker-secret": CONFIG.workerSecret || "",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.matched && json.campaign) {
        return json.campaign;
      }
    }
  } catch (apiErr) {
    log("⚠️ [API Lookup Error]:", apiErr.message);
  }

  return null;
}

// ── WhatsApp socket & Lifecycle ────────────────────────────────────────────
let sock = null;
let connected = false;
let meJid = null;
let busy = false;
let isConnecting = false;
let watchdogInterval = null;

async function startWorker() {
  if (isConnecting) {
    log("🔄 Koneksi sedang diproses, melewati pemanggilan ganda...");
    return;
  }
  isConnecting = true;

  try {
    if (sock) {
      try {
        sock.ev?.removeAllListeners?.();
        sock.ws?.close?.();
      } catch {}
    }

    const { state: rawState, saveCreds } = await useSupabaseAuthState(CONFIG.authDir);
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

    // ── Robust Auto-Reconnect pada connection.update ───────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        log("📱 Scan QR berikut: WhatsApp → Perangkat tertaut → Tautkan perangkat");
        qrcode.generate(qr, { small: true });
      }
      if (connection === "open") {
        connected = true;
        meJid = normalizeJid(sock.user?.id ?? null);
        log(`✅ Terhubung ke WhatsApp sebagai ${meJid}`);
        void tick();
      }
      if (connection === "close") {
        connected = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        console.log(`⚠️ Koneksi terputus (Status: ${statusCode}). Reconnectable: ${!isLoggedOut}`);
        if (!isLoggedOut) {
          console.log("🔄 Menjadwalkan auto-reconnect dalam 5 detik...");
          setTimeout(() => {
            startWorker().catch((err) => log("✖ Reconnect gagal:", err.message));
          }, 5000);
        } else {
          console.error("❌ Sesi WhatsApp Logged Out! Perlu login ulang.");
          try {
            const pool = getDbPool();
            if (pool) await pool.query("DELETE FROM wa_auth_store WHERE id = 'creds'");
          } catch {}
          await fsp.rm(CONFIG.authDir, { recursive: true, force: true }).catch(() => undefined);
        }
      }
    });

    sock.ev.on("contacts.upsert", (list) => list.forEach((c) => addContact(c.id)));
    sock.ev.on("contacts.update", (list) => list.forEach((c) => addContact(c.id)));
    sock.ev.on("chats.upsert", (list) => list.forEach((c) => addContact(c.id)));
    sock.ev.on("messaging-history.set", ({ contacts: list = [], chats = [] }) => {
      list.forEach((c) => addContact(c.id));
      chats.forEach((c) => addContact(c.id));
    });

    // ── Bulletproof Inbound Parser & Auto-Responder ────────────────────────
    sock.ev.on('messages.upsert', async (upsert) => {
      const { messages, type } = upsert;
      if (!messages || !Array.isArray(messages)) return;

      for (const m of messages) {
        // 1. Abaikan pesan dari akun sendiri & status broadcast
        if (m.key?.fromMe) continue;
        const remoteJid = m.key?.remoteJid || '';
        if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') continue;

        // 2. Ekstraksi naskah dari m.message (dengan penanganan unwrapping lengkap)
        const msg = m.message;
        if (!msg) continue;

        const rawText = msg.conversation ||
                        msg.extendedTextMessage?.text ||
                        msg.imageMessage?.caption ||
                        msg.videoMessage?.caption ||
                        msg.ephemeralMessage?.message?.extendedTextMessage?.text ||
                        msg.ephemeralMessage?.message?.conversation ||
                        msg.viewOnceMessage?.message?.extendedTextMessage?.text ||
                        '';

        const cleanText = rawText.trim().toUpperCase();
        if (!cleanText) continue;
        console.log(`📩 [INBOUND REAL-TIME] Dari: ${remoteJid} | Teks: "${rawText}"`);

        // Logika Pencocokan Berlapis
        // Tahap 1: Query ke Supabase / DB / API untuk mencari kampanye (termasuk kampanye lampau) yang memiliki trigger_keyword cocok
        let matchedCampaign = await findCampaignByKeyword(cleanText);
        let matchedKeyword = cleanText;

        if (!matchedCampaign) {
          // Cari kata per kata jika audiens mengetik kalimat (misal: "Ketik LEHER" atau "Saya mau modul LAMBUNG")
          const words = cleanText.split(/[\s,.:;!?-]+/).filter((w) => w.length >= 3);
          for (const w of words) {
            const found = await findCampaignByKeyword(w);
            if (found) {
              matchedCampaign = found;
              matchedKeyword = w;
              break;
            }
          }
        }

        // Tahap 2: Jika ditemukan kampanye yang cocok
        if (matchedCampaign) {
          console.log(`🎯 [TRIGGER MATCHED] Kampanye cocok ditemukan untuk kata kunci "${matchedKeyword}" (${matchedCampaign.topic || "spesifik"})!`);

          // Cek in-memory debounce anti-spam (5 menit TTL)
          if (isInDebounce(remoteJid)) {
            console.log(`⏳ [DEBOUNCE] ${remoteJid} dalam masa tenang. Lewati.`);
            continue;
          }
          setDebounce(remoteJid);

          const topicTitle = matchedCampaign.topic || matchedKeyword;
          const safeKey = matchedKeyword.replace(/[^A-Za-z0-9]/g, "") || "Protokol";

          // 2.a Kirim pesan teks hangat
          try {
            await sock.sendMessage(remoteJid, {
              text: `Halo! Salam hangat dari Dokter Pikiran. 🌿\n\nBerikut panduan saku praktis terkait ${topicTitle} yang Anda minta. Silakan pelajari dan terapkan langkahnya.`
            });
            console.log(`✅ [INBOUND SENT] Pesan teks pendahuluan berhasil dikirim ke ${remoteJid}`);
          } catch (err) {
            console.error(`❌ Gagal kirim teks inbound:`, err);
          }

          // 2.b Ambil buffer PDF dengan parameter campaignId: ${baseUrl}/api/protocol/pdf?campaignId=${matchedCampaign.id}
          try {
            const baseUrl = CONFIG.storyMakerUrl || 'https://storymaker-jet.vercel.app';
            const pdfUrl = `${baseUrl}/api/protocol/pdf?campaignId=${encodeURIComponent(matchedCampaign.id)}`;
            const pdfRes = await fetch(pdfUrl, { headers: { 'x-worker-secret': CONFIG.workerSecret || '' } });
            if (pdfRes.ok) {
              const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
              await sock.sendMessage(remoteJid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `Panduan_${safeKey}_DokterPikiran.pdf`,
                caption: `📄 Panduan Saku Praktis: ${topicTitle} (PDF)`
              });
              console.log(`✅ [PDF SENT] File PDF dinamis Panduan_${safeKey}_DokterPikiran.pdf berhasil dikirim ke ${remoteJid}`);
            } else {
              console.warn(`⚠️ Respons PDF HTTP ${pdfRes.status} untuk campaignId ${matchedCampaign.id}`);
            }
          } catch (pdfErr) {
            console.error(`⚠️ Gagal kirim PDF dokumen spesifik:`, pdfErr);
          }
          continue;
        }

        // Tahap 3 (Fallback Universal):
        // Jika cleanText mencakup kata kunci umum ('RESET', 'KONSUL', 'PANDUAN', 'SOMATIK', 'VAGUS'), layani dengan kampanye aktif hari ini atau protokol somatik default Dokter Pikiran.
        const FALLBACK_KEYWORDS = ['RESET', 'KONSUL', 'PANDUAN', 'SOMATIK', 'VAGUS', 'PROTOKOL'];
        const isFallback = FALLBACK_KEYWORDS.some(k => cleanText.includes(k));

        if (isFallback) {
          console.log(`🎯 [UNIVERSAL FALLBACK] Kata kunci umum cocok untuk ${remoteJid}! Memproses balasan...`);

          // Cek in-memory debounce anti-spam (5 menit TTL)
          if (isInDebounce(remoteJid)) {
            console.log(`⏳ [DEBOUNCE] ${remoteJid} dalam masa tenang. Lewati.`);
            continue;
          }
          setDebounce(remoteJid);

          // LANGKAH 1: Balas pesan teks hangat dari Dokter Pikiran
          try {
            await sock.sendMessage(remoteJid, {
              text: `Halo! Salam hangat dari Dokter Pikiran. 🌿\n\nTerima kasih sudah merespons. Berikut ringkasan protokol somatik & reset saraf vagus yang bisa Anda praktikkan:\n\n1. Rilekskan otot leher belakang di cekungan pangkal tengkorak (titik GB-20).\n2. Tarik napas diafragma 4 detik, tahan 7 detik, hembuskan perlahan 8 detik.\n3. Beri afirmasi ketenangan pada tubuh untuk istirahat lelap.\n\nDokumen panduan lengkap PDF sedang dikirimkan di bawah ini...`
            });
            console.log(`✅ [INBOUND SENT] Pesan teks pendahuluan berhasil dikirim ke ${remoteJid}`);
          } catch (err) {
            console.error(`❌ Gagal kirim teks inbound:`, err);
          }

          // LANGKAH 2: Kirim PDF dokumen dari Vercel
          try {
            const baseUrl = CONFIG.storyMakerUrl || 'https://storymaker-jet.vercel.app';
            const pdfRes = await fetch(`${baseUrl}/api/protocol/pdf`, { headers: { 'x-worker-secret': CONFIG.workerSecret || '' } });
            if (pdfRes.ok) {
              const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
              await sock.sendMessage(remoteJid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: 'Panduan_Protokol_DokterPikiran.pdf',
                caption: '📄 Panduan Saku Somatik & Regulasi Saraf Vagus (PDF)'
              });
              console.log(`✅ [PDF SENT] File PDF universal berhasil dikirim ke ${remoteJid}`);
            }
          } catch (pdfErr) {
            console.error(`⚠️ Gagal kirim PDF dokumen:`, pdfErr);
          }
        }
      }
    });
  } catch (err) {
    log("✖ Gagal menginisialisasi Baileys socket:", err.message);
  } finally {
    isConnecting = false;
  }
}

const connect = startWorker;

// ── Watchdog / Heartbeat Loop (60 Detik) ───────────────────────────────────
function startWatchdog() {
  if (watchdogInterval) clearInterval(watchdogInterval);
  watchdogInterval = setInterval(() => {
    const isSocketOpen = Boolean(connected && sock && sock?.ws?.readyState === 1);
    if (!isSocketOpen && !isConnecting) {
      log("🐕 [WATCHDOG] Baileys socket tidak aktif / belum terhubung. Memicu inisialisasi ulang...");
      startWorker().catch((err) => log("✖ [WATCHDOG] Reconnect error:", err.message));
    }
  }, 60_000);
}

// ── Dispatch loop ──────────────────────────────────────────────────────────
async function postWhatsapp(slide) {
  try {
    const targetChatJid = process.env.TARGET_CHAT_JID || "62811443327@s.whatsapp.net";
    const imageBuffer = await fetchImage(slide);
    const actNumber = slide.actNumber || slide.act_number || slide.act?.match(/\d+/)?.[0] || slide.label?.match(/Babak\s+(\d+)/i)?.[1] || "";
    const shortTitle = slide.actShortTitle || slide.label?.split("·")?.[2]?.trim() || "";
    const imageCaption = `📸 *[BABAK ${actNumber}${shortTitle ? `: ${shortTitle}` : ""}]*`;

    // Naskah caption lengkap murni untuk Quick-Copy
    const pureCaption = (
      slide.caption ||
      [slide.headline, slide.bodyText || slide.body_text, slide.callToAction || slide.call_to_action].filter(Boolean).join("\n\n")
    ).trim();

    if (CONFIG.dryRun) {
      log(`🧪 [DRY RUN] ${slide.label} → chat ${targetChatJid} (${imageBuffer.length} bytes + quick-copy bubble)`);
    } else {
      // Pesan 1: File poster gambar (1080x1920) dengan caption ringkas penanda babak (timeout 45s)
      const sendImgResult = await Promise.race([
        sock.sendMessage(targetChatJid, {
          image: imageBuffer,
          caption: imageCaption,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout 45s menunggu respons WhatsApp saat kirim poster")), 45_000)),
      ]);
      log(`📸 Poster babak terkirim ke chat ${targetChatJid} (Msg ID: ${sendImgResult?.key?.id || "unknown"})`);

      // Jeda 500ms agar urutan pesan rapi di WhatsApp (gambar di atas, teks caption di bawah)
      await new Promise((r) => setTimeout(r, 500));

      // Pesan 2: Quick-Copy Bubble (Hanya teks naskah caption lengkap murni, timeout 30s)
      if (pureCaption) {
        const sendTextResult = await Promise.race([
          sock.sendMessage(targetChatJid, {
            text: pureCaption,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout 30s menunggu respons WhatsApp saat kirim caption")), 30_000)),
        ]);
        log(`📝 Quick-copy caption terkirim ke chat ${targetChatJid} (Msg ID: ${sendTextResult?.key?.id || "unknown"})`);
      }
    }
    await api("/api/worker/ack", { method: "POST", body: { slideId: slide.id, channel: "whatsapp", ok: true } });
    log(`✅ WA Chat terkirim: ${slide.label} → ${targetChatJid}`);
  } catch (err) {
    log(`✖ WA Chat gagal: ${slide.label} — ${err.message}`);
    await api("/api/worker/ack", {
      method: "POST",
      body: { slideId: slide.id, channel: "whatsapp", ok: false, error: String(err.message).slice(0, 900) },
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

// ── Logika Catch-Up Hari Ini (Tanpa Batas 60 Menit) ─────────────────────────
function getLocalDateString(date = new Date(), timezone = CONFIG.timezone || "Asia/Makassar") {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return new Date(date).toISOString().slice(0, 10);
  }
}

/**
 * Memeriksa apakah slide siap diposting:
 * 1. Jika ada instruksi force post (forcePost === true, force === true, atau status === "READY_TO_POST") -> langsung kirim!
 * 2. Jika status SCHEDULED:
 *    - Selama item berasal dari campaign hari ini (tanggal lokal yang sama di zona waktu target),
 *      berstatus 'SCHEDULED', dan waktu tayangnya <= waktu sekarang (now), MAKA WAJIB DIKIRIM (isCatchUp = true).
 *    - Keterlambatan berapa menit pun (akibat Baileys offline / server restart) langsung diproses seketika.
 * 3. Fallback targetTime (HH:MM / HH:MM:SS) jika scheduledAt tidak tersedia dibandingkan dengan jam lokal WITA.
 */
function checkDue(item, now = Date.now()) {
  const isForce = Boolean(item.forcePost || item.force || item.status === "READY_TO_POST");
  if (isForce) {
    return { due: true, isForce: true, isCatchUp: false, reason: "instruksi force post" };
  }

  if (item.status && item.status !== "SCHEDULED") {
    return { due: false, isForce: false, isCatchUp: false, reason: `status: ${item.status}` };
  }

  const tz = CONFIG.timezone || "Asia/Makassar";
  const todayStr = getLocalDateString(now, tz);

  // 1. Cek scheduledAt (ISO UTC timestamp) dengan toleransi penuh untuk jadwal hari ini
  if (item.scheduledAt) {
    const scheduledDate = new Date(item.scheduledAt);
    const scheduledTime = scheduledDate.getTime();
    if (Number.isFinite(scheduledTime)) {
      if (scheduledTime <= now) {
        // Verifikasi item berasal dari campaign hari ini (tanggal lokal yang sama di zona waktu target)
        const rawItemDate = item.campaignDate || getLocalDateString(scheduledDate, tz);
        const itemDateStr = typeof rawItemDate === "string" ? rawItemDate.slice(0, 10) : getLocalDateString(rawItemDate, tz);
        const isToday = itemDateStr === todayStr;

        if (isToday) {
          const elapsedMs = now - scheduledTime;
          const elapsedMins = Math.round(elapsedMs / 60000);
          return {
            due: true,
            isForce: false,
            isCatchUp: elapsedMins > 0,
            reason:
              elapsedMins > 0
                ? `catch-up hari ini (${elapsedMins} menit lewat jadwal: ${item.scheduledAt})`
                : `jadwal tercapai (${item.scheduledAt})`,
          };
        }

        // Jika bukan campaign hari ini (misal sisa campaign kemarin), abaikan
        return {
          due: false,
          isForce: false,
          isCatchUp: false,
          reason: `bukan jadwal hari ini (${itemDateStr} vs ${todayStr})`,
        };
      }

      return { due: false, isForce: false, isCatchUp: false, reason: `belum waktu tayang (${item.scheduledAt})` };
    }
  }

  // 2. Fallback cek targetTime terhadap jam lokal di zona waktu target (default Asia/Makassar / WITA)
  if (item.targetTime) {
    const nowTimeStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(now));

    const target = item.targetTime.length === 5 ? `${item.targetTime}:00` : item.targetTime;
    if (target <= nowTimeStr) {
      return { due: true, isForce: false, isCatchUp: true, reason: `targetTime ${target} <= ${nowTimeStr} (${tz})` };
    }
    return { due: false, isForce: false, isCatchUp: false, reason: `targetTime ${target} > ${nowTimeStr} (${tz})` };
  }

  return { due: true, isForce: false, isCatchUp: false, reason: "siap diproses" };
}

let lastTickStarted = 0;

async function tick() {
  if (busy) {
    if (Date.now() - (lastTickStarted || 0) > 120_000) {
      log("⚠️ Watchdog: tick() berjalan > 2 menit, mematikan status busy secara paksa agar antrean tidak macet.");
      busy = false;
    } else {
      return;
    }
  }
  busy = true;
  lastTickStarted = Date.now();
  try {
    const params = new URLSearchParams({
      connected: connected ? "1" : "0",
      me: meJid ? meJid.split("@")[0] : "",
      version: VERSION,
    });
    let items = [];
    try {
      const response = await api(`/api/worker/queue?${params}`);
      items = response.items || [];
    } catch (apiErr) {
      log("✖ Gagal mengambil antrean worker dari API (network/database drop):", apiErr.message);
      return;
    }

    if (items.length) log(`📬 ${items.length} slide diterima dari antrean`);
    for (const item of items) {
      try {
        const check = checkDue(item);
        if (!check.due) {
          log(`⏳ Slide ${item.label || item.id} dilewati (${check.reason})`);
          continue;
        }

        if (check.isCatchUp) {
          log(`⏰ [CATCH-UP] Slide ${item.label || item.id} diproses dalam jendela toleransi: ${check.reason}`);
        }

        if (check.isForce) {
          log(`⚡ Force post diproses: ${item.label || item.id}`);
        }

        if (item.postToWhatsapp && !item.waPosted) {
          if (!connected) {
            log(`⚠ WhatsApp belum terhubung — ${item.label || item.id} menunggu koneksi WA`);
          } else if (item.waLeased || check.isForce) {
            await postWhatsapp(item);
          } else {
            log(`⏳ Slide ${item.label || item.id} sedang dikunci (waLockAt aktif) oleh siklus/proses lain`);
          }
        }

        if (CONFIG.dispatchInstagram && item.postToInstagram && !item.igPosted) {
          await postInstagram(item);
        }
      } catch (itemErr) {
        log(`✖ Error memproses slide ${item?.label || item?.id}:`, itemErr.message);
      }
    }
  } catch (err) {
    log("✖ Polling loop error tak terduga:", err.message);
  } finally {
    busy = false;
  }
}

async function main() {
  if (!CONFIG.secret) {
    console.error("✖ WORKER_SECRET wajib diisi dan harus sama dengan WORKER_SECRET di server Story Maker.");
    process.exit(1);
  }

  log(`🧠 Story Maker WA Daemon v${VERSION} → ${CONFIG.apiUrl} (poll ${CONFIG.pollMs / 1000}s${CONFIG.dryRun ? ", DRY RUN" : ""})`);
  if (CONFIG.audience.length) log(`👥 Audiens Status dibatasi ke ${CONFIG.audience.length} nomor (WA_STATUS_AUDIENCE)`);
  
  startHealthServer();
  startSelfPing();
  await loadContacts();
  
  try {
    await api(`/api/worker/queue?connected=0&version=${VERSION}`);
    log("🔐 Terautentikasi ke Story Maker API");
  } catch (err) {
    log("⚠ Belum bisa menghubungi Story Maker API:", err.message);
  }
  
  await startWorker();
  startWatchdog();

  // 🛡️ [RESILIENT POLLING LOOP]
  // Loop setInterval dibungkus try/catch absolut. Jika ada network drop atau query Supabase gagal,
  // error hanya di-log dan timer BERIKUTNYA TETAP BERJALAN normal tanpa mematikan loop.
  const pollInterval = CONFIG.pollMs || 60_000;
  setInterval(async () => {
    try {
      await tick();
    } catch (unhandledErr) {
      log("✖ [POLL ERROR] Exception tertangkap di luar tick():", unhandledErr?.message || unhandledErr);
      busy = false;
    }
  }, pollInterval);
}

process.on("SIGINT", () => {
  log("👋 Daemon dimatikan.");
  process.exit(0);
});

const isDirectRun =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
    process.argv[1].endsWith("worker/index.mjs") ||
    process.argv[1].endsWith("worker\\index.mjs"));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  checkDue,
  getLocalDateString,
  extractMessageText,
  isKeywordMatched,
  KEYWORDS,
  CONFIG,
  startWorker,
  connect,
  healthServer,
  startSelfPing,
  isInDebounce,
  setDebounce,
};
