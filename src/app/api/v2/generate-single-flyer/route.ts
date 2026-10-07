import { NextResponse } from "next/server";
import { generateHeroPhoto } from "../../../../../lib/imagen";
import {
  type FlyerTemplateId,
  renderSingleFlyerPng,
} from "../../../../../lib/single-flyer-renderer";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { sendPhotoCard } = require("../../../../../lib/telegram-publisher");

export const dynamic = "force-dynamic";

export interface SingleFlyerRequestBody {
  preset?: "PROMO_KLINIK" | "QUOTES";
  templateId?: FlyerTemplateId;
  title?: string;
  price?: string;
  duration?: string;
  address?: string;
  schedule?: string;
  notes?: string;
  customPrompt?: string;
  chatId?: string;
}

function formatTelegramCaption(payload: {
  preset: "PROMO_KLINIK" | "QUOTES";
  title: string;
  price: string;
  duration: string;
  address: string;
  schedule: string;
  notes: string;
}): string {
  if (payload.preset === "QUOTES") {
    return (
      `✨ REFLEKSI MEJA TERAPI • DOKTER PIKIRAN MAKASSAR ✨\n\n` +
      `"${payload.title}"\n\n` +
      `— Ahmad Jawahir Zain\n` +
      `Hipnoterapis Klinis & Solo AI Dev • Makassar, WITA\n\n` +
      `💡 ${payload.notes}\n\n` +
      `📱 Flyer 1-Story 9:16 siap dibagikan langsung ke WhatsApp Story.`
    );
  }

  return (
    `🌿 FLYER PROMOSI KLINIK • DOKTER PIKIRAN MAKASSAR 🌿\n\n` +
    `🎯 Layanan: ${payload.title}\n` +
    `💰 Biaya: ${payload.price} (${payload.duration})\n` +
    `📍 Alamat: ${payload.address}\n` +
    `⏰ Jadwal: ${payload.schedule}\n` +
    `📌 Catatan: ${payload.notes}\n\n` +
    `"Tubuh lebih rileks, pikiran lebih tenang"\n` +
    `Terapi Alami • Tanpa Obat • Tanpa Efek Samping\n\n` +
    `📲 Reservasi WhatsApp: Balas pesan ini atau hubungi klinik langsung.\n` +
    `📱 Flyer 1-Story 9:16 siap dibagikan langsung ke WhatsApp Story.`
  );
}

/**
 * POST /api/v2/generate-single-flyer
 * Menghasilkan 1 Flyer 9:16 (Imagen 3 + Satori Overlay) & Mengirimkannya ke Telegram
 */
export async function POST(req: Request) {
  try {
    let body: SingleFlyerRequestBody = {};
    try {
      body = await req.json();
    } catch {
      // Body kosong diperbolehkan, akan memakai default
    }

    const preset = body.preset === "QUOTES" ? "QUOTES" : "PROMO_KLINIK";
    const templateId = body.templateId;
    const title =
      body.title?.trim() ||
      (preset === "QUOTES"
        ? "Tubuhmu tidak sedang melawanmu, ia hanya sedang kelelahan melindungi dirimu. Beri ia rasa aman."
        : "Totok Saraf Makassar");
    const price = body.price?.trim() || "Rp 150.000";
    const duration = body.duration?.trim() || "± 1 Jam";
    const address = body.address?.trim() || "Jl. Batua Raya 10 B No.9 Makassar";
    const schedule = body.schedule?.trim() || "Senin – Sabtu 16.00 – 21.00 WITA";
    const notes = body.notes?.trim() || "Maksimal 5 pasien per hari";
    const customPrompt = body.customPrompt?.trim();

    console.log("[SingleFlyer API] Payload diterima:", { templateId, customPrompt, title, preset });

    // 1. Generate Latar Foto via Imagen 3 (atau Fallback Estetis)
    console.log(`[SingleFlyer] Generating hero photo for preset ${preset}...`);
    const photoResult = await generateHeroPhoto(customPrompt, {
      preset,
      aspectRatio: "9:16",
    });

    // 2. Render TEPAT 1 GAMBAR PNG 9:16 dengan Tipografi Satori & Resvg
    console.log("[SingleFlyer] Rendering 2K Ultra HD (2160x3840) PNG flyer via Satori...");
    const pngBuffer = await renderSingleFlyerPng({
      preset,
      templateId,
      title,
      price,
      duration,
      address,
      schedule,
      notes,
      customPrompt,
      heroPhotoBase64: photoResult.base64,
    });

    // 3. Kirim ke Telegram Bot jika Token & Chat ID tersedia
    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = body.chatId?.trim() || process.env.TELEGRAM_CHAT_ID?.trim() || "785378199";

    let telegramSent = false;
    let telegramError: string | null = null;

    if (botToken && chatId) {
      const caption = formatTelegramCaption({
        preset,
        title,
        price,
        duration,
        address,
        schedule,
        notes,
      });

      const filename = `flyer-${preset.toLowerCase()}-${Date.now()}.png`;

      try {
        console.log(`[SingleFlyer] Sending flyer photo to Telegram Chat ${chatId}...`);
        await sendPhotoCard(botToken, chatId, pngBuffer, filename, caption);
        telegramSent = true;
      } catch (err) {
        telegramError = err instanceof Error ? err.message : String(err);
        console.error("❌ [SingleFlyer] Gagal mengirim photo ke Telegram:", telegramError);
      }
    } else {
      telegramError = "TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum terkonfigurasi.";
      console.warn("⚠️ [SingleFlyer] " + telegramError);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      preset,
      templateId,
      title,
      price,
      duration,
      address,
      schedule,
      notes,
      photo: {
        source: photoResult.source,
        model: photoResult.model,
        promptUsed: photoResult.promptUsed,
      },
      fileSize: pngBuffer.length,
      telegram: {
        sent: telegramSent,
        chatId,
        error: telegramError,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API v2 generate-single-flyer] Error fatal:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/generate-single-flyer
 * Endpoint untuk pengujian langsung dari browser
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const presetParam = searchParams.get("preset")?.toUpperCase();
  const preset = presetParam === "QUOTES" ? "QUOTES" : "PROMO_KLINIK";

  const fakeReq = new Request(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      preset,
      templateId: (searchParams.get("templateId") as FlyerTemplateId) || undefined,
      customPrompt: searchParams.get("customPrompt") || undefined,
      title: searchParams.get("title") || undefined,
      price: searchParams.get("price") || undefined,
      notes: searchParams.get("notes") || undefined,
    }),
  });

  return POST(fakeReq);
}
