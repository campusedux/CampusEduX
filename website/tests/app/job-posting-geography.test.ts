import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@/lib/cache", () => ({
  getCachedJobDetail: vi.fn(),
  getCachedRecentJobIds: vi.fn(async () => []),
}));
vi.mock("@/app/jobs/[id]/JobApplyPanel", () => ({ default: () => null }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));

import JobDetailPage, { generateMetadata, revalidate } from "@/app/jobs/[id]/page";
import { getCachedJobDetail } from "@/lib/cache";

// Synthetic source fixtures only; no production/staging data or network reads.
const physical = {
  id: "seo01-fixture", title: "Backend Engineer", status: "open", work_mode: "On-site",
  location: "Toronto, Canada", description: "Build and maintain APIs.\nCollaborate with the team.",
  company_name: "Example Employer", company_logo_url: null,
  company: { id: "example", name: "Example Employer", website: "https://employer.example", logo_url: "https://employer.example/logo.png" },
  posted_at: "2026-10-01T00:00:00Z", application_deadline: "2026-12-01T00:00:00Z",
  job_type: "Full Time", salary_min_lpa: 6, salary_max_lpa: 12, salary_range: "Employer supplied salary",
  apply_url: "https://employer.example/apply", requirements: [], responsibilities: [], skills: [],
};
const remoteDescription = "Build APIs.\nThis job is 100% remote.\nApplicants must be located in Canada.";
const props = () => ({ params: Promise.resolve({ id: physical.id }) });

async function output(overrides: Record<string, unknown> = {}) {
  vi.mocked(getCachedJobDetail).mockResolvedValue({ ...physical, ...overrides });
  const html = renderToStaticMarkup(await JobDetailPage(props()));
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => match[1]);
  const blocks = scripts.map(script => JSON.parse(script));
  return { html, scripts, blocks, job: blocks.find(block => block["@type"] === "JobPosting") };
}

