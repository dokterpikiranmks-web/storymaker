import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";

export interface GeneratePdfOptions {
  protocol: LeadMagnetProtocol;
  persona: PersonaSettings;
  campaignDate?: string;
  themeTopic?: string;
}

/**
 * Text wrapping helper for standard Helvetica in pdf-lib
 */
function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [];
  const paragraphs = text.split("\n");
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
 * Compatible with Vercel Node runtime without Chromium or canvas dependencies.
 */
export async function generateProtocolPdf(options: GeneratePdfOptions): Promise<Buffer> {
  const { protocol, persona, campaignDate = new Date().toISOString().slice(0, 10), themeTopic } = options;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(protocol.title || "Dr. Mind Somatic & Cognitive Protocol");
  pdfDoc.setAuthor(persona.creatorName || "Sang Alchemist");
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

  // 2. Header Branding
  page.drawText("DR. MIND SCOUT · CLINICAL SOMATIC & COGNITIVE PROTOCOL", {
    x: marginX,
    y: cursorY,
    size: 9,
    font: fontBold,
    color: rgb(0.02, 0.58, 0.44),
  });

  page.drawText(`EDISI: ${campaignDate}`, {
    x: width - marginX - 90,
    y: cursorY,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  cursorY -= 22;

  // Title
  const titleLines = wrapText(protocol.title || "Protokol 3 Menit Reset Somatik", 48);
  for (const line of titleLines) {
    page.drawText(line, {
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

  page.drawText(`Target: ${protocol.target_issue || themeTopic || "Regulasi sistem saraf otonom"}`, {
    x: marginX + 12,
    y: cursorY - 14,
    size: 9.5,
    font: fontItalic,
    color: rgb(0.2, 0.25, 0.35),
  });

  cursorY -= 46;

  // Executive Summary Card
  const summaryLines = wrapText(protocol.pdf_summary || "Protokol fisik & mental 3 langkah untuk pemulihan cepat.", 72);
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
    page.drawText(sLine, {
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

  const steps = protocol.steps?.length ? protocol.steps.slice(0, 3) : [];

  for (const st of steps) {
    const actionLines = wrapText(st.action, 68);
    const mechanismLines = wrapText(st.mechanism, 68);
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

    page.drawText(String(st.step), {
      x: marginX + 18,
      y: cursorY - 10,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Step Title & Duration
    page.drawText(st.title, {
      x: marginX + 38,
      y: cursorY - 10,
      size: 10.5,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.2),
    });

    if (st.duration) {
      page.drawText(`⏱ ${st.duration}`, {
        x: width - marginX - 80,
        y: cursorY - 10,
        size: 8.5,
        font: fontBold,
        color: rgb(0.4, 0.45, 0.55),
      });
    }

    // Action Content
    let textY = cursorY - 28;
    for (const aLine of actionLines) {
      page.drawText(aLine, {
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
      page.drawText(mLine, {
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

  const contactLine = `${persona.creatorName} (${persona.signature}) · WhatsApp Konsultasi: ${persona.whatsappNumber || "Chat Admin"} · Ketik '${persona.ctaKeyword}'`;
  page.drawText(contactLine, {
    x: marginX,
    y: cursorY,
    size: 8,
    font: fontBold,
    color: rgb(0.12, 0.16, 0.24),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
