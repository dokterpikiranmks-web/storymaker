import { GoogleGenAI } from "@google/genai";
import { readFile } from "node:fs/promises";
import path from "node:path";

export interface HeroPhotoResult {
  buffer: Buffer;
  base64: string; // "data:image/jpeg;base64,..."
  mimeType: string;
  source: "imagen" | "fallback";
  model?: string;
  promptUsed?: string;
}

function detectImageMime(buffer: Buffer): string {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }
  if (buffer.length > 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (buffer.toString("utf8", 0, 100).includes("<svg")) {
    return "image/svg+xml";
  }
  return "image/jpeg";
}

const FALLBACK_UNSPLASH_URLS = {
  PROMO_KLINIK: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?fm=jpg&w=1080&h=1080&q=80",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?fm=jpg&w=1080&h=1080&q=80",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?fm=jpg&w=1080&h=1080&q=80",
  ],
  QUOTES: [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?fm=jpg&w=1080&h=1080&q=80",
    "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?fm=jpg&w=1080&h=1080&q=80",
  ],
};

/**
 * Membaca aset fallback lokal dari src/assets/images
 */
async function getLocalFallbackPhoto(preset: "PROMO_KLINIK" | "QUOTES" = "PROMO_KLINIK"): Promise<Buffer | null> {
  try {
    const filename = preset === "QUOTES" ? "fallback-quote.jpg" : "fallback-clinic.jpg";
    const filePath = path.join(process.cwd(), "src", "assets", "images", filename);
    const buf = await readFile(filePath);
    return buf;
  } catch (err) {
    console.warn("[Imagen Fallback] Gagal memuat file gambar lokal:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Mencoba mengunduh foto fallback berkualitas tinggi dari Unsplash dengan timeout
 */
async function fetchOnlineFallback(
  preset: "PROMO_KLINIK" | "QUOTES" = "PROMO_KLINIK",
  customPrompt?: string
): Promise<Buffer | null> {
  let urls = FALLBACK_UNSPLASH_URLS[preset] || FALLBACK_UNSPLASH_URLS.PROMO_KLINIK;

  // Variasi kontekstual jika prompt menyebut leher / akupresur
  if (customPrompt && /leher|bahu|akupresur/i.test(customPrompt)) {
    urls = [
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?fm=jpg&w=1080&h=1080&q=80",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?fm=jpg&w=1080&h=1080&q=80",
    ];
  }

  const targetUrl = urls[Math.floor(Math.random() * urls.length)];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: "image/jpeg",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (err) {
    console.warn("[Imagen Fallback] Gagal fetch Unsplash:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Minimalist Emergency SVG Gradient Buffer jika semua sumber fallback jaringan & disk gagal
 */
function getEmergencyFallbackBuffer(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f261e"/>
        <stop offset="50%" stop-color="#164e3d"/>
        <stop offset="100%" stop-color="#061a14"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="540" cy="360" r="180" fill="#74A892" opacity="0.15"/>
    <text x="540" y="370" font-family="sans-serif" font-size="32" fill="#88C7AD" text-anchor="middle" font-weight="bold">
      DOKTER PIKIRAN MAKASSAR
    </text>
  </svg>`;
  return Buffer.from(svg, "utf-8");
}

/**
 * Generator Foto Imagen 3 dengan Fallback Berlapis (Offline-safe & Quota-proof)
 *
 * @param prompt Deskripsi visual kustom (opsional)
 * @param options Konfigurasi preset & fallback
 */
export async function generateHeroPhoto(
  prompt?: string,
  options?: {
    preset?: "PROMO_KLINIK" | "QUOTES";
    aspectRatio?: "1:1" | "9:16" | "3:4" | "4:3";
  }
): Promise<HeroPhotoResult> {
  const preset = options?.preset || "PROMO_KLINIK";
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();

  // 1. Dynamic Prompt Builder sesuai instruksi CTO
  const customPrompt = (prompt || "").trim();
  let effectivePrompt: string;
  if (customPrompt) {
    effectivePrompt = `${customPrompt}, professional clinical wellness aesthetic, soft daylight, warm tones, high-end photography, 8k resolution, photorealistic, no text, no watermark`;
  } else if (preset === "QUOTES") {
    effectivePrompt =
      "Serene, contemplative and peaceful atmosphere, soft morning sunlight casting gentle warmth on minimalist natural elements, deep mindfulness and calmness concept, photorealistic 8k, editorial aesthetic";
  } else {
    effectivePrompt =
      "Photorealistic close-up photo of an Indonesian patient lying down peacefully with closed eyes receiving gentle acupressure massage and somatic therapy from a professional therapist in a clean, modern natural wellness clinic in Makassar, warm natural ambient lighting, soft shadows, serene and deeply relaxing atmosphere, 8k resolution, professional clinical wellness photography";
  }

  let result: HeroPhotoResult | null = null;

  // 2. Panggil Imagen 3 (@google/genai imagen-3.0-generate-002) jika API Key tersedia
  if (apiKey) {
    try {
      console.log(`[Imagen] Invoking Imagen 3 (imagen-3.0-generate-002)...`);
      const ai = new GoogleGenAI({ apiKey });
      const model = "imagen-3.0-generate-002";

      const response = await ai.models.generateImages({
        model,
        prompt: effectivePrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: (options?.aspectRatio || "9:16") as "9:16",
          outputMimeType: "image/jpeg",
        },
      });

      const firstImage = response.generatedImages?.[0];
      const imageBytes = firstImage?.image?.imageBytes;

      if (imageBytes) {
        const buffer = Buffer.from(imageBytes, "base64");
        result = {
          buffer,
          base64: `data:image/jpeg;base64,${imageBytes}`,
          mimeType: "image/jpeg",
          source: "imagen",
          model,
          promptUsed: effectivePrompt,
        };
      }
    } catch (err) {
      console.warn(
        "⚠️ [Imagen 3] Permintaan generate gagal/limit, beralih ke fallback estetis:",
        err instanceof Error ? err.message : err
      );
    }
  } else {
    console.warn("⚠️ [Imagen 3] GEMINI_API_KEY tidak dikonfigurasi, beralih ke fallback estetis.");
  }

  // 3. Fallback Level 1: Fetch Online Unsplash (Dinamis sesuai preset/prompt)
  if (!result) {
    const onlineBuf = await fetchOnlineFallback(preset, customPrompt);
    if (onlineBuf) {
      const mime = detectImageMime(onlineBuf);
      result = {
        buffer: onlineBuf,
        base64: `data:${mime};base64,${onlineBuf.toString("base64")}`,
        mimeType: mime,
        source: "fallback",
        model: "unsplash-fallback",
        promptUsed: effectivePrompt,
      };
    }
  }

  // 4. Fallback Level 2: Aset Lokal di Disk (Offline-Safe)
  if (!result) {
    const localBuf = await getLocalFallbackPhoto(preset);
    if (localBuf) {
      const mime = detectImageMime(localBuf);
      result = {
        buffer: localBuf,
        base64: `data:${mime};base64,${localBuf.toString("base64")}`,
        mimeType: mime,
        source: "fallback",
        model: "local-asset-fallback",
        promptUsed: effectivePrompt,
      };
    }
  }

  // 5. Fallback Level 3: Emergency Vector Buffer
  if (!result) {
    const emergencyBuf = getEmergencyFallbackBuffer();
    result = {
      buffer: emergencyBuf,
      base64: `data:image/svg+xml;base64,${emergencyBuf.toString("base64")}`,
      mimeType: "image/svg+xml",
      source: "fallback",
      model: "emergency-vector",
      promptUsed: effectivePrompt,
    };
  }

  // Log status hasil render sesuai instruksi CTO
  console.log("[Imagen] Status render hero image:", result.source);
  return result;
}
