import { describe, it, expect, vi } from "vitest";
import JsonLd from "@/components/JsonLd";

// `react`'s `cache()` (used by lib/cache.ts + lib/learning.ts to memoize
// per-request fetches) is only available on the canary build Next.js aliases
// "react" to at build time; under plain Vitest the published 18.3.1 package
// doesn't export it. Same shim as tests/app/seo-metadata-fixes.test.ts.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

vi.mock("@/lib/cache", () => ({
  getCachedCategoryPreview: vi.fn(),
  getCachedCategoryIds: vi.fn(async () => []),
  getCachedJobDetail: vi.fn(),
  getCachedRecentJobIds: vi.fn(async () => []),
}));

vi.mock("@/lib/learning", () => ({
  getLearningTree: vi.fn(),
  getLearningGridBrief: vi.fn(),
  getLearningGridSlugs: vi.fn(async () => []),
  getGridScopedTests: vi.fn(async () => ({ courseTest: null, chapterTestBySectionId: {} })),
  getLearningGrids: vi.fn(async () => []),
  searchLearning: vi.fn(async () => []),
}));

import { getCachedCategoryPreview, getCachedJobDetail } from "@/lib/cache";
import { getLearningTree, getLearningGridBrief, getLearningGrids } from "@/lib/learning";

type Node = { type: unknown; props: { children?: unknown } };
type LdElement = { type: unknown; props: { data: Record<string, unknown> } };

function jsonLdBlocks(node: Node): Record<string, unknown>[] {
  const children = node.props.children;
  const list = Array.isArray(children) ? children : [children];
  return list
    .filter((c): c is LdElement => Boolean(c) && typeof c === "object" && (c as LdElement).type === JsonLd)
    .map((c) => c.props.data);
}

describe("/projects/category/[category] BreadcrumbList", () => {
  it("adds Projects -> <category name> with the real canonical URL", async () => {
    vi.mocked(getCachedCategoryPreview).mockResolvedValueOnce({ name: "Web & Mobile", projects: [] });

    const { default: CategoryPage } = await import("@/app/projects/category/[category]/page");
    const element = (await CategoryPage({ params: { category: "web-mobile" } })) as unknown as Node;
    const blocks = jsonLdBlocks(element);
    const crumb = blocks.find((d) => d["@type"] === "BreadcrumbList") as
      | { itemListElement: { position: number; name: string; item: string }[] }
      | undefined;
    expect(crumb).toBeDefined();
    expect(crumb!.itemListElement).toHaveLength(2);
    expect(crumb!.itemListElement[0]).toMatchObject({ position: 1, name: "Projects", item: "https://www.campusedux.com/projects" });
    expect(crumb!.itemListElement[1]).toMatchObject({
      position: 2,
      name: "Web & Mobile",
      item: "https://www.campusedux.com/projects/category/web-mobile",
    });
  });
});

