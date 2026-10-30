import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, cloneElement, createElement, isValidElement, Suspense, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JobsPage from "@/app/jobs/page";
import ProjectsPage from "@/app/projects/page";
import JobsError from "@/app/jobs/error";
import ProjectsError from "@/app/projects/error";
import { JobCard, type JobCardData } from "@/components/JobCard";
import { ProjectCard, type ProjectCardData } from "@/components/ProjectCard";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { JobFilters } from "@/components/marketplace/JobFilters";
import { ProjectFilters } from "@/components/marketplace/ProjectFilters";
import { ErrorState } from "@/components/ui/ErrorState";
import { JOB_PAGE_SIZE, PROJECT_PAGE_SIZE } from "@/lib/marketplace";
import { formatINR } from "@/lib/format";

const api = vi.hoisted(() => ({ jobs: vi.fn(), projects: vi.fn(), categories: vi.fn() }));
vi.mock("@/lib/cache", () => ({ getCachedJobsPage: api.jobs, getCachedProjectsPage: api.projects, getCachedCategories: api.categories }));

const job: JobCardData = {
  id: "role-1", title: "Original developer role", company_name: "Original company", company_logo_url: null,
  location: "Remote · India", job_type: "Full Time", salary_range: "₹6–9 LPA", posted_at: "2001-01-01T00:00:00Z", experience_level: "Fresher",
};
const project: ProjectCardData = {
  id: "project-1", title: "Original educational example", category_name: "Web development", tech_stack: ["React", "TypeScript", "SQL", "CSS"],
  price: 1499, original_price: 1999, rating: 4.5, review_count: 12, thumbnail_url: null, is_premium: true, is_best_seller: true,
};
const categories = [{ id: "web", name: "Web development" }, { id: "long", name: "VeryLongUnbrokenCategoryNameForSmallPhoneLayouts" }];
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");

// Resolve async children at the same boundary used by the existing catalogue UI tests.
async function serverChildren(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(Children.toArray(node).map(serverChildren));
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") {
    return serverChildren(await (node.type as (props: unknown) => Promise<ReactNode>)(node.props));
  }
  return cloneElement(node, {}, await serverChildren(node.props.children));
}
const render = async (node: ReactNode) => renderToStaticMarkup(await serverChildren(node) as ReactElement);
function find(node: ReactNode, type: unknown): ReactElement<Record<string, unknown>> | undefined {
  if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
  if (node.type === type) return node as ReactElement<Record<string, unknown>>;
  for (const child of Children.toArray(node.props.children)) {
    const result = find(child, type);
    if (result) return result;
  }
}

beforeEach(() => {
  api.jobs.mockResolvedValue({ jobs: [job], count: 1 });
  api.projects.mockResolvedValue({ projects: [project], count: 1 });
  api.categories.mockResolvedValue(categories);
});

