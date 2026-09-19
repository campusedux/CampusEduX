import { NextResponse } from "next/server";
import { resolveApiCaller } from "@/lib/apiAuth";
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

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
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

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return corsJson({ error: "Malformed upload." }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return corsJson({ error: "No file uploaded." }, 400);
  if (file.size === 0) return corsJson({ error: "That file is empty." }, 400);
  if (file.size > MAX_FILE_BYTES) return corsJson({ error: "That file is too large (max 8 MB)." }, 400);

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
