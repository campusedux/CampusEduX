import { Document, Packer, Paragraph, TextRun } from "docx";
import { buildResumeRenderModel } from "./renderModel";
import type { ResumeDocument } from "./types";

function hexColor(color: string): string {
  return color.replace("#", "").toUpperCase();
}

/**
 * Same content, same section order as the PDF/HTML preview — DOCX can't
 * pixel-match either of those (Word owns final layout), so this targets
 * "professionally formatted text a recruiter can open in Word," not visual
 * parity down to the pixel.
 */
export async function renderResumeDocxBuffer(resume: ResumeDocument, accentColor: string): Promise<Buffer> {
  const model = buildResumeRenderModel(resume);
  const accent = hexColor(accentColor);

  const children: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: model.fullName, bold: true, size: 32 })] }),
  ];

  if (model.jobTitle) {
    children.push(new Paragraph({ children: [new TextRun({ text: model.jobTitle, color: accent, size: 22 })] }));
  }
  if (model.contactLine) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: model.contactLine, color: "6B7280", size: 18 })],
        spacing: { after: 200 },
      }),
    );
  }

  for (const block of model.blocks) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: block.heading.toUpperCase(), bold: true, color: accent, size: 20 })],
        spacing: { before: 200, after: 80 },
      }),
    );
    for (const line of block.lines) {
      children.push(new Paragraph({ children: [new TextRun({ text: line, size: 20 })], spacing: { after: 40 } }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