describe("Jobs listing presentation and preserved contracts", () => {
  it("keeps one labelled query and named icon submit inside the native Jobs search form", async () => {
    const searchParams = { q: "Java & SQL", location: "Remote", type: "Full Time", exp: "experienced", sort: "salary-high", page: "2" };
    const html = await render(await JobsPage({ searchParams }));
    const form = html.match(/<form[^>]+role="search"[\s\S]*?<\/form>/)?.[0] ?? "";
    expect(form).toContain('action="/jobs" method="get"');
    expect(form.match(/type="search"/g)).toHaveLength(1);
    expect(form).toContain('class="sr-only">Search roles</span>');
    expect(form).toContain('type="search" name="q"');
    expect(form).toContain('value="Java &amp; SQL"');
    expect(form).toContain('placeholder="Search roles, e.g. Java developer, analyst…"');
    expect(form.match(/<button\b/g)).toHaveLength(1);
    const submit = form.match(/<button\b[\s\S]*?<\/button>/)?.[0] ?? "";
    expect(submit).toContain('type="submit" aria-label="Search"');
    expect(submit).toMatch(/<svg[^>]+aria-hidden="true"/);
    expect(submit).toContain('class="sr-only sm:not-sr-only">Search</span>');
    for (const name of ["location", "type", "exp", "sort"] as const) {
      expect(form).toContain(`type="hidden" name="${name}" value="${searchParams[name]}"`);
    }
    expect(form).not.toContain('name="page"');
  });

  it.each([undefined, "fresher", "experienced"])("preserves query filters when switching experience from %s", async exp => {
    const searchParams = { q: "Java & SQL", location: "Remote", type: "Full Time", exp, sort: "salary-high", page: "2" };
    const html = await render(await JobsPage({ searchParams }));
    const nav = html.match(/<nav aria-label="Experience level"[\s\S]*?<\/nav>/)?.[0] ?? "";
    const links = [...nav.matchAll(/<a\b([^>]*)>([^<]+)<\/a>/g)];
    expect(links).toHaveLength(3);
    for (const [index, [, attributes, label]] of links.entries()) {
      const value = [undefined, "fresher", "experienced"][index];
      expect(label).toBe(["All", "Fresher", "Experienced"][index]);
      const href = attributes.match(/href="([^"]+)"/)?.[1].replace(/&amp;/g, "&");
      expect(href).toBeDefined();
      const url = new URL(href!, "https://example.test");
      expect(url.pathname).toBe("/jobs");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        q: searchParams.q, location: searchParams.location, type: searchParams.type, sort: searchParams.sort,
        ...(value ? { exp: value } : {}),
      });
      expect(attributes.includes('aria-current="page"')).toBe(exp === value);
    }
  });

  it("retains GET search fields, experience links, company navigation, and query arguments", async () => {
    const searchParams = { q: "developer", location: "Remote", type: "Full Time", exp: "fresher", sort: "salary-high", page: "2" };
    const html = await render(await JobsPage({ searchParams }));
    expect(html).toContain("Jobs &amp; Internships");
    expect(html).toContain('action="/jobs" method="get" role="search"');
    for (const [name, value] of Object.entries(searchParams).filter(([name]) => name !== "page")) {
      expect(html).toContain(`name="${name}"`);
      expect(html).toContain(`value="${value}"`);
    }
    expect(html).toContain('href="/jobs/companies"');
    expect(html).toContain(">All</a>");
    expect(html).toContain("Experienced");
    const active = html.match(/<a[^>]+aria-current="page"[^>]*>Fresher<\/a>/)?.[0] ?? "";
    expect(active).toContain("exp=fresher");
    expect(active).not.toContain("page=");
    expect(api.jobs).toHaveBeenCalledWith({ from: JOB_PAGE_SIZE, size: JOB_PAGE_SIZE, sortColumn: "salary_max_lpa", sortAscending: false, q: "developer", location: "Remote", type: "Full Time", experience: "Fresher" });
    expect(html).toContain('href="/jobs/role-1"');
  });

  it.each([false, true])("distinguishes genuine empty results from filtered results (%s)", async filtered => {
    api.jobs.mockResolvedValue({ jobs: [], count: 0 });
    const html = await render(await JobsPage({ searchParams: filtered ? { q: "no match" } : {} }));
    expect(html).toContain(filtered ? "No roles match these filters" : "No open roles right now");
    expect(html.includes("Clear filters")).toBe(filtered);
    expect(html).not.toContain("Original developer role");
    expect(html).not.toContain("temporarily unavailable");
    expect(html).not.toContain('role="status"');
    expect(html).toContain('href="/jobs/companies"');
    expect(html).toContain('href="/learning"');
    expect(html).toContain("Explore Learning");
    expect(html).not.toContain("Get notified");
  });

  it("propagates data failures instead of presenting a genuine empty state", async () => {
    api.jobs.mockRejectedValue(new Error("catalog unavailable"));
    await expect(render(await JobsPage({ searchParams: {} }))).rejects.toThrow("catalog unavailable");
  });
});

