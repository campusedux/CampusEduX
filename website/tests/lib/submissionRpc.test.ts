import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Clients must not INSERT coding_submissions directly (0120/092 drops that policy); both submit
// routes record through the judge-secret-gated RPC instead.
describe.each(["practice", "coding-problems"])("/api/%s/submit", (dir) => {
  const src = readFileSync(resolve(__dirname, `../../src/app/api/${dir}/submit/route.ts`), "utf8");
  it("records via record_coding_submission with the judge secret", () => {
    expect(src).toContain('rpc("record_coding_submission"');
    expect(src).toContain("p_secret: secret");
  });
  it("no longer inserts into coding_submissions directly", () => {
    expect(src).not.toMatch(/from\("coding_submissions"\)/);
  });
});