// Local assertions against Google's documented required properties/geography.
// These do not run Google's validator or establish description completeness,
// crawlability, job authenticity, live eligibility or rich-result appearance.
function expectGoogleShape(job: Record<string, any>) {
  expect(job).toMatchObject({ "@context": "https://schema.org", "@type": "JobPosting" });
  for (const key of ["title", "description", "datePosted"]) expect(job[key]).toEqual(expect.any(String));
  expect(Number.isFinite(Date.parse(job.datePosted))).toBe(true);
  expect(job.hiringOrganization).toMatchObject({ "@type": "Organization", name: expect.any(String) });
  if (job.jobLocationType === "TELECOMMUTE") {
    const eligible = [job.applicantLocationRequirements].flat();
    expect(eligible.length).toBeGreaterThan(0);
    for (const country of eligible) expect(country).toMatchObject({ "@type": "Country", name: expect.any(String) });
  } else {
    const places = [job.jobLocation].flat();
    expect(places.length).toBeGreaterThan(0);
    for (const place of places) expect(place).toMatchObject({
      "@type": "Place", address: { "@type": "PostalAddress", addressCountry: expect.stringMatching(/^[A-Z]{2}$/) },
    });
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("SEO-01 physical and hybrid geography", () => {
  it.each([
    ["Toronto, Canada", "CA"], ["Pune, India", "IN"], ["Paris, France", "FR"],
    ["Berlin, Germany", "DE"], ["Austin, Texas, United States", "US"],
    ["  Toronto, canada  ", "CA"],
  ])("uses only the explicit country in %s", async (location, code) => {
    const { job } = await output({ location });
    expectGoogleShape(job);
    expect(job.jobLocation).toEqual({
      "@type": "Place", name: location.trim(), address: { "@type": "PostalAddress", addressCountry: code },
    });
    // Comma positions do not prove which component is a city/region/street.
    expect(job.jobLocation.address).not.toHaveProperty("addressLocality");
    expect(job.jobLocation.address).not.toHaveProperty("addressRegion");
    expect(job.jobLocation.address).not.toHaveProperty("streetAddress");
    expect(job).not.toHaveProperty("jobLocationType");
    expect(job).not.toHaveProperty("applicantLocationRequirements");
  });

  it("emits all independently supported worksites as an array", async () => {
    const { job } = await output({ location: "Toronto, Canada; Berlin, Germany" });
    expectGoogleShape(job);
    expect(job.jobLocation).toEqual([
      { "@type": "Place", name: "Toronto, Canada", address: { "@type": "PostalAddress", addressCountry: "CA" } },
      { "@type": "Place", name: "Berlin, Germany", address: { "@type": "PostalAddress", addressCountry: "DE" } },
    ]);
  });

  it("keeps hybrid physical and never advertises full remote eligibility", async () => {
    const { job, html } = await output({ work_mode: "Hybrid", description: "Work from the Toronto office three days each week." });
    expectGoogleShape(job);
    expect(job.jobLocation.address.addressCountry).toBe("CA");
    expect(job).not.toHaveProperty("jobLocationType");
    expect(job).not.toHaveProperty("applicantLocationRequirements");
    expect(html).toContain("Work from the Toronto office three days each week.");
  });

  it.each([
    ["unknown country", "Toronto, Atlantis"], ["city only", "Bengaluru"],
    ["ambiguous country abbreviation", "Toronto, CA"], ["ambiguous state/country", "Atlanta, Georgia"],
    ["slash-separated cities", "Toronto / Ottawa, Canada"], ["alternative countries", "Canada or United States"],
    ["missing location", null], ["empty location", ""], ["country only", "India"],
    ["incomplete location", ", Canada"], ["incomplete country", "Toronto,"],
    ["unknown place", "Unknown, Canada"], ["remote pseudo-place", "Remote, Canada"],
    ["country used as city", "Canada, United States"], ["mixed supported/unknown worksites", "Toronto, Canada; Bengaluru"],
    ["empty array member", "Toronto, Canada;"], ["unstructured prose", "Anywhere in Canada"],
  ])("withholds JobPosting for %s", async (_label, location) => {
    const { job, blocks, html } = await output({ location });
    expect(job).toBeUndefined();
    expect(blocks.map(block => block["@type"])).toEqual(["BreadcrumbList"]);
    expect(html).toContain(physical.title);
    expect(html).toContain('href="https://employer.example/apply"');
    expect(html).not.toContain('"addressCountry":"IN"');
  });

  it.each([null, undefined, "", "Flexible"])("withholds unknown work mode %s", async work_mode => {
    expect((await output({ work_mode })).job).toBeUndefined();
  });

  it("withholds hybrid geography when the worksite country is unknown", async () => {
    expect((await output({ work_mode: "Hybrid", location: "Toronto" })).job).toBeUndefined();
  });

  it("does not derive geography from salary currency, employer URL or unsupported row fields", async () => {
    expect((await output({ location: "Bengaluru", country: "India", addressCountry: "IN" })).job).toBeUndefined();
  });
});

describe("SEO-01 fully remote geography", () => {
  it.each(["Canada", "Remote", null])("uses explicit visible eligibility, with location %s", async location => {
    const { job, html } = await output({ work_mode: "Remote", location, description: remoteDescription });
    expectGoogleShape(job);
    expect(job.jobLocationType).toBe("TELECOMMUTE");
    expect(job.applicantLocationRequirements).toEqual({ "@type": "Country", name: "Canada" });
    expect(job).not.toHaveProperty("jobLocation");
    expect(html).toContain("Applicants must be located in Canada.");
  });

  it("preserves multiple explicitly eligible countries", async () => {
    const { job } = await output({ work_mode: "Remote", location: "Canada; Germany",
      description: "Build APIs.\nThis role is fully remote.\nApplicants must be located in Canada; Germany." });
    expectGoogleShape(job);
    expect(job.applicantLocationRequirements).toEqual([{ "@type": "Country", name: "Canada" }, { "@type": "Country", name: "Germany" }]);
  });

  it.each([
    ["no eligibility", "Remote", "This job is 100% remote."],
    ["no full remote statement", "Canada", "Applicants must be located in Canada."],
    ["unknown country", "Remote", "This job is 100% remote.\nApplicants must be located in Atlantis."],
    ["narrower city restriction", "Remote", "This job is 100% remote.\nApplicants must be located in Toronto, Canada."],
    ["narrower state restriction", "Remote", "This job is 100% remote.\nApplicants must be located in California, United States."],
    ["conflicting country", "India", remoteDescription],
    ["office country is not eligibility", "Toronto, Canada", "This job is 100% remote."],
    ["multiple eligibility declarations", "Remote", remoteDescription + "\nApplicants must be located in India."],
    ["hybrid requirement", "Remote", remoteDescription + "\nHybrid attendance is required."],
    ["negated full remote", "Canada", "This job is not fully remote.\nApplicants must be located in Canada."],
    ["unverified worldwide eligibility", "Worldwide", "This job is 100% remote.\nApplicants must be located in Worldwide."],
  ])("withholds unsupported remote claims: %s", async (_label, location, description) => {
    expect((await output({ work_mode: "Remote", location, description })).job).toBeUndefined();
  });
});

describe("SEO-01 preserved job detail contracts", () => {
  it("retains valid existing properties without inventing optional data", async () => {
    const { job } = await output();
    expectGoogleShape(job);
    expect(job).toMatchObject({
      title: physical.title, description: physical.description, datePosted: physical.posted_at,
      validThrough: physical.application_deadline, employmentType: "FULL_TIME",
      identifier: { "@type": "PropertyValue", name: physical.company_name, value: physical.id },
      hiringOrganization: { "@type": "Organization", name: physical.company_name, logo: physical.company.logo_url, sameAs: physical.company.website },
      baseSalary: { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", minValue: 600000, maxValue: 1200000, unitText: "YEAR" } },
    });
    const { job: minimal } = await output({ job_type: "Unknown", salary_min_lpa: null, salary_max_lpa: null,
      company: null, application_deadline: null });
    for (const key of ["employmentType", "baseSalary", "validThrough"]) expect(minimal).not.toHaveProperty(key);
    expect(minimal.hiringOrganization).toEqual({ "@type": "Organization", name: physical.company_name });
  });

  it.each([
    { company_name: "", company: null }, { company_name: "   " }, { description: "" },
    { title: "" }, { posted_at: null }, { posted_at: "invalid" },
  ])("withholds legitimately unavailable required facts: %j", async overrides => {
    expect((await output(overrides)).job).toBeUndefined();
  });

  it("escapes JSON-LD script boundaries and round-trips source content", async () => {
    const hostile = "</script><script>alert('fixture')</script> & x\u2028y\u2029z";
    const { job, html, scripts } = await output({ title: hostile, company_name: hostile, description: hostile });
    expect(job.title).toBe(hostile);
    expect(job.description).toBe(hostile);
    expect(job.hiringOrganization.name).toBe(hostile);
    expect(html).not.toContain(hostile);
    expect(scripts).toHaveLength(2);
    for (const script of scripts) expect(script).not.toMatch(/[<>&\u2028\u2029]/);
    expect(scripts[0]).toContain("\\u003c/script\\u003e");
  });

  it.each([physical.location, "Bengaluru", null])("preserves metadata and canonical when location is %s", async location => {
    vi.mocked(getCachedJobDetail).mockResolvedValue({ ...physical, location });
    const metadata = await generateMetadata(props());
    expect(metadata.title).toEqual({ absolute: "Backend Engineer at Example Employer | CampusEduX" });
    expect(metadata.alternates?.canonical).toBe("https://www.campusedux.com/jobs/seo01-fixture");
    expect(metadata.openGraph).toMatchObject({ url: "https://www.campusedux.com/jobs/seo01-fixture", type: "website", siteName: "CampusEduX" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Backend Engineer at Example Employer | CampusEduX" });
    expect(metadata.description).toContain(physical.title);
    expect(metadata.robots).toBeUndefined();
    expect(revalidate).toBe(300);
    const { html } = await output({ location });
    expect(html).toContain(physical.description);
    expect(html).toContain('href="https://employer.example/apply"');
    expect(html).toContain('href="/jobs/companies/example"');
  });

  it.each([
    { status: "closed" }, { application_deadline: "2026-01-01T00:00:00Z" },
  ])("keeps closed/expired pages noindex and without JobPosting", async overrides => {
    const { job, html } = await output(overrides);
    expect(job).toBeUndefined();
    expect(html).toContain("This job is no longer accepting applications");
    expect((await generateMetadata(props())).robots).toEqual({ index: false, follow: true });
  });

  it("preserves missing and draft behavior", async () => {
    vi.mocked(getCachedJobDetail).mockResolvedValue(null);
    await expect(JobDetailPage(props())).rejects.toThrow("NEXT_NOT_FOUND");
    expect(await generateMetadata(props())).toEqual({ title: "Job not found", robots: { index: false, follow: false } });
    vi.mocked(getCachedJobDetail).mockResolvedValue({ ...physical, status: "draft" });
    await expect(JobDetailPage(props())).rejects.toThrow("NEXT_NOT_FOUND");
    expect((await generateMetadata(props())).robots).toEqual({ index: false, follow: true });
  });
});
