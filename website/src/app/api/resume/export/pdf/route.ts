import { NextResponse } from "next/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { limitResponse, rlHit } from "@/lib/rateLimitDb";
import { z } from "zod";
import { loadOwnResumeForExport, recordResumeDownload, snapshotBeforeExport } from "@/lib/resumeBuilder/loadForExport";
import { renderResumePdfBuffer } from "@/lib/resumeBuilder/pdfDocument";
import { slugifyFileName } from "@/lib/resumeBuilder/formatting";

/**
 * GET /api/resume/export/pdf?resumeId=<uuid> — streams a real, selectable-text
 * PDF built from the resume's actual saved content (buildResumeRenderModel(),
 * shared with the live preview) and logs the download to resume_downloads.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ resumeId: z.string().uuid() });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ resumeId: url.searchParams.get("resumeId") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const result = await loadOwnResumeForExport(parsed.data.resumeId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const limited = limitResponse(await rlHit(createAuthedServerSupabase(), "resume-export", 10, 600), { message: "Too many exports. Please retry shortly." });
  if (limited) return limited;

  const buffer = await renderResumePdfBuffer(result.resume, result.accentColor);
  const fileName = `${slugifyFileName(result.resume.title)}.pdf`;
  await recordResumeDownload(result.userId, result.resume, fileName);
  await snapshotBeforeExport(result.userId, result.resume);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
