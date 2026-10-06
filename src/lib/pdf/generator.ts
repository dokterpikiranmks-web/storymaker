import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";

export interface DynamicStoryPdfData {
  topic: string;
  pillar?: string;
  keyword?: string;
  edukasi?: string;
  praktik?: string;
  bukti?: string;
  date?: string;
  steps?: Array<{
    step: number;
    title: string;
    action: string;
    duration?: string;
    mechanism?: string;
  }>;
}

export interface GeneratePdfOptions {
  protocol?: LeadMagnetProtocol | null;
  persona?: PersonaSettings | null;
  campaignDate?: string;
  themeTopic?: string;
  storyData?: DynamicStoryPdfData | null;
}

/**
 * Official default somatic & vagus protocol template (Dokter Pikiran Makassar V2.3)
 * Anti-klise: Jaw Release, Sub-occipital Eye Reset, Physiological Sigh.
 */
export const DEFAULT_OFFICIAL_PROTOCOL: LeadMagnetProtocol = {
  title: "Panduan Saku Reset Somatik & Regulasi Sistem Saraf Bawah Sadar",
  target_issue: "Meredakan asam lambung psikosomatis, leher kaku, dan alarm bahaya sistem saraf",
  pdf_summary:
    "Panduan klinis mandiri untuk memutus kuncian saraf simpatik, merelaksasi katup lambung, dan mengembalikan rasa aman biologis tanpa klise motivasi murahan.",
  steps: [
    {
      step: 1,
      title: "Trigeminal Jaw Release: Pemutus Sinyal Darurat Lambung",
      action:
        "Renggangkan rahang, buka mulut santai, lalu tempelkan ujung lidah secara lembut ke langit-langit mulut bagian depan. Tahan posisi rileks ini selama 60 detik sambil bernapas wajar.",
      duration: "60 detik",
      mechanism:
        "Jalur saraf trigeminal rahang terhubung ke katup lambung. Melepas kuncian rahang memutus sinyal darurat lambung dan menghentikan suara overthinking di kepala.",
    },
    {
      step: 2,
      title: "Sub-occipital Eye Reset: Pelepasan Kuncian Saraf Leher Belakang",
      action:
        "Tanpa menolehkan kepala, lirikkan kedua bola mata sejauh mungkin ke sudut kanan bawah selama 30 detik sampai muncul refleks menguap, menghela napas panjang, atau menelan ludah.",
      duration: "60 detik",
      mechanism:
        "Mereset persarafan suboksipital di belakang leher, mematikan alarm siaga otak, dan memindahkan sistem saraf ke status restoratif tenang.",
    },
    {
      step: 3,
      title: "Physiological Sigh: Stabilisasi Alveoli Paru & Denyut Jantung",
      action:
        "Ambil dua tarikan napas pendek cepat lewat hidung, lalu hembuskan satu tarikan napas panjang perlahan lewat mulut seperti meniup lilin. Ulangi 3 siklus.",
      duration: "60 detik",
      mechanism:
        "Mekar alveoli paru-paru yang mengempis dan membuang karbon dioksida berlebih untuk melambatkan detak jantung dalam 30 detik.",
    },
  ],
};

/**
 * Sanitizes strings for standard Helvetica in pdf-lib (WinAnsiEncoding).
 * Standard PDF fonts only support ASCII and Latin-1 characters.
 */
export function cleanWinAnsi(text: unknown): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2022\u00B7]/g, "-")
    .replace(/[\u23F1\u23F2\u23F3\u231A\u231B]/g, "")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Text wrapping helper for standard Helvetica in pdf-lib
 */
function wrapText(text: unknown, maxChars: number): string[] {
  const clean = cleanWinAnsi(text);
  if (!clean) return [];
  const paragraphs = clean.split("\n");
  const result: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      result.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = "";
    for (const word of words) {
      if ((currentLine + " " + word).trim().length <= maxChars) {
        currentLine = (currentLine + " " + word).trim();
      } else {
        if (currentLine) result.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) result.push(currentLine);
  }
  return result;
}

/**
 * Format detail instruksi langkah latihan somatik dari teks Story 3
 */
