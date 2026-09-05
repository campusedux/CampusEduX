import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export type SupportedResumeFileType = "pdf" | "docx";

export function detectFileType(fileName: string, mimeType: string): SupportedResumeFileType | null {
  const lower = fileName.toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    return "docx";
  }
  return null;
}

/** Extracts raw text from an uploaded PDF. The file is never persisted — only its extracted text lives past this call. */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

/** Extracts raw text from an uploaded DOCX. */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractResumeText(buffer: Buffer, fileType: SupportedResumeFileType): Promise<string> {
  return fileType === "pdf" ? extractTextFromPdf(buffer) : extractTextFromDocx(buffer);
}
