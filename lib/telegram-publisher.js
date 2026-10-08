/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2.1 — Telegram Publisher (lib/telegram-publisher.js)
 *  Sends 9:16 Visual Image Cards & PDF Lead Magnet Links directly to Telegram
 * ════════════════════════════════════════════════════════════════════════════
 */

const dns = require("node:dns");
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const { renderAllStoryCards } = require("./card-renderer");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mendapatkan tautan publik dokumen PDF panduan ringkas dinamis per story
 * @param {Object|string} storyData - Object storyData lengkap atau string pillar
 * @param {string} [fallbackKeyword] - RESET | LAMBUNG | FOKUS
 * @returns {string}
 */
function getPdfUrl(storyData = "PIKIRAN", fallbackKeyword = "RESET") {
  const baseUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://storymaker-chi.vercel.app";
  const cleanBase = baseUrl.replace(/\/+$/, "");

  let pillar = "PIKIRAN";
  let keyword = fallbackKeyword || "RESET";
  let topic = "";
  let edukasi = "";
  let praktik = "";
  let bukti = "";

  if (typeof storyData === "string") {
    pillar = storyData;
    keyword = fallbackKeyword || "RESET";
  } else if (storyData && typeof storyData === "object") {
    pillar = storyData.pillar || "PIKIRAN";
    keyword = storyData.keyword || fallbackKeyword || "RESET";
    topic = storyData.topic || "";
    if (Array.isArray(storyData.stories)) {
      edukasi = storyData.stories.find((s) => (s.act || "").toUpperCase().includes("EDUKASI"))?.text || "";
      praktik = storyData.stories.find((s) => (s.act || "").toUpperCase().includes("PRAKTIK"))?.text || "";
      bukti = storyData.stories.find((s) => (s.act || "").toUpperCase().includes("BUKTI"))?.text || "";
    }
  }

  const kw = (keyword || "RESET").toUpperCase();
  const pil = (pillar || "PIKIRAN").toUpperCase();

  const payload = {
    t: topic,
    k: kw,
    l: pil,
  };
  const dataParam = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${cleanBase}/api/protocol/pdf?data=${dataParam}&keyword=${kw}&pillar=${pil}`;
}

/**
 * Mengirim pesan teks singkat (misal briefing header)
 */
async function sendTextMessage(botToken, chatId, text, parseMode = "Markdown") {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json();
    if (!json.ok && parseMode) {
      // Fallback tanpa parse_mode jika ada karakter khusus
      return sendTextMessage(botToken, chatId, text, undefined);
    }
    return json;
  } catch (err) {
    console.warn("⚠️ Gagal mengirim text message Telegram:", err.message);
    return null;
  }
}

/**
 * Mengirim 1 gambar kartu ke Telegram menggunakan sendPhoto API (multipart/form-data)
 */
async function sendPhotoCard(botToken, chatId, buffer, filename, caption) {
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append(
    "photo",
    new Blob([buffer], { type: "image/png" }),
    filename || "story-card.png"
  );
  if (caption) {
    formData.append("caption", caption);
  }

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.description || `Telegram sendPhoto failed with status ${res.status}`);
  }

  return json;
}

/**
 * Format caption per slide foto, menyertakan link PDF pada slide CTA (Slide 5)
 */
function formatPhotoCaption(story, pdfUrl) {
  const isCta = (story.act || "").toUpperCase().includes("CTA");

  let caption = `📱 STORY ${story.slide}/5 • ${story.time} WITA\nBabak: ${story.act}\n\n"${story.text}"`;

  if (isCta && pdfUrl) {
    caption += `\n\n📄 Link Panduan PDF untuk dibagikan ke kontak yang membalas:\n${pdfUrl}`;
  }

  if (caption.length + 50 <= 1000) {
    caption += `\n\n(Siap simpan ke galeri HP & share ke WA Story)`;
  }

  if (caption.length > 1020) {
    caption = caption.slice(0, 1017) + "...";
  }

  return caption;
}

/**
 * Main Publisher: Render 5 kartu visual 9:16 dan kirim langsung ke Telegram
 * @param {Object} storyData - Output dari generateStoryV2
 * @param {Object} [config]
 * @param {string} [config.botToken]
 * @param {string} [config.chatId]
 * @returns {Promise<Object>}
 */
async function publishToTelegram(storyData, config = {}) {
  const botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = config.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error(
      "Kredensial Telegram belum lengkap. Pastikan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID terisi di .env"
    );
  }

  if (!storyData || !Array.isArray(storyData.stories) || storyData.stories.length === 0) {
    throw new Error("Data story tidak valid atau kosong");
  }

  const pdfUrl = getPdfUrl(storyData);

  // 1. Render seluruh kartu naskah menjadi Buffer PNG 9:16 dengan Dynamic Daily Themes
  console.log("🎨 Me-render 5 kartu visual 1080x1920 (9:16) Dynamic Theme...");
  const renderedCards = await renderAllStoryCards(storyData);

  const results = [];

  // 2. Kirim Header Briefing dengan Link Panduan PDF Siap Copas
  const headerMessage = `🌟 <b>DOKTER PIKIRAN MAKASSAR WA STORY V2.3</b>
📅 <b>Tanggal:</b> ${storyData.date || "Hari Ini"}
🏛️ <b>Pilar:</b> ${storyData.pillar} (${storyData.pillarTitle || "Editorial"})
🎯 <b>Topik:</b> ${storyData.topic}
🔑 <b>Trigger Keyword:</b> <code>${storyData.keyword || "RESET"}</code>
📍 <b>Lokasi:</b> Makassar, WITA (UTC+8)

📄 <b>Link Panduan PDF untuk dibagikan ke kontak yang membalas:</b>
${pdfUrl}

<i>Mengirim 5 kartu visual format 9:16 siap simpan ke galeri & upload ke WA Story:</i>`;

  await sendTextMessage(botToken, chatId, headerMessage, "HTML");
  await sleep(200);

  // 3. Loop dan Kirim ke-5 Kartu Gambar PNG via sendPhoto
  for (const card of renderedCards) {
    const caption = formatPhotoCaption(card, pdfUrl);
    try {
      console.log(`   📤 Mengirim Foto Story ${card.slide}/5 (${card.act})...`);
      const res = await sendPhotoCard(botToken, chatId, card.buffer, card.filename, caption);
      results.push({
        type: "photo",
        slide: card.slide,
        act: card.act,
        ok: true,
        messageId: res.result?.message_id,
        filename: card.filename,
      });
    } catch (err) {
      console.error(`❌ Gagal mengirim gambar slide ${card.slide} ke Telegram:`, err.message);
      results.push({
        type: "photo",
        slide: card.slide,
        act: card.act,
        ok: false,
        error: err.message,
        filename: card.filename,
      });
    }

    // Jeda 250ms agar urutan di Telegram rapi tanpa menghabiskan waktu eksekusi serverless
    await sleep(250);
  }

  const successCount = results.filter((r) => r.ok).length;

  return {
    success: successCount > 0,
    totalSent: successCount,
    totalCards: renderedCards.length,
    pdfUrl,
    results,
  };
}

module.exports = {
  getPdfUrl,
  sendTextMessage,
  sendPhotoCard,
  formatPhotoCaption,
  publishToTelegram,
};
