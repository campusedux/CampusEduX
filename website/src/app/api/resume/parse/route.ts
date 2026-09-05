import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/compiler/rateLimit";
import { detectFileType, extractResumeText } from "@/lib/resumeBuilder/fileExtraction";
import { parseResumeText } from "@/lib/resumeBuilder/parser";

/**
 * POST /api/resume/parse — multipart upload, extracts text from a PDF/DOCX
 * and runs the heuristic section parser over it. The uploaded file is only
 * ever held in memory for this one request — it's never written to storage
 * or a database row — and nothing is saved to any resume until the caller
 * explicitly reviews and imports the result client-side.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function clientKey(req: Request): string {
  const fwd = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ip = fwd || req.headers.get("x-real-ip") || "";
  return ip ? `ip:${ip}` : `ua:${(req.headers.get("user-agent") ?? "unknown").slice(0, 100)}`;
}

export async function POST(req: Request) {
  const user = await getOptionalUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const rate = checkRateLimit(`resume-parse:${user.id}:${clientKey(req)}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've uploaded a few resumes already — please wait a bit before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Malformed upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "That file is empty." }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "That file is too large (max 8 MB)." }, { status: 400 });
  }

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) return NextResponse.json({ error: "Please upload a PDF or DOCX file." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = await extractResumeText(buffer, fileType);
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that file — it may be corrupted, password-protected, or a scanned image with no extractable text." },
      { status: 422 },
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "No text could be extracted from that file (it may be a scanned image). Try a text-based PDF or DOCX." },
      { status: 422 },
    );
  }

  const parsed = parseResumeText(text);
  return NextResponse.json({ parsed });
}
