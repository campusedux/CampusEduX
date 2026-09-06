import { AlignmentType, BorderStyle, Document, Packer, Paragraph, TextRun } from "docx";
import { buildResumeRenderModel } from "./renderModel";
import { templateSpec } from "./templateSpecs";
import { resolveDesign, effectiveAccent } from "./design";
import type { ResumeDocument } from "./types";

const BULLET_RE = /^\s*[•\-–*]\s+/;

function hexColor(color: string): string {
  return color.replace("#", "").toUpperCase();
}

/**
 * Same content and section order as the PDF / HTML preview, with the chosen
 * template's font, header alignment and heading rule applied from the shared
 * TemplateSpec (templateSpecs.ts). DOCX still can't pixel-match the other two
 * (Word owns final layout) — this targets "professionally formatted text a
 * recruiter can open in Word", consistent with the template they picked.
 */
export async function renderResumeDocxBuffer(resume: ResumeDocument, accentColor: string): Promise<Buffer> {
  const model = buildResumeRenderModel({ personalDetails: resume.personalDetails, content: resume.content });
  const spec = resolveDesign(templateSpec(resume.template), resume.design);
  const accentColorEff = effectiveAccent(accentColor, resume.design);
  const showAccent = spec.accent !== "none";
  const accent = showAccent && spec.accent === "bold" ? hexColor(accentColorEff) : showAccent ? "1F2937" : "374151";
  const headingColor = spec.heading === "full-underline" ? "000000" : accent;
  const font = spec.pdfFont === "Times-Roman" ? "Times New Roman" : "Arial";
  const centered = spec.header === "centered-serif";
  const headerAlign = centered ? AlignmentType.CENTER : AlignmentType.LEFT;

  const children: Paragraph[] = [
    new Paragraph({ alignment: headerAlign, children: [new TextRun({ text: model.fullName, bold: true, size: 32, font })] }),
  ];

  if (model.jobTitle) {
    children.push(
      new Paragraph({
        alignment: headerAlign,
        children: [new TextRun({ text: model.jobTitle, color: showAccent && spec.accent === "bold" ? hexColor(accentColorEff) : "374151", size: 22, font })],
      }),
    );
  }
  if (model.contactLine) {
    children.push(
      new Paragraph({
        alignment: headerAlign,
        children: [new TextRun({ text: model.contactLine, color: "6B7280", size: 18, font })],
        spacing: { after: 200 },
      }),
    );
  }

  const bullet = spec.bulletChar || "•";

  for (const block of model.blocks) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: block.heading.toUpperCase(), bold: true, color: headingColor, size: 20, font })],
        spacing: { before: 220, after: 80 },
        border:
          spec.heading === "full-underline"
            ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000", space: 1 } }
            : undefined,
      }),
    );

    if (block.variant === "entries" && block.entries) {
      for (const entry of block.entries) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: entry.subtitle ? `${entry.title} — ${entry.subtitle}` : entry.title, bold: true, size: 20, font }),
              ...(entry.meta ? [new TextRun({ text: `   ${entry.meta}`, color: "6B7280", size: 18, font })] : []),
            ],
            spacing: { before: 80, after: 20 },
          }),
        );
        for (const b of entry.bullets) {
          children.push(new Paragraph({ children: [new TextRun({ text: `${bullet}  ${b}`, size: 20, font })], spacing: { after: 30 }, indent: { left: 220 } }));
        }
        if (entry.tags.length) {
          children.push(new Paragraph({ children: [new TextRun({ text: entry.tags.join(" · "), color: "6B7280", size: 18, font })], spacing: { after: 40 } }));
        }
      }
      continue;
    }

    for (const rawLine of block.lines) {
      const isBullet = BULLET_RE.test(rawLine);
      const text = isBullet ? `${bullet}  ${rawLine.replace(BULLET_RE, "")}` : rawLine;
      children.push(
        new Paragraph({
          children: [new TextRun({ text, size: 20, font })],
          spacing: { after: 40 },
          indent: isBullet ? { left: 220 } : undefined,
        }),
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
