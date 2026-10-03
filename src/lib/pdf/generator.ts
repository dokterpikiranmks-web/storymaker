import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";

export interface GeneratePdfOptions {
  protocol?: LeadMagnetProtocol | null;
  persona?: PersonaSettings | null;
  campaignDate?: string;
  themeTopic?: string;
}

/**
 * Official default somatic & vagus protocol template
 * (Titik GB-20 Leher, Latihan Napas Diafragma 4-7-8, Sugesti Pelepasan Beban Tidur)
 */
export const DEFAULT_OFFICIAL_PROTOCOL: LeadMagnetProtocol = {
  title: "Panduan Saku Reset Somatik & Regulasi Saraf Vagus",
  target_issue: "Meredakan leher kaku, overthinking, dan ketegangan sistem saraf otonom",
  pdf_summary:
    "Protokol klinis 3 langkah mandiri untuk meredakan ketegangan fisik, mengaktifkan rem darurat alami tubuh (saraf vagus), dan merestorasi ketenangan pikiran dalam 3 menit.",
  steps: [
    {
      step: 1,
      title: "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital",
      action:
        "Letakkan kedua jempol di cekungan pangkal tengkorak belakang leher (titik batas antara kepala dan leher). Berikan tekanan lembut mengarah ke atas selama 60 detik sambil memejamkan mata dan bernapas perlahan.",
      duration: "60 detik",
      mechanism:
        "Mengendurkan otot leher belakang yang tegang kaku, melancarkan aliran darah ke otak, dan mematikan alarm siaga tubuh.",
    },
    {
      step: 2,
      title: "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus",
      action:
        "Tarik napas lembut lewat hidung 4 detik, tahan napas santai 7 detik, lalu hembuskan perlahan lewat mulut seperti meniup lilin selama 8 detik. Ulangi 4 hingga 5 siklus.",
      duration: "60 detik",
      mechanism:
        "Hembusan napas yang panjang mengaktifkan saraf vagus (rem alami tubuh) untuk menurunkan denyut jantung dan memicu rasa tenang seketika.",
    },
    {
      step: 3,
      title: "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar",
      action:
        "Letakkan telapak tangan kanan di tengah dada. Rasakan kehangatan tanganmu, turunkan bahu santai, dan katakan dalam hati: 'Hari ini sudah selesai, tubuhku aman untuk beristirahat dan pulih sepenuhnya.'",
      duration: "60 detik",
      mechanism:
        "Menanamkan rasa aman di pikiran bawah sadar dan memindahkan gelombang otak ke status Alpha tenang untuk tidur lelap berkualitas.",
    },
  ],
};

/**
 * Sanitizes strings for standard Helvetica in pdf-lib (WinAnsiEncoding).
 * Standard PDF fonts only support ASCII and Latin-1 characters.
 * Emojis and unmappable unicode characters must be cleaned to avoid encoding errors.
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
 * Generates an executive A4 clinical guide PDF for Lead Magnet Protocol
 * Guaranteed bulletproof: sanitizes all text to WinAnsi and has emergency fallback.
 */
