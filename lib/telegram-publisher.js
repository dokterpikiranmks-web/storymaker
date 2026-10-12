/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V3.0 — Telegram Publisher (lib/telegram-publisher.js)
 *  Sends 9:16 Visual Infographic Cards (1-by-1 or Batch) & PDF Lead Magnet
 * ════════════════════════════════════════════════════════════════════════════
 */

const dns = require("node:dns");
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const { renderStoryCardPng, renderAllStoryCards } = require("./card-renderer");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mendapatkan tautan publik dokumen PDF panduan ringkas dinamis per story
 */
function getPdfUrl(storyData = "TUBUH", fallbackKeyword = "LAMBUNG") {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://storymaker-jet.vercel.app";
  const cleanBase = baseUrl.replace(/\/+$/, "");

  let pillar = "TUBUH";
  let keyword = fallbackKeyword || "LAMBUNG";
  let topic = "";
  let date = "";
  let step1 = "";
  let step2 = "";
  let step3 = "";

  if (typeof storyData === "string") {
    pillar = storyData;
    keyword = fallbackKeyword || "LAMBUNG";
  } else if (storyData && typeof storyData === "object") {
    pillar = storyData.pillar || "TUBUH";
    keyword = storyData.keyword || storyData.ctaKeyword || fallbackKeyword || "LAMBUNG";
    topic = storyData.topic || "";
    date = storyData.date || "";

    // Ekstrak instruksi somatik jika ada
    const somaticAction = storyData.somaticAction;
    if (somaticAction) {
      step1 = somaticAction.step1 || "";
      step2 = somaticAction.step2 || "";
      step3 = somaticAction.step3 || "";
    } else if (Array.isArray(storyData.stories)) {
      const praktikStory = storyData.stories.find((s) => (s.act || "").toUpperCase().includes("PRAKTIK"));
      if (praktikStory?.visualGuide?.steps && Array.isArray(praktikStory.visualGuide.steps)) {
        step1 = praktikStory.visualGuide.steps[0]?.action || "";
        step2 = praktikStory.visualGuide.steps[1]?.action || "";
        step3 = praktikStory.visualGuide.steps[2]?.action || "";
      }
    }
  }

  const kw = (keyword || "LAMBUNG").toUpperCase();
  const pil = (pillar || "TUBUH").toUpperCase();

  const todayDate = date || new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
  }).format(new Date());

  const encodedTopic = encodeURIComponent(topic || "Reset Somatik & Regulasi Saraf");
  let pdfUrl = `${cleanBase}/api/protocol/pdf?date=${todayDate}&pillar=${pil}&keyword=${kw}&topic=${encodedTopic}`;

  if (step1) pdfUrl += `&step1=${encodeURIComponent(step1)}`;
  if (step2) pdfUrl += `&step2=${encodeURIComponent(step2)}`;
  if (step3) pdfUrl += `&step3=${encodeURIComponent(step3)}`;

  return pdfUrl;
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
      return sendTextMessage(botToken, chatId, text, undefined);
    }
    return json;
  } catch (err) {
    console.warn("⚠️ Gagal mengirim text message Telegram:", err.message);
    return null;
  }
}

/**
 * Mengirim 1 gambar kartu ke Telegram menggunakan sendPhoto API (multipart/form-data) dengan auto-retry
 */
async function sendPhotoCard(botToken, chatId, buffer, filename, caption, maxRetries = 2) {
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
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
    } catch (err) {
      if (attempt < maxRetries) {
        console.warn(`⚠️ Telegram upload percobaan ${attempt} gagal (${err.message}), mencoba ulang dalam 1 detik...`);
        await sleep(1000);
      } else {
        throw err;
      }
    }
  }
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

  if (caption.length + 55 <= 1000) {
    caption += `\n\n(Format 9:16 Visual Infografis • Siap simpan ke galeri & upload ke WA Story)`;
  }

  if (caption.length > 1020) {
    caption = caption.slice(0, 1017) + "...";
  }

  return caption;
}

/**
 * Menerbitkan TEPAT 1 KARTU sesuai slot tayang ke Telegram (Real-Time Slot Dispatcher)
 * Render instan < 1 detik, aman dari timeout serverless.
 * @param {Object} storyData - Output naskah harian
 * @param {number} slotNumber - 1 sampai 5
 * @param {Object} [config]
 */
async function publishSlotToTelegram(storyData, slotNumber, config = {}) {
  const botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = config.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error(
      "Kredensial Telegram belum lengkap. Pastikan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID terisi di .env"
    );
  }

  if (!storyData || !Array.isArray(storyData.stories) || storyData.stories.length === 0) {
    throw new Error("Data story tidak valid atau kosong.");
  }

  const slot = Math.min(Math.max(Number(slotNumber) || 1, 1), 5);
  const story =
    storyData.stories.find((s) => s.slide === slot) ||
    storyData.stories[slot - 1] ||
    storyData.stories[0];

  const pdfUrl = getPdfUrl(storyData);

  const meta = {
    pillar: storyData.pillar,
    topic: storyData.topic,
    keyword: storyData.keyword,
    date: storyData.date,
    isSingleFlyer: false,
  };

  const startTime = Date.now();
  console.log(`🎨 Me-render kartu visual 1080x1920 untuk Slot ${slot} (${story.act})...`);
  const buffer = await renderStoryCardPng(story, meta);
  const renderTimeMs = Date.now() - startTime;
  console.log(`⚡ Selesai render dalam ${renderTimeMs}ms!`);

  const filename = `story-${storyData.date || "today"}-slot-${slot}-${story.act.toLowerCase().replace(/\s+/g, "_")}.png`;
  const caption = formatPhotoCaption(story, pdfUrl);

  console.log(`📤 Mengirim Foto Story Slot ${slot} ke Telegram...`);
  const res = await sendPhotoCard(botToken, chatId, buffer, filename, caption);

  return {
    success: true,
    slot,
    act: story.act,
    time: story.time,
    date: storyData.date,
    topic: storyData.topic,
    headline: story.visualGuide?.headline,
    renderTimeMs,
    messageId: res.result?.message_id,
    filename,
    pdfUrl,
  };
}

/**
 * Main Publisher: Render 5 kartu visual 9:16 dan kirim langsung ke Telegram (Mode Batch / Manual)
 * @param {Object} storyData - Output dari generateStoryV2
 * @param {Object} [config]
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

  // 1. Render seluruh kartu naskah menjadi Buffer PNG 9:16
  console.log("🎨 Me-render 5 kartu visual infografis 1080x1920 (9:16)...");
  const renderedCards = await renderAllStoryCards(storyData);

  const results = [];

  // 2. Kirim Header Briefing dengan Link Panduan PDF
  const headerMessage = `🌟 <b>DOKTER PIKIRAN MAKASSAR WA STORY V3.0</b>
📅 <b>Tanggal:</b> ${storyData.date || "Hari Ini"}
🏛️ <b>Pilar:</b> ${storyData.pillar} (${storyData.pillarTitle || "Editorial"})
🎯 <b>Topik:</b> ${storyData.topic}
🔑 <b>Trigger Keyword:</b> <code>${storyData.keyword || "RESET"}</code>
📍 <b>Lokasi:</b> Makassar, WITA (UTC+8)

📄 <b>Link Panduan PDF untuk dibagikan ke kontak yang membalas:</b>
${pdfUrl}

<i>Mengirim 5 kartu visual infografis 9:16 siap simpan ke galeri & upload ke WA Story:</i>`;

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
  publishSlotToTelegram,
  publishToTelegram,
};
