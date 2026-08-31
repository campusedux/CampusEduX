import {
  academicScore,
  rankByAcademicRelevance,
  hasAcademicSignal,
  academicKey,
  academicFromUser,
  type AcademicProfile,
  type AcademicTargeting,
} from "@/lib/personalization";

const computer: AcademicProfile = { course: "B.Tech", branch: "Computer Science Engineering", year: "3rd Year" };
const pharmacy: AcademicProfile = { course: "B.Pharm", branch: "Pharmacy", year: "2nd Year" };

const global: AcademicTargeting = {};
const forComputer: AcademicTargeting = {
  target_course_name: "B.Tech",
  target_branch_name: "Computer Science Engineering",
  target_year_label: "3rd Year",
};
const forComputerBranchOnly: AcademicTargeting = { target_branch_name: "Computer Science Engineering" };
const forPharmacy: AcademicTargeting = { target_branch_name: "Pharmacy", target_course_name: "B.Pharm" };

describe("academicScore", () => {
  it("ranks an exact course+branch+year match highest", () => {
    expect(academicScore(forComputer, computer)).toBeGreaterThan(academicScore(forComputerBranchOnly, computer));
    expect(academicScore(forComputerBranchOnly, computer)).toBeGreaterThan(academicScore(global, computer));
  });

  it("keeps global content above content aimed at another branch", () => {
    expect(academicScore(global, computer)).toBeGreaterThan(academicScore(forPharmacy, computer));
  });

  it("is data-driven — the same row scores by whichever branch the student has", () => {
    // No branch is special-cased: Pharmacy content wins for a Pharmacy student…
    expect(academicScore(forPharmacy, pharmacy)).toBeGreaterThan(academicScore(global, pharmacy));
    // …and loses for a Computer student, with zero branch names in the code.
    expect(academicScore(forPharmacy, computer)).toBeLessThan(academicScore(global, computer));
  });

  it("treats a row with no targets as global regardless of profile", () => {
    expect(academicScore(global, computer)).toBe(academicScore(global, pharmacy));
  });
});

describe("rankByAcademicRelevance", () => {
  const rows = [
    { id: "g1", ...global },
    { id: "pharm", ...forPharmacy },
    { id: "cs-exact", ...forComputer },
    { id: "cs-branch", ...forComputerBranchOnly },
    { id: "g2", ...global },
  ];

  it("puts the student's branch content first and keeps general content available", () => {
    const ordered = rankByAcademicRelevance(rows, computer).map((r) => r.id);
    expect(ordered[0]).toBe("cs-exact");
    expect(ordered[1]).toBe("cs-branch");
    // other-branch content is not removed, just pushed to the end
    expect(ordered).toContain("pharm");
    expect(ordered.indexOf("pharm")).toBe(ordered.length - 1);
    // globals remain in the list as the fallback
    expect(ordered).toContain("g1");
    expect(ordered).toContain("g2");
  });

  it("is a no-op when the student has no academic data", () => {
    const none: AcademicProfile = { course: null, branch: null, year: null };
    expect(rankByAcademicRelevance(rows, none)).toBe(rows);
  });

  it("preserves the caller's ordering for equally-relevant rows (stable)", () => {
    const ordered = rankByAcademicRelevance(rows, computer).map((r) => r.id);
    expect(ordered.indexOf("g1")).toBeLessThan(ordered.indexOf("g2"));
  });
});

describe("academicScore — target_type model (migration 0035)", () => {
  it("treats target_type 'global' as global even with stray legacy names", () => {
    const row: AcademicTargeting = { target_type: "global", target_branch_name: "Mechanical Engineering" };
    expect(academicScore(row, computer)).toBe(academicScore(global, computer));
  });

  it("ranks a 'course' row up for that course, still above global for its students", () => {
    const courseRow: AcademicTargeting = { target_type: "course", target_course_name: "B.Tech" };
    expect(academicScore(courseRow, computer)).toBeGreaterThan(academicScore(global, computer));
  });

  it("matches a 'branch' row against any label in target_branch_names[]", () => {
    const multi: AcademicTargeting = {
      target_type: "branch",
      target_branch_names: ["Information Technology", "Computer Science Engineering", "AI & Data Science"],
    };
    expect(academicScore(multi, computer)).toBeGreaterThan(academicScore(global, computer));
    // a student whose branch isn't listed scores below global
    const mech: AcademicProfile = { course: "B.Tech", branch: "Mechanical Engineering", year: "3rd Year" };
    expect(academicScore(multi, mech)).toBeLessThan(academicScore(global, mech));
  });

  it("falls back to the legacy scalar target_branch_name when the array is absent", () => {
    const legacy: AcademicTargeting = { target_branch_name: "Computer Science Engineering" };
    expect(academicScore(legacy, computer)).toBeGreaterThan(academicScore(global, computer));
  });
});

describe("helpers", () => {
  it("hasAcademicSignal detects any of course/branch/year", () => {
    expect(hasAcademicSignal({ course: null, branch: null, year: null })).toBe(false);
    expect(hasAcademicSignal({ course: null, branch: "IT", year: null })).toBe(true);
  });

  it("academicKey is case/whitespace-insensitive and stable", () => {
    expect(academicKey({ course: " B.Tech ", branch: "IT", year: null })).toBe(
      academicKey({ course: "b.tech", branch: "it", year: null })
    );
  });

  it("academicFromUser tolerates a null user", () => {
    expect(academicFromUser(null)).toEqual({ course: null, branch: null, year: null });
  });
});