export async function generateProtocolPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const protocol = options.protocol && options.protocol.steps?.length
    ? options.protocol
    : DEFAULT_OFFICIAL_PROTOCOL;

  const persona = options.persona || {
    creatorName: "Dokter Pikiran",
    handle: "@storymaker",
    signature: "Klinik & Edukasi Kesehatan Holistik Dokter Pikiran",
    whatsappNumber: "",
    audience: "",
    voiceNotes: "",
    ctaKeyword: "RESET",
  };

  const campaignDate = options.campaignDate || new Date().toISOString().slice(0, 10);
  const themeTopic = options.themeTopic || protocol.target_issue || "Regulasi Sistem Saraf Otonom";

  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(cleanWinAnsi(protocol.title || "Panduan Protokol Dokter Pikiran"));
    pdfDoc.setAuthor(cleanWinAnsi(persona.creatorName || "Dokter Pikiran"));
    pdfDoc.setSubject("Clinical Self-Regulation Protocol");

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // A4 dimensions: 595.28 x 841.89 pt
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const marginX = 45;
    let cursorY = height - 45;

    // 1. Top Decorative Bar
    page.drawRectangle({
      x: 0,
      y: height - 8,
      width,
      height: 8,
      color: rgb(0.02, 0.58, 0.44), // Emerald
    });

    // 2. Header Branding & Subheader
    page.drawText("DOKTER PIKIRAN: PROTOKOL SOMATIK & BAWAH SADAR", {
      x: marginX,
      y: cursorY,
      size: 9,
      font: fontBold,
      color: rgb(0.02, 0.58, 0.44),
    });

    page.drawText(cleanWinAnsi(`EDISI: ${campaignDate}`), {
      x: width - marginX - 90,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.55),
    });

    cursorY -= 12;

    page.drawText("Klinik & Edukasi Kesehatan Holistik Dokter Pikiran", {
      x: marginX,
      y: cursorY,
      size: 7.5,
      font: fontItalic,
      color: rgb(0.4, 0.45, 0.55),
    });

    cursorY -= 14;

    // Title
    const titleLines = wrapText(protocol.title || "Protokol 3 Menit Reset Somatik", 48);
    for (const line of titleLines) {
      page.drawText(cleanWinAnsi(line), {
        x: marginX,
        y: cursorY,
        size: 18,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });
      cursorY -= 22;
    }

    // Topic & Target Subtitle Box
    cursorY -= 4;
    page.drawRectangle({
      x: marginX,
      y: cursorY - 26,
      width: width - marginX * 2,
      height: 32,
      color: rgb(0.95, 0.97, 0.98),
      borderColor: rgb(0.85, 0.9, 0.93),
      borderWidth: 1,
    });

    page.drawText(cleanWinAnsi(`Target: ${protocol.target_issue || themeTopic || "Regulasi sistem saraf otonom"}`), {
      x: marginX + 12,
      y: cursorY - 14,
      size: 9.5,
      font: fontItalic,
      color: rgb(0.2, 0.25, 0.35),
    });

    cursorY -= 46;

    // Executive Summary Card
    const summaryLines = wrapText(
      protocol.pdf_summary || "Protokol fisik & mental 3 langkah untuk pemulihan cepat sistem saraf.",
      72,
    );
    const summaryBoxHeight = Math.max(48, summaryLines.length * 13 + 22);

    page.drawRectangle({
      x: marginX,
      y: cursorY - summaryBoxHeight + 10,
      width: width - marginX * 2,
      height: summaryBoxHeight,
      color: rgb(0.96, 0.99, 0.98),
      borderColor: rgb(0.65, 0.88, 0.78),
      borderWidth: 1,
    });

    page.drawText("RINGKASAN EKSEKUTIF PROTOKOL:", {
      x: marginX + 12,
      y: cursorY - 4,
      size: 8.5,
      font: fontBold,
      color: rgb(0.02, 0.58, 0.44),
    });

    let sumY = cursorY - 18;
    for (const sLine of summaryLines) {
      page.drawText(cleanWinAnsi(sLine), {
        x: marginX + 12,
        y: sumY,
        size: 9,
        font: fontRegular,
        color: rgb(0.15, 0.2, 0.25),
      });
      sumY -= 12;
    }

    cursorY -= summaryBoxHeight + 14;

    // 3. 3-Step Protocol Cards
    page.drawText("3 LANGKAH IMPLEMENTASI KLINIS:", {
      x: marginX,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    cursorY -= 16;

    const rawSteps = protocol.steps?.length ? protocol.steps.slice(0, 3) : DEFAULT_OFFICIAL_PROTOCOL.steps;

    for (let i = 0; i < rawSteps.length; i++) {
      const fallback = DEFAULT_OFFICIAL_PROTOCOL.steps[i] || DEFAULT_OFFICIAL_PROTOCOL.steps[0];
      const st = rawSteps[i] || fallback;
      const actionText = st.action || fallback.action;
      const mechanismText = st.mechanism || fallback.mechanism;
      const stepTitle = st.title || fallback.title;
      const durationText = st.duration || fallback.duration || "60 detik";

      const actionLines = wrapText(actionText, 68);
      const mechanismLines = wrapText(mechanismText, 68);
      const cardHeight = Math.max(88, actionLines.length * 12 + mechanismLines.length * 11 + 44);

      // Step Card Background
      page.drawRectangle({
        x: marginX,
        y: cursorY - cardHeight + 8,
        width: width - marginX * 2,
        height: cardHeight,
        color: rgb(0.99, 1.0, 1.0),
        borderColor: rgb(0.88, 0.91, 0.94),
        borderWidth: 1,
      });

      // Step Number Badge
      page.drawRectangle({
        x: marginX + 10,
        y: cursorY - 14,
        width: 22,
        height: 18,
        color: rgb(0.02, 0.58, 0.44),
      });

      page.drawText(String(st.step || i + 1), {
        x: marginX + 18,
        y: cursorY - 10,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // Step Title & Duration
      page.drawText(cleanWinAnsi(stepTitle), {
        x: marginX + 38,
        y: cursorY - 10,
        size: 10.5,
        font: fontBold,
        color: rgb(0.08, 0.12, 0.2),
      });

      if (durationText) {
        page.drawText(cleanWinAnsi(`Waktu: ${durationText}`), {
          x: width - marginX - 90,
          y: cursorY - 10,
          size: 8.5,
          font: fontBold,
          color: rgb(0.4, 0.45, 0.55),
        });
      }

      // Action Content
      let textY = cursorY - 28;
      for (const aLine of actionLines) {
        page.drawText(cleanWinAnsi(aLine), {
          x: marginX + 14,
          y: textY,
          size: 9,
          font: fontRegular,
          color: rgb(0.18, 0.22, 0.3),
        });
        textY -= 12;
      }

      // Mechanism Content
      textY -= 3;
      page.drawText("Mekanisme Biologis / Bawah Sadar:", {
        x: marginX + 14,
        y: textY,
        size: 8,
        font: fontBold,
        color: rgb(0.02, 0.58, 0.44),
      });
      textY -= 11;

      for (const mLine of mechanismLines) {
        page.drawText(cleanWinAnsi(mLine), {
          x: marginX + 14,
          y: textY,
          size: 8.5,
          font: fontItalic,
          color: rgb(0.35, 0.4, 0.48),
        });
        textY -= 11;
      }

      cursorY -= cardHeight + 8;
    }

    // 4. Clinical Disclaimer & Contact Footer
    cursorY = Math.max(cursorY, 65);

    page.drawLine({
      start: { x: marginX, y: cursorY },
      end: { x: width - marginX, y: cursorY },
      thickness: 1,
      color: rgb(0.88, 0.91, 0.94),
    });

    cursorY -= 12;

    page.drawText(
      "CATATAN KLINIS: Protokol ini disusun untuk edukasi & regulasi sistem saraf mandiri. Hentikan jika timbul rasa tidak nyaman.",
      {
        x: marginX,
        y: cursorY,
        size: 7.5,
        font: fontItalic,
        color: rgb(0.5, 0.55, 0.65),
      },
    );

    cursorY -= 12;

    const contactName = cleanWinAnsi(persona.creatorName || "Dokter Pikiran");
    const contactSig = "Klinik & Edukasi Kesehatan Holistik Dokter Pikiran";
    const contactWa = cleanWinAnsi(persona.whatsappNumber || "Chat WhatsApp");
    const contactCta = cleanWinAnsi(protocol.keyword || persona.ctaKeyword || "RESET");
    const contactLine = `${contactName} (${contactSig}) - WhatsApp: ${contactWa} - Ketik '${contactCta}'`;

    page.drawText(cleanWinAnsi(contactLine), {
      x: marginX,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.24),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (genErr) {
    console.error("[generateProtocolPdf] Gagal render PDF kompleks, menggunakan emergency canvas:", genErr);
    // Minimal emergency PDF
    const emergencyDoc = await PDFDocument.create();
    const ePage = emergencyDoc.addPage([595.28, 841.89]);
    const eFont = await emergencyDoc.embedFont(StandardFonts.HelveticaBold);
    const eFontReg = await emergencyDoc.embedFont(StandardFonts.Helvetica);

    ePage.drawText("DOKTER PIKIRAN: PROTOKOL SOMATIK & BAWAH SADAR", { x: 45, y: 780, size: 15, font: eFont });
    ePage.drawText("Klinik & Edukasi Kesehatan Holistik Dokter Pikiran", { x: 45, y: 760, size: 10, font: eFontReg });
    ePage.drawText("1. Titik GB-20 Leher: Tekan cekungan pangkal tengkorak 60 detik perlahan.", {
      x: 45,
      y: 720,
      size: 11,
      font: eFontReg,
    });
    ePage.drawText("2. Latihan Napas Diafragma 4-7-8: Tarik 4 detik, tahan 7 detik, hembus 8 detik.", {
      x: 45,
      y: 680,
      size: 11,
      font: eFontReg,
    });
    ePage.drawText("3. Sugesti Pelepasan Beban Tidur: Sentuh dada tengah, afirmasikan ketenangan.", {
      x: 45,
      y: 640,
      size: 11,
      font: eFontReg,
    });

    const emergencyBytes = await emergencyDoc.save();
    return Buffer.from(emergencyBytes);
  }
}
