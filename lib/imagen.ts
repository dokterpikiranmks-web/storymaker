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

/**
 * Standard Prompt Engineering Fotorealistis Totok Saraf Makassar (Setara Standar Image 1)
 */
export const HIGH_END_TOTOK_SARAF_PROMPT =
  "High-end commercial medical photography. An Asian female patient lying down peacefully on a clinic bed, eyes closed with a calm and relieved expression. A professional therapist wearing clean dark green scrub uniform is gently applying thumb acupressure therapy on her forehead and temple nerve points. Warm natural cinematic lighting, luxury holistic wellness clinic Makassar atmosphere in soft bokeh background, small herbal plant and neat towels. Shot on Canon EOS R5 85mm f/1.4 lens, hyper-realistic, 8k resolution, authentic therapeutic session, no text, no watermark, perfectly natural hands and skin texture.";

/**
 * Membaca aset foto kurasi lokal terverifikasi dari src/assets/images
 * Menjamin 100% foto menampilkan terapi Totok Saraf asli, BUKAN foto stok minyak acak.
 */
async function getLocalCuratedPhoto(preset: "PROMO_KLINIK" | "QUOTES" = "PROMO_KLINIK"): Promise<Buffer | null> {
  const candidates =
    preset === "QUOTES"
      ? ["fallback-quote.jpg"]
      : ["fallback-totok-saraf.jpg", "fallback-clinic.jpg"];

  for (const filename of candidates) {
    try {
      const filePath = path.join(process.cwd(), "src", "assets", "images", filename);
      const buf = await readFile(filePath);
      if (buf && buf.length > 0) {
        return buf;
      }
    } catch {
      // lanjut kandidat berikutnya
    }
  }

  console.warn("[Imagen Fallback] Peringatan: Tidak dapat menemukan file fallback lokal di src/assets/images/");
  return null;
}

/**
 * Minimalist Emergency SVG Gradient Buffer jika semua sumber fallback jaringan & disk gagal
 */
function getEmergencyFallbackBuffer(): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="720">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0A3828"/>
        <stop offset="50%" stop-color="#0F5132"/>
        <stop offset="100%" stop-color="#061A14"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="540" cy="360" r="180" fill="#74A892" opacity="0.15"/>
    <text x="540" y="370" font-family="sans-serif" font-size="34" fill="#C2E7D9" text-anchor="middle" font-weight="bold">
      DOKTER PIKIRAN MAKASSAR • TOTOK SARAF
    </text>
  </svg>`;
  return Buffer.from(svg, "utf-8");
}

/**
 * Generator Foto Imagen 3 dengan Fallback Kurasi Lokal Totok Saraf Makassar
 *
 * @param prompt Deskripsi visual kustom (opsional)
 * @param options Konfigurasi preset & rasio gambar
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

  // 1. Dynamic Prompt Builder Fotorealistis
  const customPrompt = (prompt || "").trim();
  let enhancedPrompt: string;

  if (customPrompt) {
    enhancedPrompt = `${customPrompt}, professional clinical wellness aesthetic, soft daylight, warm tones, high-end photography, 8k resolution, photorealistic, no text, no watermark`;
  } else if (preset === "QUOTES") {
    enhancedPrompt =
      "Serene, contemplative and peaceful atmosphere, soft morning sunlight casting gentle warmth on minimalist natural elements, deep mindfulness and calmness concept, photorealistic 8k, editorial aesthetic";
  } else {
    enhancedPrompt = HIGH_END_TOTOK_SARAF_PROMPT;
  }

  let result: HeroPhotoResult | null = null;

  // 2. Eksekusi Resmi Imagen 3 (@google/genai imagen-3.0-generate-002)
  if (apiKey) {
    try {
      console.log(`[Imagen] Mengirim request ke Imagen 3 (model: imagen-3.0-generate-002)...`);
      const ai = new GoogleGenAI({ apiKey });
      const model = "imagen-3.0-generate-002";

      const response = await ai.models.generateImages({
        model,
        prompt: enhancedPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: (options?.aspectRatio || "9:16") as "9:16",
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
          promptUsed: enhancedPrompt,
        };
        console.log(`[Imagen] ✅ Berhasil menghasilkan foto asli dari Imagen 3 (${buffer.length} bytes)`);
      }
    } catch (err: unknown) {
      // TAMPILKAN RAW ERROR SECARA EKSPLISIT SESUAI INSTRUKSI CTO
      console.error(">>> [IMAGEN FATAL ERROR]:", err);

      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.includes("Enterprise") ||
        errMsg.includes("Vertex AI") ||
        errMsg.includes("403") ||
        errMsg.includes("billing") ||
        errMsg.includes("PERMISSION_DENIED") ||
        errMsg.includes("RESOURCE_EXHAUSTED")
      ) {
        console.error("\n" + "═".repeat(75));
        console.error("⚠️  [STATUS IZIN GOOGLE IMAGEN 3]");
        console.error("Penyebab Error: API Key Google AI Studio yang digunakan terkena batasan:");
        console.error(`- Detail: ${errMsg}`);
        console.error("- Imagen 3 memerlukan Google Cloud Project dengan billing/Vertex AI aktif,");
        console.error("  atau paket Enterprise Agent Platform dari Google Cloud.");
        console.error("- Sistem secara aman beralih ke Fallback Foto Kurasi Lokal Totok Saraf Makassar.");
        console.error("═".repeat(75) + "\n");
      }
    }
  } else {
    console.warn("⚠️ [Imagen 3] GEMINI_API_KEY tidak dikonfigurasi di environment.");
  }

  // 3. Fallback: Foto Kurasi Lokal Resolusi Tinggi Totok Saraf Asli (Bukan foto stok minyak generic)
  if (!result) {
    console.log(`[Imagen Fallback] Mengambil aset kurasi lokal Totok Saraf Makassar (src/assets/images/)...`);
    const localBuf = await getLocalCuratedPhoto(preset);
    if (localBuf) {
      const mime = detectImageMime(localBuf);
      result = {
        buffer: localBuf,
        base64: `data:${mime};base64,${localBuf.toString("base64")}`,
        mimeType: mime,
        source: "fallback",
        model: preset === "QUOTES" ? "curated-local-quote" : "curated-local-totok-saraf",
        promptUsed: enhancedPrompt,
      };
    }
  }

  // 4. Emergency Vector Buffer (hanya jika disk gagal membaca)
  if (!result) {
    console.warn("[Imagen Fallback] Disk fallback gagal, menggunakan emergency SVG...");
    const emergencyBuf = getEmergencyFallbackBuffer();
    result = {
      buffer: emergencyBuf,
      base64: `data:image/svg+xml;base64,${emergencyBuf.toString("base64")}`,
      mimeType: "image/svg+xml",
      source: "fallback",
      model: "emergency-vector",
      promptUsed: enhancedPrompt,
    };
  }

  // Log status akhir
  console.log(`[Imagen] Status render hero image: ${result.source} | Model: ${result.model || "n/a"}`);
  return result;
}
