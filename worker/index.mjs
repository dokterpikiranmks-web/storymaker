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
  timezone: process.env.APP_TIMEZONE || "Asia/Makassar",
};

const log = (...args) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args);

// ── Health Check Server for Render / Cloud Web Services ──────────────────
const PORT = process.env.PORT || 10000;
const healthServer = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url === "/post-now" || url === "/trigger") {
    log("⚡ Trigger /post-now diterima via HTTP server worker — menjalankan tick()");
    void tick();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok", message: "tick triggered" }));
  }

  // GET /health atau root kembalikan waConnected & uptime
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "ok",
      waConnected: connected,
      uptime: process.uptime(),
      service: "Story Maker WhatsApp Daemon",
    })
  );
});

function startHealthServer() {
  healthServer.listen(PORT, "0.0.0.0", () => {
    log(`🌐 Health check server aktif di port ${PORT}`);
  });
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

// ── In-memory anti-spam debounce cache for inbound auto-responder (10 mins TTL) ─
const autoReplyCooldowns = new Map();
const DEBOUNCE_TTL_MS = 10 * 60 * 1000;

function isCoolingDown(jid) {
  const now = Date.now();
  const expiresAt = autoReplyCooldowns.get(jid);
  if (expiresAt && expiresAt > now) {
    return true;
  }
  autoReplyCooldowns.set(jid, now + DEBOUNCE_TTL_MS);
  if (autoReplyCooldowns.size > 2000) {
    for (const [k, v] of autoReplyCooldowns.entries()) {
      if (v <= now) autoReplyCooldowns.delete(k);
    }
  }
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
    sock.ev.on("messages.upsert", async ({ messages }) => {
      if (!Array.isArray(messages)) return;

      for (const m of messages) {
        try {
          if (!m?.message || !m?.key) continue;

          // a. Filter Ketat & Fleksibel:
          // Abaikan pesan diri sendiri
          if (m.key.fromMe) continue;

          // Abaikan grup WhatsApp & status broadcast
          const remoteJid = m.key.remoteJid || "";
          if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid.endsWith("@broadcast")) continue;

          // Buka dukungan untuk personal chat @s.whatsapp.net DAN format multi-device @lid
          if (!remoteJid.endsWith("@s.whatsapp.net") && !remoteJid.endsWith("@lid")) continue;

          // b. Ekstraksi Naskah Berlapis (Deep Unwrapping):
          const msg = m.message;
          const rawText =
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
            "";

          const cleanText = rawText.trim().toUpperCase();
          console.log(`📩 [INBOUND] Dari: ${remoteJid} | Naskah: "${rawText}"`);

          if (!cleanText) continue;

          // c. Pencocokan Kata Kunci:
          const isMatched = KEYWORDS.some((k) => cleanText.includes(k));
          if (!isMatched) continue;

          // d. Respon Bertingkat Cepat (Fail-Safe):
          // Cek anti-spam cache (10 menit TTL per JID)
          if (isCoolingDown(remoteJid)) {
            log(`⏳ Inbound [${cleanText.slice(0, 30)}] dari ${remoteJid} diabaikan (cooldown 10 menit)`);
            continue;
          }

          log(`🎯 Inbound auto-responder terpicu [MATCH] dari ${remoteJid}: "${rawText.trim().slice(0, 45)}"`);

          // TAHAP 1: Kirim langsung teks konfirmasi tanpa menunggu PDF
          await sock.sendMessage(remoteJid, {
            text: "Salam hangat dari Dr. Mind! 🌿\n\nBerikut panduan saku somatik & regulasi saraf vagus yang Anda minta. Silakan pelajari protokol praktis ini untuk meredakan ketegangan fisik dan mental.",
          });
          log(`💬 TAHAP 1: Teks konfirmasi terkirim ke ${remoteJid}`);

          // TAHAP 2 (Try-Catch): Fetch buffer PDF dari /api/protocol/pdf dan kirim sebagai dokumen
          try {
            const pdfRes = await fetch(`${CONFIG.apiUrl}/api/protocol/pdf`, {
              headers: { Authorization: `Bearer ${CONFIG.secret}` },
              signal: AbortSignal.timeout(25_000),
            });

            if (!pdfRes.ok) {
              throw new Error(`HTTP ${pdfRes.status} saat fetch PDF`);
            }

            const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
            const dateStr = new Date().toISOString().slice(0, 10);

            await sock.sendMessage(remoteJid, {
              document: pdfBuffer,
              fileName: `Dr-Mind-Protokol-${dateStr}.pdf`,
              mimetype: "application/pdf",
            });
            log(`✅ TAHAP 2: Dokumen PDF protokol terkirim ke ${remoteJid}`);
          } catch (pdfErr) {
            log(`⚠ TAHAP 2: Gagal mengambil/mengirim PDF ke ${remoteJid} (${pdfErr.message}) — mengirim teks 3 langkah protokol sebagai fallback`);
            const fallbackProtocolText =
              `🧠 *RINGKASAN PROTOKOL 3 MENIT RESET SOMATIK & SARAF VAGUS:*\n\n` +
              `1. *Titik GB-20 (Fengchi)*: Tekan kedua cekungan di dasar tengkorak belakang selama 60 detik dengan napas teratur lambat.\n` +
              `2. *Vagus Physiological Sigh*: Tarik napas 2 kali lewat hidung, hembuskan perlahan 8 detik lewat mulut (ulangi 5 siklus).\n` +
              `3. *Subconscious Grounding*: Sentuh dada tengah, rasakan detak jantung melambat dan gelombang otak beralih ke status Alpha tenang.\n\n` +
              `🔗 Akses dokumen PDF lengkap: ${CONFIG.apiUrl}/api/protocol/pdf\n\n` +
              `━━━━━━━━━━━━━━━\n` +
              `💬 *Layanan & Konsultasi:*\nJika ingin konsultasi privat jadwal terapi atau ingin mencoba aplikasi asisten fokus kami, silakan balas chat ini.`;

            await sock.sendMessage(remoteJid, { text: fallbackProtocolText });
            log(`✅ TAHAP 2 (Fallback): Teks 3 langkah protokol terkirim ke ${remoteJid}`);
          }
        } catch (inboundErr) {
          console.error(`✖ Error inbound auto-responder:`, inboundErr.message);
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
    const { items = [] } = await api(`/api/worker/queue?${params}`);
    if (items.length) log(`📬 ${items.length} slide diterima dari antrean`);
    for (const item of items) {
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
    }
  } catch (err) {
    log("✖ Polling gagal:", err.message);
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
  await loadContacts();
  
  try {
    await api(`/api/worker/queue?connected=0&version=${VERSION}`);
    log("🔐 Terautentikasi ke Story Maker API");
  } catch (err) {
    log("⚠ Belum bisa menghubungi Story Maker API:", err.message);
  }
  
  await startWorker();
  startWatchdog();
  setInterval(() => void tick(), CONFIG.pollMs);
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
};
