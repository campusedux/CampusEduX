import { buildCategoryRows, formatCount, formatJobCount, FIXED_CATEGORIES, heroStatPills, companyInitials } from "@/jobs/jobCategories";

describe("formatJobCount", () => {
  it("handles singular/plural and k format", () => {
    expect(formatJobCount(1)).toBe("1 Job");
    expect(formatJobCount(12)).toBe("12 Jobs");
    expect(formatJobCount(1200)).toBe("1.2k Jobs");
    expect(formatCount(1000)).toBe("1k");
    expect(formatCount(999)).toBe("999");
  });
});

describe("buildCategoryRows", () => {
  it("always lists the 8 fixed categories, no Other when empty", () => {
    const rows = buildCategoryRows([]);
    expect(rows.map((r) => r.category)).toEqual([...FIXED_CATEGORIES]);
    expect(rows.every((r) => r.jobCount === 0)).toBe(true);
  });

  it("sorts categories with jobs first by count, zero-count after in fixed order", () => {
    const rows = buildCategoryRows([
      { category: "Sales", jobCount: 2 },
      { category: "Core Engineering", jobCount: 5 },
    ]);
    expect(rows.slice(0, 2).map((r) => r.category)).toEqual(["Core Engineering", "Sales"]);
    expect(rows.slice(2).map((r) => r.category)).toEqual(["IT & Software", "Data/AI", "Design", "Marketing", "Finance", "HR"]);
  });

  it("shows Other only with jobs and folds unknown categories into it", () => {
    const rows = buildCategoryRows([{ category: "Production Engineering", jobCount: 1 }]);
    expect(rows[0]).toEqual({ category: "Other", jobCount: 1 });
    expect(rows).toHaveLength(9);
  });
});

describe("heroStatPills", () => {
  it("hides pills below 10 active jobs", () => {
    expect(heroStatPills({ activeJobs: 9, companyCount: 3, fresherJobs: 2 })).toEqual([]);
    expect(heroStatPills(undefined)).toEqual([]);
  });
  it("shows real stats at >= 10", () => {
    expect(heroStatPills({ activeJobs: 1200, companyCount: 1, fresherJobs: 40 })).toEqual(["1.2k Active Jobs", "1 Company", "40 Fresher Jobs"]);
  });
});

describe("companyInitials", () => {
  it("builds initials", () => {
    expect(companyInitials("Flex (Flextronics)")).toBe("FF");
    expect(companyInitials("Infosys")).toBe("IN");
    expect(companyInitials("")).toBe("?");
  });
});