describe("Projects listing presentation and preserved contracts", () => {
  it("keeps an accessible submit action and the query inside the Projects GET search form", async () => {
    const html = await render(await ProjectsPage({ searchParams: { q: "ML & Android" } }));
    const form = html.match(/<form[^>]+role="search"[\s\S]*?<\/form>/)?.[0] ?? "";
    expect(form).toContain('action="/projects" method="get"');
    expect(form).toContain('type="search" name="q"');
    expect(form).toContain('value="ML &amp; Android"');
    expect(form).toContain('class="sr-only">Search projects</span>');
    expect(form.match(/<button/g)).toHaveLength(1);
    expect(form).toMatch(/<button[^>]+type="submit"[^>]+aria-label="Search"/);
    expect(form).toContain('class="sr-only sm:not-sr-only">Search</span>');
  });

  it("keeps every category keyboard reachable and changes only category and page in its links", async () => {
    const searchParams = { q: "ML & Android", category: "web", min: "100", max: "2000", sort: "price-low", flag: "premium", page: "2" };
    const html = await render(await ProjectsPage({ searchParams }));
    const nav = html.match(/<nav aria-label="Categories"[\s\S]*?<\/nav>/)?.[0] ?? "";
    const links = [...nav.matchAll(/<a\b([^>]*)>([^<]+)<\/a>/g)];
    expect(links).toHaveLength(categories.length + 1);
    for (const [index, [, attributes, name]] of links.entries()) {
      const category = index === 0 ? undefined : categories[index - 1];
      const href = attributes.match(/href="([^"]+)"/)?.[1] ?? "";
      const url = new URL(href.replaceAll("&amp;", "&"), "https://example.test");
      expect(url.pathname).toBe("/projects");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        q: searchParams.q, min: "100", max: "2000", sort: "price-low", flag: "premium",
        ...(category ? { category: category.id } : {}),
      });
      expect(name).toBe(category?.name ?? "All");
      expect(attributes).not.toContain("tabindex=");
      expect(attributes.includes('aria-current="page"')).toBe(category?.id === "web");
    }
  });

  it("retains category/filter destinations, pagination offsets, and exact prices", async () => {
    const searchParams = { q: "example", category: "web", min: "100", max: "2000", sort: "price-low", flag: "premium", page: "2" };
    const html = await render(await ProjectsPage({ searchParams }));
    expect(html).toContain('action="/projects" method="get" role="search"');
    for (const [name, value] of Object.entries(searchParams).filter(([name]) => name !== "page")) {
      expect(html).toContain(`name="${name}"`);
      expect(html).toContain(`value="${value}"`);
    }
    const nav = html.match(/<nav aria-label="Categories"[\s\S]*?<\/nav>/)?.[0] ?? "";
    expect(nav).toContain(categories[1].name);
    expect(nav).toContain("category=long");
    expect(nav).not.toContain("page=");
    expect(nav).toContain("aria-current=\"page\"");
    expect(api.projects).toHaveBeenCalledWith({ page: 2, from: PROJECT_PAGE_SIZE, size: PROJECT_PAGE_SIZE, sortColumn: "price", sortAscending: true, q: "example", category: "web", min: 100, max: 2000, flag: "premium" });
    expect(html).toContain('href="/projects/project-1"');
    expect(html).toContain(formatINR(project.price));
    expect(html).toContain(formatINR(project.original_price!));
    expect(html).toContain("Project help");
    expect(html).toContain("Mentoring &amp; software");
    expect(html).toContain("feedback on work they author");
    expect(html).toContain("Ask about mentoring");
    expect(html).toContain('href="/custom-projects/start"');
  });

  it.each([false, true])("distinguishes genuine empty results from filtered results (%s)", async filtered => {
    api.projects.mockResolvedValue({ projects: [], count: 0 });
    const html = await render(await ProjectsPage({ searchParams: filtered ? { q: "no match" } : {} }));
    expect(html).toContain(filtered ? "No projects match these filters" : "No projects listed yet");
    expect(html.includes("Clear filters")).toBe(filtered);
    expect(html).not.toContain(project.title);
    expect(html).not.toContain("temporarily unavailable");
  });

  it("propagates data failures instead of presenting a genuine empty state", async () => {
    api.projects.mockRejectedValue(new Error("catalog unavailable"));
    await expect(render(await ProjectsPage({ searchParams: {} }))).rejects.toThrow("catalog unavailable");
  });
});