function deriveSomaticSteps(praktikText: string, pillar = "TUBUH") {
  const clean = cleanWinAnsi(praktikText);
  const p = (pillar || "TUBUH").toUpperCase();

  if (p === "TUBUH" || clean.toLowerCase().includes("rahang") || clean.toLowerCase().includes("jaw")) {
    return [
      {
        step: 1,
        title: "Langkah 1: Relaksasi Rahang",
        desc: "Renggangkan gigitan gigi atas dan bawah, biarkan rahang bawah menggantung santai tanpa tegangan.",
      },
      {
        step: 2,
        title: "Langkah 2: Tempelkan Ujung Lidah",
        desc: "Tempelkan ujung lidah secara lembut di langit-langit mulut depan (tepat di belakang gigi seri atas). Tahan selama 60 detik.",
      },
      {
        step: 3,
        title: "Langkah 3: Pemutusan Alarm Lambung",
        desc: "Jalur saraf rahang terhubung ke saraf lambung. Saat lidah rileks, alarm darurat terputus dan katup esofagus mengunci rapat.",
      },
    ];
  }

  if (p === "PIKIRAN" || clean.toLowerCase().includes("mata") || clean.toLowerCase().includes("eye")) {
    return [
      {
        step: 1,
        title: "Langkah 1: Posisi Kepala Netral",
        desc: "Duduk tegak dengan kepala lurus menghadap depan. Jangan menolehkan kepala Anda.",
      },
      {
        step: 2,
        title: "Langkah 2: Lirikan Lateral 30 Detik",
        desc: "Tanpa memutar kepala, lirikkan kedua bola mata sejauh mungkin ke sudut kanan bawah selama 30 detik.",
      },
      {
        step: 3,
        title: "Langkah 3: Rilis Refleks Alami",
        desc: "Tunggu munculnya refleks spontan: menelan ludah, menghela napas, atau menguap. Kuncian saraf leher belakang terlepas seketika.",
      },
    ];
  }

  // TEKNOLOGI / Physiological Sigh
  return [
    {
      step: 1,
      title: "Langkah 1: Dua Tarikan Cepat Lewat Hidung",
      desc: "Ambil satu tarikan napas dalam lewat hidung, lalu segera sambung dengan tarikan kedua yang pendek dan cepat.",
    },
    {
      step: 2,
      title: "Langkah 2: Hembusan Panjang Lewat Mulut",
      desc: "Buka mulut santai dan hembuskan seluruh udara secara perlahan hingga paru-paru kosong sempurna (6-8 detik).",
    },
    {
      step: 3,
      title: "Langkah 3: Ulangi 2-3 Siklus",
      desc: "Alveoli paru-paru mekar seketika, detak jantung melambat, dan sistem saraf simpatik berpindah ke mode istirahat dalam 30 detik.",
    },
  ];
}

/**
 * Generates an executive 1-page A4 clean clinical guide PDF
 * Brand: DOKTER PIKIRAN MAKASSAR (Ahmad Jawahir Zain)
 */
