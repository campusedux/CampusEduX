import { describe, expect, it } from "vitest";
import { validateAcademicOrder } from "../../../mobile-app/supabase/functions/_shared/academicIntegrity";

const mentoring = {
  projectType: "academic",
  serviceScope: "mentoring",
  assessmentUse: "yes",
  studentAuthored: true,
  integrityAcknowledged: true,
  featureIds: [],
  text: ["Please review my own code and explain the bug"],
};

describe("new order academic-integrity gate", () => {
  it("allows mentoring on student-authored assessed work", () => {
    expect(validateAcademicOrder(mentoring)).toBeNull();
  });
  it("blocks an academic completion package even when its title sounds harmless", () => {
    expect(validateAcademicOrder({ ...mentoring, featureIds: ["doc-academic-package"] })).toMatch(/unavailable/);
  });
  it("blocks an explicit request to complete an assessment", () => {
    expect(validateAcademicOrder({ ...mentoring, text: ["Please write my final-year project for me"] })).toMatch(/cannot complete/);
  });
  it("allows ordinary business software", () => {
    expect(validateAcademicOrder({ ...mentoring, projectType: "business", serviceScope: "custom_software", assessmentUse: "no", studentAuthored: false, featureIds: ["pay-razorpay"], text: ["Build our shop website"] })).toBeNull();
  });
  it("rejects bypasses through a business type, missing answers, and forged scope", () => {
    expect(validateAcademicOrder({ ...mentoring, projectType: "business", assessmentUse: "yes" })).toMatch(/mentoring/);
    expect(validateAcademicOrder({ ...mentoring, projectType: "business", assessmentUse: "no", text: ["Do my assignment"] })).toMatch(/mentoring/);
    expect(validateAcademicOrder({ ...mentoring, integrityAcknowledged: false })).toMatch(/Acknowledge/);
    expect(validateAcademicOrder({ ...mentoring, studentAuthored: false })).toMatch(/author/);
    expect(validateAcademicOrder({ ...mentoring, serviceScope: "custom_software" })).toMatch(/mentoring/);
  });
});
