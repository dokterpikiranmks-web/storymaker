/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2.1 — Telegram Publisher (lib/telegram-publisher.js)
 *  Sends 9:16 Visual Image Cards & PDF Lead Magnet Links directly to Telegram
 * ════════════════════════════════════════════════════════════════════════════
 */

const { renderAllStoryCards } = require("./card-renderer");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mendapatkan tautan publik dokumen PDF panduan ringkas per pilar
 * @param {string} pillar - PIKIRAN | TUBUH | TEKNOLOGI
 * @param {string} keyword - RESET | LAMBUNG | FOKUS
 * @returns {string}
 */
function getPdfUrl(pillar = "PIKIRAN", keyword = "RESET") {
  const baseUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://storymaker-chi.vercel.app";
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const kw = (keyword || "RESET").toUpperCase();

  return `${cleanBase}/api/protocol/pdf?keyword=${kw}`;
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
        disable_web_page_preview: false,
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

  if (isCta && pdfUrl) {
    return `📱 STORY ${story.slide}/5 • ${story.time} WITA
Babak: ${story.act}

"${story.text}"

📄 Link Panduan PDF untuk dibagikan ke kontak yang membalas:
${pdfUrl}

(Siap simpan ke galeri HP & share ke WA Story)`;
  }

  return `📱 STORY ${story.slide}/5 • ${story.time} WITA
Babak: ${story.act}

"${story.text}"

(Siap simpan ke galeri HP & share ke WA Story)`;
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

  const pdfUrl = getPdfUrl(storyData.pillar, storyData.keyword);

  // 1. Render seluruh kartu naskah menjadi Buffer PNG 9:16 dengan Dynamic Daily Themes
  console.log("🎨 Me-render 5 kartu visual 1080x1920 (9:16) Dynamic Theme...");
  const renderedCards = await renderAllStoryCards(storyData);

  const results = [];

  // 2. Kirim Header Briefing dengan Link Panduan PDF Siap Copas
  const headerMessage = `*🌟 DOKTER PIKIRAN WA STORY V2.1*
📅 *Tanggal:* ${storyData.date || "Hari Ini"}
🏛️ *Pilar:* ${storyData.pillar} (${storyData.pillarTitle || "Editorial"})
🎯 *Topik:* ${storyData.topic}
🔑 *Trigger Keyword:* \`${storyData.keyword || "RESET"}\`

📄 *Link Panduan PDF untuk dibagikan ke kontak yang membalas:*
${pdfUrl}

_Mengirim 5 kartu visual format 9:16 siap simpan ke galeri & upload ke WA Story:_`;

  await sendTextMessage(botToken, chatId, headerMessage);
  await sleep(400);

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

    // Jeda 600ms agar urutan di Telegram rapi dan tidak tercecer
    await sleep(600);
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