describe("listing cards", () => {
  it("keeps real job metadata, destination and existing missing-value fallbacks", () => {
    const html = renderToStaticMarkup(createElement(JobCard, { job }));
    for (const value of [job.title, job.company_name!, job.location!, job.salary_range!, "Fresher", "Full Time"]) expect(html).toContain(value);
    expect(html).not.toContain(">New<");
    const missing = renderToStaticMarkup(createElement(JobCard, { job: { ...job, company_name: null, salary_range: null, posted_at: null, location: null, job_type: null, experience_level: null } }));
    expect(missing).toContain("Salary undisclosed");
    expect(missing).toContain("Company");
    expect(missing).not.toContain("Fresher");
    expect(missing).not.toContain("Full Time");
  });

  it("keeps project prices, review data, rank, badges and the existing tag limit", () => {
    const html = renderToStaticMarkup(createElement(ProjectCard, { project, rank: 2 }));
    expect(html).toContain(project.title);
    expect(html).toContain("No preview available");
    expect(html).toContain("#2");
    expect(html).toContain("Premium");
    expect(html).toContain("Bestseller");
    expect(html).toContain("Rated 4.5 out of 5");
    expect(html).toContain("(12)");
    expect(html).toContain("+1");
    expect(html).not.toContain(">CSS<");
    expect(html).toContain(formatINR(project.price));
    expect(html).toContain(formatINR(project.original_price!));
    expect(html).toContain("25% off");
  });

  it("keeps actual images and free projects without inventing ratings or badges", () => {
    const html = renderToStaticMarkup(createElement(ProjectCard, { project: { ...project, thumbnail_url: "/project-preview.png", price: 0, review_count: 0, is_premium: false, is_best_seller: false } }));
    expect(html).toContain("project-preview.png");
    expect(html).toContain("Free");
    expect(html).not.toContain("No preview available");
    expect(html).not.toContain("Rated");
    expect(html).not.toContain("Premium");
    expect(html).not.toContain("Bestseller");
    expect(html).not.toContain("% off");
  });
});

describe("loading, error and filter accessibility", () => {
  it("gives each price bound an explicit accessible name while preserving GET values", () => {
    const html = renderToStaticMarkup(createElement(ProjectFilters, { categories, state: { min: "100", max: "2000" } }));
    const inputs = [...html.matchAll(/<input\b[^>]*type="number"[^>]*>/g)].map(match => match[0]);
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toContain('aria-label="Minimum price in rupees"');
    expect(inputs[1]).toContain('aria-label="Maximum price in rupees"');
    expect(inputs[0]).toContain('name="min"');
    expect(inputs[0]).toContain('value="100"');
    expect(inputs[1]).toContain('name="max"');
    expect(inputs[1]).toContain('value="2000"');
  });

  it.each([["jobs", JobsPage], ["projects", ProjectsPage]] as const)("labels the %s loading fallback", async (name, Page) => {
    const shell = await Page({ searchParams: {} });
    const fallback = find(shell, Suspense)?.props.fallback as ReactElement;
    const html = renderToStaticMarkup(fallback);
    expect(html).toContain('role="status"');
    expect(html).toContain(`aria-label="Loading ${name}"`);
    expect(html).not.toContain("No roles");
    expect(html).not.toContain("No projects");
  });

  it.each([["Jobs", JobsError], ["Projects", ProjectsError]] as const)("announces %s errors and preserves retry", (name, ErrorPage) => {
    const reset = vi.fn();
    const node = ErrorPage({ error: new Error("private diagnostics"), reset });
    const html = renderToStaticMarkup(node);
    expect(html).toContain('role="alert"');
    expect(html).toContain(`${name} are temporarily unavailable.`);
    expect(html).not.toContain("private diagnostics");
    expect(plain(html)).toContain("Retry");
    (find(node, ErrorState)!.props.onRetry as () => void)();
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("labels the filter dialog trigger and preserves all Jobs/Projects form values", () => {
    const state = { q: "example", category: "web", min: "100", max: "2000", flag: "premium", sort: "price-low" };
    const html = renderToStaticMarkup(createElement(FilterSheet, { activeCount: 3, children: createElement(ProjectFilters, { categories, state }) }));
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("3 active");
    for (const [key, value] of Object.entries(state)) {
      expect(html).toContain(`name="${key}"`);
      expect(html).toContain(`value="${value}"`);
    }
    expect(html).toMatch(/<input[^>]*checked=""[^>]*value="premium"/);
    const jobs = renderToStaticMarkup(createElement(FilterSheet, { children: createElement(JobFilters, { state: { q: "developer", exp: "fresher", location: "Remote", type: "Full Time", sort: "salary-high" } }) }));
    expect(jobs).toContain('value="fresher" selected=""');
    expect(jobs).toContain('value="Full Time" selected=""');
    expect(jobs).toContain('value="Remote"');
    expect(jobs).toContain('href="/jobs"');
    expect(jobs).not.toContain(" active filters");
  });
});
