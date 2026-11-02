import { NextResponse } from "next/server";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { limitResponse, rlHit } from "@/lib/rateLimitDb";
import { z } from "zod";
import { loadOwnResumeForExport, recordResumeDownload, snapshotBeforeExport } from "@/lib/resumeBuilder/loadForExport";
import { renderResumeDocxBuffer } from "@/lib/resumeBuilder/docxBuilder";
import { slugifyFileName } from "@/lib/resumeBuilder/formatting";

/**
 * GET /api/resume/export/docx?resumeId=<uuid> — a Word-openable DOCX built
 * from the same buildResumeRenderModel() the PDF and live preview use.
 * Content and section order match the other exports; DOCX layout is Word's
 * own, not a pixel-match of the PDF/preview.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({ resumeId: z.guid() });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({ resumeId: url.searchParams.get("resumeId") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const result = await loadOwnResumeForExport(parsed.data.resumeId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const limited = limitResponse(await rlHit(await createAuthedServerSupabase(), "resume-export", 10, 600), { message: "Too many exports. Please retry shortly." });
  if (limited) return limited;

  const buffer = await renderResumeDocxBuffer(result.resume, result.accentColor);
  const fileName = `${slugifyFileName(result.resume.title)}.docx`;
  await recordResumeDownload(result.userId, result.resume, fileName);
  await snapshotBeforeExport(result.userId, result.resume);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
