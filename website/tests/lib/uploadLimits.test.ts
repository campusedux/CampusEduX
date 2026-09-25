import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RESUME_MAX_BYTES, RESUME_MAX_MB, RESUME_MIME_TYPES } from "@/lib/resume";
import { CP_DOC_TYPES, CP_MAX_FILE_BYTES } from "@/lib/customProjects";

// The bucket limits live in migration 0117/089 (the single source of truth). These tests read the
// SQL and fail when a client constant drifts from it.
const SQL = readFileSync(
  resolve(__dirname, "../../../mobile-app/supabase/migrations/0117_project_files_private_check.sql"),
  "utf8",
);

function bucket(id: string): { bytes: number; mimes: string[] } {
  const re = new RegExp(
    `file_size_limit\\s*=\\s*(\\d+)\\s*\\*\\s*1024\\s*\\*\\s*1024\\s*,\\s*allowed_mime_types\\s*=\\s*array\\[([^\\]]*)\\]\\s*where id\\s*=\\s*'${id}'`,
  );
  const m = SQL.match(re);
  if (!m) throw new Error(`bucket ${id} statement not found in 0117 (shape changed?)`);
  return { bytes: Number(m[1]) * 1024 * 1024, mimes: [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1]) };
}

describe("website upload constants match the storage buckets (0117/089)", () => {
  it("resumes: one size limit everywhere", () => {
    expect(RESUME_MAX_BYTES).toBe(bucket("resumes").bytes);
    expect(RESUME_MAX_MB * 1024 * 1024).toBe(RESUME_MAX_BYTES);
  });

  it("resumes: allowed MIME types are exactly the bucket allow-list", () => {
    expect([...RESUME_MIME_TYPES].sort()).toEqual([...bucket("resumes").mimes].sort());
  });

  it("the résumé parse route and import wizard use the shared limit (no private copy)", () => {
    const route = readFileSync(resolve(__dirname, "../../src/app/api/resume/parse/route.ts"), "utf8");
    const wizard = readFileSync(resolve(__dirname, "../../src/app/account/resume/import/ImportWizard.tsx"), "utf8");
    expect(route).toContain("RESUME_MAX_BYTES");
    expect(route).not.toMatch(/\d+\s*\*\s*1024\s*\*\s*1024/);
    expect(wizard).toContain("RESUME_MAX_MB");
    expect(wizard).not.toMatch(/MAX_FILE_MB\s*=\s*\d/);
  });

  it("custom-project-uploads: size + MIME allow-list", () => {
    const b = bucket("custom-project-uploads");
    expect(CP_MAX_FILE_BYTES).toBe(b.bytes);
    expect([...CP_DOC_TYPES].sort()).toEqual([...b.mimes].sort());
  });

  it("no bucket allows application/octet-stream (clients must send a real type)", () => {
    for (const id of ["avatars", "resumes", "custom-project-uploads"]) {
      expect(bucket(id).mimes).not.toContain("application/octet-stream");
    }
  });
});
