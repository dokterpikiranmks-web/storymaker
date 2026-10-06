/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2 — Telegram Publisher (lib/telegram-publisher.js)
 *  Official Editorial Assistant Pipeline for Dokter Pikiran
 * ════════════════════════════════════════════════════════════════════════════
 */

const https = require("node:https");

/**
 * Helper untuk mengirim HTTP POST request ke Telegram Bot API
 * @param {string} token
 * @param {string} endpoint
 * @param {Object} body
 * @returns {Promise<Object>}
 */
async function callTelegramApi(token, endpoint, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(`https://api.telegram.org/bot${token}/${endpoint}`);

    const options = {
      method: "POST",
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.ok) {
            resolve(parsed);
          } else {
            const err = new Error(
              parsed.description || `Telegram API error with status code ${res.statusCode}`
            );
            err.response = parsed;
            err.statusCode = res.statusCode;
            reject(err);
          }
        } catch {
          reject(new Error(`Gagal mem-parse respon Telegram: ${data}`));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout saat menghubungi Telegram API"));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Format slide sesuai instruksi resmi CTO:
 * 📱 STORY [X]/5 • [JAM] WITA
 * Babak: [HOOK/EDUKASI/PRAKTIK/BUKTI/CTA]
 *
 * "[Isi Teks Story]"
 *
 * 🎨 Visual Guide (9:16):
 * Headline: [Headline]
 * Nuansa: [Palet & Elemen]
 *
 * (Siap copy-paste ke WA Story)
 */
function formatSlideMessage(story) {
  const headline = story.visualGuide?.headline || "Dokter Pikiran";
  const palette = story.visualGuide?.palette || "Muted Slate / Forest Sage / Sand";
  const elements = story.visualGuide?.elements ? ` — ${story.visualGuide.elements}` : "";

  return `📱 STORY ${story.slide}/5 • ${story.time} WITA
Babak: ${story.act}

"${story.text}"

🎨 Visual Guide (9:16):
Headline: ${headline}
Nuansa: ${palette}${elements}

(Siap copy-paste ke WA Story)`;
}

/**
 * Mengirim satu pesan ke Telegram dengan proteksi error parsing Markdown
 */
async function sendMessageSafe(botToken, chatId, text) {
  // Coba kirim dengan Markdown
  try {
    return await callTelegramApi(botToken, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (err) {
    // Jika gagal parsing markdown (misal ada karakter khusus), kirim ulang sebagai plain text
    try {
      return await callTelegramApi(botToken, "sendMessage", {
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      });
    } catch (fallbackErr) {
      throw fallbackErr;
    }
  }
}

/**
 * Jeda milidetik antar pesan agar urutan slide di Telegram rapi
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mengirim seluruh 5 babak story ke Telegram
 * @param {Object} storyData - Hasil dari generateStoryV2
 * @param {Object} [config] - Kredensial opsional
 * @param {string} [config.botToken]
 * @param {string} [config.chatId]
 * @returns {Promise<Object>}
 */
async function publishToTelegram(storyData, config = {}) {
  const botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = config.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error(
      "Kredensial Telegram belum lengkap. Pastikan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID telah diisi di .env"
    );
  }

  if (!storyData || !Array.isArray(storyData.stories) || storyData.stories.length === 0) {
    throw new Error("Data story tidak valid atau kosong");
  }

  const results = [];

  // 1. Kirim Header / Briefing Pembuka
  const headerMessage = `*🌟 DOKTER PIKIRAN WA STORY ENGINE V2*
📅 *Tanggal:* ${storyData.date || "Hari Ini"}
🏛️ *Pilar:* ${storyData.pillar} (${storyData.pillarTitle || "Editorial"})
🎯 *Topik:* ${storyData.topic || "Edisi Harian"}
🔑 *Trigger Keyword:* \`${storyData.keyword || "RESET"}\`
⚡ *Engine:* ${storyData.model || "Dokter Pikiran V2"}

_Berikut 5 babak naskah story harian format 9:16 siap publish:_`;

  try {
    const headerRes = await sendMessageSafe(botToken, chatId, headerMessage);
    results.push({ type: "header", ok: true, messageId: headerRes.result?.message_id });
  } catch (err) {
    console.warn("⚠️ Gagal mengirim header briefing Telegram:", err.message);
  }

  await sleep(400);

  // 2. Loop dan Kirim ke-5 Slide Story
  for (const story of storyData.stories) {
    const slideMessage = formatSlideMessage(story);
    try {
      const res = await sendMessageSafe(botToken, chatId, slideMessage);
      results.push({
        type: "slide",
        slide: story.slide,
        act: story.act,
        ok: true,
        messageId: res.result?.message_id,
      });
    } catch (err) {
      console.error(`❌ Gagal mengirim Story Slide ${story.slide} ke Telegram:`, err.message);
      results.push({
        type: "slide",
        slide: story.slide,
        act: story.act,
        ok: false,
        error: err.message,
      });
    }

    // Beri jeda 500ms agar urutan pesan di chat Telegram tidak saling mendahului
    await sleep(500);
  }

  return {
    success: results.some((r) => r.type === "slide" && r.ok),
    totalSent: results.filter((r) => r.ok).length,
    results,
  };
}

module.exports = {
  callTelegramApi,
  formatSlideMessage,
  publishToTelegram,
};
