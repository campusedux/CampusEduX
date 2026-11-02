import { validateAcademicOrder } from "../../../supabase/functions/_shared/academicIntegrity";

const base = {
  projectType: "academic",
  assessmentUse: "yes",
  serviceScope: "mentoring",
  studentAuthored: true,
  integrityAcknowledged: true,
  featureIds: [] as string[],
  text: ["Review my own code"],
};

describe("academic order scope", () => {
  it("accepts assessed mentoring and rejects assessed feature packages", () => {
    expect(validateAcademicOrder(base)).toBeNull();
    expect(validateAcademicOrder({ ...base, featureIds: ["doc-ppt"] })).toMatch(/unavailable/);
    expect(validateAcademicOrder({ ...base, serviceScope: "custom_software" })).toMatch(/mentoring/);
  });

  it("accepts feature packages only for non-assessed software", () => {
    const software = { ...base, assessmentUse: "no", serviceScope: "custom_software", studentAuthored: true, featureIds: ["auth-google", "doc-ppt"] };
    expect(validateAcademicOrder(software)).toBeNull();
    expect(validateAcademicOrder({ ...software, assessmentUse: "yes" })).toMatch(/mentoring/);
    expect(validateAcademicOrder({ ...software, studentAuthored: false })).toMatch(/not for assessed work/);
    expect(validateAcademicOrder({ ...software, featureIds: [42] })).toMatch(/Invalid feature/);
  });

  it("requires an explicit checkout declaration", () => {
    expect(validateAcademicOrder({ ...base, assessmentUse: false })).toMatch(/whether this relates/);
    expect(validateAcademicOrder({ ...base, assessmentUse: undefined })).toMatch(/whether this relates/);
  });
});
