import { NextResponse } from "next/server";
import { resolveApiCaller } from "@/lib/apiAuth";
import { RESUME_MAX_BYTES, RESUME_MAX_MB } from "@/lib/resume";
import { limitResponse, rlHit } from "@/lib/rateLimitDb";
import { detectFileType, extractResumeText } from "@/lib/resumeBuilder/fileExtraction";
import { parseResumeText } from "@/lib/resumeBuilder/parser";

/**
 * POST /api/resume/parse — multipart upload, extracts text from a PDF/DOCX
 * and runs the heuristic section parser over it. The uploaded file is only
 * ever held in memory for this one request — it's never written to storage
 * or a database row — and nothing is saved to any resume until the caller
 * explicitly reviews and imports the result client-side.
 *
 * Auth mirrors /api/resume/assist: cookie session (website) OR
 * Authorization: Bearer <supabase JWT> (mobile), with CORS enabled.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};
function corsJson(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

export async function POST(req: Request) {
  const caller = await resolveApiCaller(req);
  if (!caller) return corsJson({ error: "Please sign in again." }, 401);

  const limited = limitResponse(await rlHit(caller.supabase, "resume-parse", RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS), {
    message: "You've uploaded a few resumes already — please wait a bit before trying again.",
    withOk: false,
    headers: CORS_HEADERS,
  });
  if (limited) return limited;

  const contentLength = req.headers.get("content-length");
  if (contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) > RESUME_MAX_BYTES + 64 * 1024)) {
    return corsJson({ error: `That file is too large (max ${RESUME_MAX_MB} MB).` }, 413);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return corsJson({ error: "Malformed upload." }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return corsJson({ error: "No file uploaded." }, 400);
  if (file.size === 0) return corsJson({ error: "That file is empty." }, 400);
  if (file.size > RESUME_MAX_BYTES) return corsJson({ error: `That file is too large (max ${RESUME_MAX_MB} MB).` }, 400);

  const fileType = detectFileType(file.name, file.type);
  if (!fileType) return corsJson({ error: "Please upload a PDF or DOCX file." }, 400);

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = await extractResumeText(buffer, fileType);
  } catch {
    return corsJson(
      { error: "Couldn't read that file — it may be corrupted, password-protected, or a scanned image with no extractable text." },
      422,
    );
  }
  if (!text.trim()) {
    return corsJson({ error: "No text could be extracted from that file (it may be a scanned image). Try a text-based PDF or DOCX." }, 422);
  }

  const parsed = parseResumeText(text);
  return corsJson({ parsed }, 200);
}