export async function generateProtocolPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const storyData = options.storyData;
  const campaignDate = options.campaignDate || new Date().toISOString().slice(0, 10);

  // Data terintegrasi
  const title = cleanWinAnsi(
    storyData?.topic || options.protocol?.title || options.themeTopic || "Panduan Protokol Dokter Pikiran Makassar"
  );
  const pillar = cleanWinAnsi(storyData?.pillar || "TUBUH").toUpperCase();
  const keyword = cleanWinAnsi(storyData?.keyword || options.protocol?.keyword || "LAMBUNG").toUpperCase();
  const edukasi = cleanWinAnsi(
    storyData?.edukasi ||
      options.protocol?.pdf_summary ||
      "Saat saraf siaga aktif, tubuh mengalami anomali biologis. Memahami mekanisme paradoks ini adalah kunci awal pemulihan."
  );
  const praktik = cleanWinAnsi(
    storyData?.praktik ||
      (options.protocol?.steps?.[0]?.action
        ? `${options.protocol.steps[0].title}: ${options.protocol.steps[0].action}`
        : "Latihan fisik mikro 60 detik untuk mereset alarm bahaya sistem saraf.")
  );
  const bukti = cleanWinAnsi(
    storyData?.bukti ||
      "Kasus meja terapi Makassar: bertahun-tahun pasien mencoba solusi konvensional tanpa hasil. Begitu alarm biologis tubuhnya direset, keluhannya reda total."
  );

  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor("Dokter Pikiran Makassar (Ahmad Jawahir Zain)");
    pdfDoc.setSubject("Panduan Praktis Mandiri Sistem Saraf & Bawah Sadar");

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // A4 dimensions: 595.28 x 841.89 pt
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const marginX = 42;
    const contentWidth = width - marginX * 2;
    let cursorY = height - 36;

    // 1. Top Decorative Bar
    page.drawRectangle({
      x: 0,
      y: height - 8,
      width,
      height: 8,
      color: rgb(0.04, 0.48, 0.38), // Deep Emerald Forest
    });

    // 2. Header Branding & Lokasi Resmi Makassar
    page.drawText("DOKTER PIKIRAN MAKASSAR - PANDUAN PRAKTIS MANDIRI", {
      x: marginX,
      y: cursorY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.04, 0.48, 0.38),
    });

    page.drawText(cleanWinAnsi(`EDISI: ${campaignDate} • WITA (UTC+8)`), {
      x: width - marginX - 145,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.55),
    });

    cursorY -= 12;

    page.drawText("Klinik Hipnoterapi & Pemulihan Sistem Saraf Bawah Sadar • Ahmad Jawahir Zain", {
      x: marginX,
      y: cursorY,
      size: 7.8,
      font: fontItalic,
      color: rgb(0.35, 0.4, 0.5),
    });

    cursorY -= 12;

    // Divider Header
    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: width - marginX, y: cursorY },
      thickness: 1,
      color: rgb(0.85, 0.89, 0.93),
    });

    cursorY -= 18;

    // 3. Judul Dokumen (Sesuai Topik Story Hari Itu)
    const titleLines = wrapText(title, 48);
    for (const line of titleLines) {
      page.drawText(line, {
        x: marginX,
        y: cursorY,
        size: 15.5,
        font: fontBold,
        color: rgb(0.08, 0.12, 0.18),
      });
      cursorY -= 20;
    }

    // Subtitle Pill (Pilar & Trigger Keyword)
    cursorY -= 2;
    page.drawRectangle({
      x: marginX,
      y: cursorY - 14,
      width: contentWidth,
      height: 22,
      color: rgb(0.94, 0.97, 0.96),
      borderColor: rgb(0.78, 0.88, 0.84),
      borderWidth: 1,
    });

    const pillText = `PILAR: ${pillar} • KATA KUNCI BALAS WA STORY: '${keyword}' • MAKASSAR, SULAWESI SELATAN`;
    page.drawText(cleanWinAnsi(pillText), {
      x: marginX + 10,
      y: cursorY - 7,
      size: 8,
      font: fontBold,
      color: rgb(0.04, 0.45, 0.35),
    });

    cursorY -= 32;

    // 4. BAGIAN 1: Inti Edukasi & Mekanisme Paradoks (Story 2)
    const edukasiLines = wrapText(edukasi, 68);
    const edukasiBoxHeight = Math.max(68, edukasiLines.length * 12 + 34);

    page.drawRectangle({
      x: marginX,
      y: cursorY - edukasiBoxHeight + 10,
      width: contentWidth,
      height: edukasiBoxHeight,
      color: rgb(0.96, 0.98, 1.0),
      borderColor: rgb(0.78, 0.86, 0.96),
      borderWidth: 1,
    });

    page.drawText("1. INTI EDUKASI & MEKANISME PARADOKS (CARA KERJA TERBALIK):", {
      x: marginX + 12,
      y: cursorY - 4,
      size: 8.5,
      font: fontBold,
      color: rgb(0.12, 0.32, 0.65),
    });

    let eY = cursorY - 18;
    for (const el of edukasiLines) {
      page.drawText(el, {
        x: marginX + 12,
        y: eY,
        size: 9,
        font: fontRegular,
        color: rgb(0.12, 0.16, 0.24),
      });
      eY -= 12;
    }

    cursorY -= edukasiBoxHeight + 14;

    // 5. BAGIAN 2: Panduan Tindakan: Latihan Somatik Mikro 60 Detik (Story 3)
    const somaticSteps = deriveSomaticSteps(praktik, pillar);
    const stepsTotalHeight = 180;

    page.drawRectangle({
      x: marginX,
      y: cursorY - stepsTotalHeight + 10,
      width: contentWidth,
      height: stepsTotalHeight,
      color: rgb(0.97, 0.99, 0.98),
      borderColor: rgb(0.68, 0.88, 0.78),
      borderWidth: 1,
    });

    page.drawText("2. PANDUAN TINDAKAN: MANUVER SOMATIK MIKRO 60 DETIK MANDIRI", {
      x: marginX + 12,
      y: cursorY - 4,
      size: 9,
      font: fontBold,
      color: rgb(0.04, 0.48, 0.38),
    });

    page.drawText("PRAKTIK FISIK LANGSUNG DI RUMAH / TEMPAT KERJA", {
      x: width - marginX - 195,
      y: cursorY - 4,
      size: 7.5,
      font: fontBold,
      color: rgb(0.4, 0.5, 0.45),
    });

    let stepCursorY = cursorY - 24;

    for (const st of somaticSteps) {
      // Step number badge
      page.drawRectangle({
        x: marginX + 12,
        y: stepCursorY - 10,
        width: 18,
        height: 16,
        color: rgb(0.04, 0.48, 0.38),
      });

      page.drawText(String(st.step), {
        x: marginX + 18,
        y: stepCursorY - 7,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page.drawText(cleanWinAnsi(st.title), {
        x: marginX + 36,
        y: stepCursorY - 6,
        size: 9.5,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.22),
      });

      const descLines = wrapText(st.desc, 66);
      let dY = stepCursorY - 19;
      for (const dl of descLines) {
        page.drawText(dl, {
          x: marginX + 36,
          y: dY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.32),
        });
        dY -= 11;
      }

      stepCursorY -= 48;
    }

    cursorY -= stepsTotalHeight + 14;

    // 6. BAGIAN 3: Catatan Meja Terapi Makassar (Story 4)
    const buktiLines = wrapText(bukti, 68);
    const buktiBoxHeight = Math.max(52, buktiLines.length * 11.5 + 26);

    page.drawRectangle({
      x: marginX,
      y: cursorY - buktiBoxHeight + 8,
      width: contentWidth,
      height: buktiBoxHeight,
      color: rgb(0.98, 0.98, 0.99),
      borderColor: rgb(0.85, 0.88, 0.92),
      borderWidth: 1,
    });

    page.drawText("CATATAN MEJA TERAPI MAKASSAR (FAKTA KLINIS RIIL):", {
      x: marginX + 12,
      y: cursorY - 4,
      size: 8,
      font: fontBold,
      color: rgb(0.3, 0.35, 0.45),
    });

    let bY = cursorY - 17;
    for (const bl of buktiLines) {
      page.drawText(bl, {
        x: marginX + 12,
        y: bY,
        size: 8.5,
        font: fontItalic,
        color: rgb(0.2, 0.25, 0.35),
      });
      bY -= 11.5;
    }

    cursorY -= buktiBoxHeight + 16;

    // 7. PENUTUP & FOOTER KONTAK RESMI MAKASSAR
    cursorY = Math.max(cursorY, 68);

    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: width - marginX, y: cursorY },
      thickness: 1,
      color: rgb(0.85, 0.89, 0.93),
    });

    cursorY -= 12;

    page.drawText(
      "Refleksi: Tubuh dan pikiran Anda adalah sistem cerdas. Sembuh bukan memaksa diri tenang, tapi memberi sinyal aman pada saraf.",
      {
        x: marginX,
        y: cursorY,
        size: 7.8,
        font: fontItalic,
        color: rgb(0.4, 0.45, 0.55),
      }
    );

    cursorY -= 13;

    const footerText = `DOKTER PIKIRAN • Ahmad Jawahir Zain • Makassar, WITA (UTC+8) • Balas Story: '${keyword}'`;
    page.drawText(cleanWinAnsi(footerText), {
      x: marginX,
      y: cursorY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.2),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (genErr) {
    console.error("[generateProtocolPdf] Gagal render PDF dinamis, menggunakan fail-safe:", genErr);
    // Minimal emergency PDF dengan identitas Makassar
    const emergencyDoc = await PDFDocument.create();
    const ePage = emergencyDoc.addPage([595.28, 841.89]);
    const eFont = await emergencyDoc.embedFont(StandardFonts.HelveticaBold);
    const eFontReg = await emergencyDoc.embedFont(StandardFonts.Helvetica);

    ePage.drawText("DOKTER PIKIRAN MAKASSAR: PANDUAN PRAKTIS MANDIRI", { x: 42, y: 790, size: 14, font: eFont });
    ePage.drawText("Klinik Hipnoterapi & Pemulihan Sistem Saraf Bawah Sadar • Makassar", {
      x: 42,
      y: 770,
      size: 9.5,
      font: eFontReg,
    });
    ePage.drawText(cleanWinAnsi(`Topik: ${title}`), { x: 42, y: 740, size: 11, font: eFont });
    ePage.drawText("1. Inti Edukasi: Mekanisme biologis di balik alarm sistem saraf.", { x: 42, y: 700, size: 9.5, font: eFontReg });
    ePage.drawText("2. Praktik 60 Detik: Renggangkan rahang, tempelkan lidah ke langit-langit mulut.", { x: 42, y: 670, size: 9.5, font: eFontReg });
    ePage.drawText("3. Catatan Terapi Makassar: Alarm biologis rilis saat tubuh diberi sinyal aman.", { x: 42, y: 640, size: 9.5, font: eFontReg });

    const emergencyBytes = await emergencyDoc.save();
    return Buffer.from(emergencyBytes);
  }
}