describe("/jobs/[id] JobPosting safe enhancements", () => {
  it("adds identifier from the real job id, and logo/sameAs when the company row has them", async () => {
    vi.mocked(getCachedJobDetail).mockResolvedValueOnce({
      id: "job-42",
      title: "Backend Intern",
      description: "Build APIs.",
      posted_at: "2026-01-01T00:00:00.000Z",
      job_type: "Internship",
      location: "Bengaluru",
      salary_min_lpa: null,
      salary_max_lpa: null,
      company_name: "Acme Corp",
      company_logo_url: null,
      company: { id: "c1", name: "Acme Corp", logo_url: "https://cdn.example/acme.png", about: "", website: "https://acme.example" },
    });

    const { default: JobDetailPage } = await import("@/app/jobs/[id]/page");
    const element = (await JobDetailPage({ params: { id: "job-42" } })) as unknown as Node;
    const blocks = jsonLdBlocks(element);
    const job = blocks.find((d) => d["@type"] === "JobPosting") as Record<string, unknown>;
    expect(job).toBeDefined();

    expect(job.identifier).toEqual({ "@type": "PropertyValue", name: "Acme Corp", value: "job-42" });
    expect(job.hiringOrganization).toEqual({
      "@type": "Organization",
      name: "Acme Corp",
      logo: "https://cdn.example/acme.png",
      sameAs: "https://acme.example",
    });

    // Never fabricated — no real DB fields exist for these.
    expect(job).not.toHaveProperty("validThrough");
    expect((job.jobLocation as Record<string, unknown> | undefined)?.addressCountry).toBeUndefined();
    expect(job).not.toHaveProperty("jobLocationType");
    expect(job).not.toHaveProperty("applicantLocationRequirements");
  });

  it.each([
    ["Full Time", "FULL_TIME"],
    ["Part Time", "PART_TIME"],
    ["Internship", "INTERN"],
    ["Contract", "CONTRACTOR"],
  ])("maps job_type %s to the valid Google enum %s", async (jobType, expected) => {
    vi.mocked(getCachedJobDetail).mockResolvedValueOnce({
      id: "job-1",
      title: "Engineer",
      description: "Do engineering.",
      posted_at: "2026-01-01T00:00:00.000Z",
      job_type: jobType,
      location: "Bengaluru",
      salary_min_lpa: null,
      salary_max_lpa: null,
      company_name: "Acme Corp",
      company_logo_url: null,
      company: { id: "c1", name: "Acme Corp", logo_url: null, about: "", website: null },
    });

    const { default: JobDetailPage } = await import("@/app/jobs/[id]/page");
    const element = (await JobDetailPage({ params: { id: "job-1" } })) as unknown as Node;
    const blocks = jsonLdBlocks(element);
    const job = blocks.find((d) => d["@type"] === "JobPosting") as Record<string, unknown>;

    expect(job.employmentType).toBe(expected);
  });

  it("omits employmentType for a job_type outside the known 4 DB values, instead of guessing", async () => {
    vi.mocked(getCachedJobDetail).mockResolvedValueOnce({
      id: "job-2",
      title: "Engineer",
      description: "Do engineering.",
      posted_at: "2026-01-01T00:00:00.000Z",
      job_type: "Freelance",
      location: "Bengaluru",
      salary_min_lpa: null,
      salary_max_lpa: null,
      company_name: "Acme Corp",
      company_logo_url: null,
      company: { id: "c1", name: "Acme Corp", logo_url: null, about: "", website: null },
    });

    const { default: JobDetailPage } = await import("@/app/jobs/[id]/page");
    const element = (await JobDetailPage({ params: { id: "job-2" } })) as unknown as Node;
    const blocks = jsonLdBlocks(element);
    const job = blocks.find((d) => d["@type"] === "JobPosting") as Record<string, unknown>;

    // `JSON.stringify` (inside <JsonLd>) drops undefined-valued keys entirely
    // from the rendered script tag, so this never emits a fabricated enum.
    expect(job.employmentType).toBeUndefined();
  });

  it("omits logo/sameAs when the company row has neither", async () => {
    vi.mocked(getCachedJobDetail).mockResolvedValueOnce({
      id: "job-99",
      title: "Frontend Intern",
      description: "Build UIs.",
      posted_at: "2026-01-01T00:00:00.000Z",
      job_type: "Internship",
      location: "Remote",
      salary_min_lpa: null,
      salary_max_lpa: null,
      company_name: "Small Co",
      company_logo_url: null,
      company: { id: "c2", name: "Small Co", logo_url: null, about: "", website: null },
    });

    const { default: JobDetailPage } = await import("@/app/jobs/[id]/page");
    const element = (await JobDetailPage({ params: { id: "job-99" } })) as unknown as Node;
    const blocks = jsonLdBlocks(element);
    const job = blocks.find((d) => d["@type"] === "JobPosting") as Record<string, unknown>;

    expect(job.identifier).toEqual({ "@type": "PropertyValue", name: "Small Co", value: "job-99" });
    expect(job.hiringOrganization).toEqual({ "@type": "Organization", name: "Small Co" });
    expect(job.hiringOrganization).not.toHaveProperty("logo");
    expect(job.hiringOrganization).not.toHaveProperty("sameAs");
  });
});

