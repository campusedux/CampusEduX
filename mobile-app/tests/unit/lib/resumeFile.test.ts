import { assertResumeSize, MAX_RESUME_BYTES } from "@/lib/resumeFile";

describe("assertResumeSize (MOB-10: 5MB is really enforced)", () => {
  it("accepts files at or under 5MB and unknown sizes", () => {
    expect(() => assertResumeSize(MAX_RESUME_BYTES)).not.toThrow();
    expect(() => assertResumeSize(undefined)).not.toThrow();
  });
  it("rejects larger files with a friendly message", () => {
    expect(() => assertResumeSize(MAX_RESUME_BYTES + 1)).toThrow(/5MB or less/);
  });
});