describe("/learning/[gridSlug] emits Course, not LearningResource", () => {
  it("emits a Course block with real name/description/provider/url and no LearningResource", async () => {
    vi.mocked(getLearningTree).mockResolvedValueOnce({
      grid: {
        id: "g1",
        name: "Java Tutorials",
        slug: "java-tutorial",
        description: "Learn Java.",
        icon: null,
        icon_url: null,
        cover_image_url: null,
        accent_color: null,
      },
      sections: [],
    } as never);
    vi.mocked(getLearningGridBrief).mockResolvedValueOnce({
      id: "g1",
      name: "Java Tutorials",
      slug: "java-tutorial",
      description: "Learn Java.",
      grid_type: "content",
      is_premium: false,
      icon: null,
      cover_image_url: null,
      accent_color: null,
    } as never);

    const { default: GridOverviewPage } = await import("@/app/learning/[gridSlug]/page");
    const element = (await GridOverviewPage({ params: { gridSlug: "java-tutorial" } })) as unknown as Node;
    const blocks = jsonLdBlocks(element);

    const course = blocks.find((d) => d["@type"] === "Course");
    expect(course).toBeDefined();
    expect(course).toMatchObject({
      "@type": "Course",
      name: "Java Tutorials",
      description: "Learn Java.",
      provider: { "@type": "Organization", name: "CampusEduX" },
      url: "https://www.campusedux.com/learning/java-tutorial",
    });
    expect(course).not.toHaveProperty("hasPart");
    expect(course).not.toHaveProperty("instructor");
    expect(course).not.toHaveProperty("hasCourseInstance");

    expect(blocks.some((d) => d["@type"] === "LearningResource")).toBe(false);
  });
});

describe("/learning ItemList of real Course entries", () => {
  const FIXTURE_GRIDS = [
    { id: "g1", name: "Java Tutorials", slug: "java-tutorial", description: "Learn Java.", icon: null, icon_url: null, cover_image_url: null, accent_color: null, is_featured: false, sort_order: 1, section_count: 3, topic_count: 10, grid_type: "content", is_premium: false },
    { id: "g2", name: "Python Tutorial", slug: "python-tutorial", description: "Learn Python.", icon: null, icon_url: null, cover_image_url: null, accent_color: null, is_featured: false, sort_order: 2, section_count: 3, topic_count: 10, grid_type: "content", is_premium: false },
    { id: "g3", name: "DBMS & SQL Tutorial", slug: "dbms-sql-tutorial", description: "Learn SQL.", icon: null, icon_url: null, cover_image_url: null, accent_color: null, is_featured: false, sort_order: 3, section_count: 3, topic_count: 10, grid_type: "content", is_premium: false },
  ];

  it("lists the real published grids as Course ListItems, at least 3 when the dataset has >=3", async () => {
    vi.mocked(getLearningGrids).mockResolvedValueOnce(FIXTURE_GRIDS);

    const { default: LearningIndexPage } = await import("@/app/learning/page");
    const element = (await LearningIndexPage({ searchParams: {} })) as unknown as Node;
    const blocks = jsonLdBlocks(element);

    const itemList = blocks.find((d) => d["@type"] === "ItemList") as
      | {
          itemListElement: {
            "@type": string;
            position: number;
            url: string;
            item: { "@type": string; name: string; description?: string; provider: { name: string } };
          }[];
        }
      | undefined;
    expect(itemList).toBeDefined();
    expect(itemList!.itemListElement).toHaveLength(3);

    itemList!.itemListElement.forEach((entry, i) => {
      expect(entry.position).toBe(i + 1);
      expect(entry.url).toBe(`https://www.campusedux.com/learning/${FIXTURE_GRIDS[i].slug}`);
      expect(entry.item["@type"]).toBe("Course");
      expect(entry.item.name).toBe(FIXTURE_GRIDS[i].name);
      expect(entry.item.description).toBe(FIXTURE_GRIDS[i].description);
      expect(entry.item.provider.name).toBe("CampusEduX");
      // Grid-level only — no topic entries.
      expect(entry.item).not.toHaveProperty("hasPart");
    });
  });
});

describe("root layout WebSite JSON-LD", () => {
  it("adds a WebSite entity alongside the existing Organization, no SearchAction", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const html = RootLayout({ children: null }) as unknown as Node;
    const body = (html.props.children as Node[]).find((c) => c.type === "body")!;
    const blocks = jsonLdBlocks(body);

    const website = blocks.find((d) => d["@type"] === "WebSite") as Record<string, unknown> | undefined;
    const org = blocks.find((d) => d["@type"] === "Organization") as Record<string, unknown> | undefined;

    expect(website).toBeDefined();
    expect(website!.name).toBe("CampusEduX");
    expect(website!.url).toBe("https://www.campusedux.com");
    expect(website).not.toHaveProperty("potentialAction");

    // Organization is untouched, still present.
    expect(org).toBeDefined();
    expect(org!.name).toBe("CampusEduX");
  });
});
