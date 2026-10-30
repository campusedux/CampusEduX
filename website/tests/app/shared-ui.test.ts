import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchBar } from "@/components/ui/SearchBar";
import { GlobalSearchField, GlobalSearchTrigger } from "@/components/search/GlobalSearch";
import { Header } from "@/components/nav/Header";
import { BottomNav } from "@/components/nav/BottomNav";
import { BOTTOM_TABS, HEADER_LINKS } from "@/components/nav/navConfig";
import { ReadingProgress } from "@/app/learning/_components/ReadingProgress";

const navigation = vi.hoisted(() => ({ pathname: "/", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push }),
}));
beforeEach(() => { navigation.pathname = "/"; });

describe("shared search presentation preserves form contracts", () => {
  it("keeps the GET destination, input name, initial value, and carried filters", () => {
    const html = renderToStaticMarkup(createElement(SearchBar, {
      action: "/search", name: "q", defaultValue: "java & sql", placeholder: "Search courses, projects, jobs…",
      hiddenParams: { type: "learning", sort: "newest", empty: "", missing: undefined },
    }));
    expect(html).toContain('action="/search" method="get" role="search"');
    expect(html).toContain('type="search" name="q"');
    expect(html).toContain('value="java &amp; sql"');
    expect(html).toContain('type="hidden" name="type" value="learning"');
    expect(html).toContain('type="hidden" name="sort" value="newest"');
    expect(html).not.toContain('name="empty"');
    expect(html).not.toContain('name="missing"');
    expect(html).toContain('aria-label="Search courses, projects, jobs…"');
    expect(html).toContain('type="submit" aria-label="Search"');
  });

  it("preserves caller-selected destinations and parameter names", () => {
    const html = renderToStaticMarkup(createElement(SearchBar, { action: "/learning", name: "query", defaultValue: "loops" }));
    expect(html).toContain('action="/learning"');
    expect(html).toContain('type="search" name="query"');
    expect(html).toContain('value="loops"');
  });

  it.each(["header", "page"] as const)("keeps the %s global search combobox and GET fallback", variant => {
    const html = renderToStaticMarkup(createElement(GlobalSearchField, { variant, defaultValue: "java" }));
    expect(html).toContain('action="/search" method="get"');
    expect(html).toContain('name="q"');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-label="Search CampusEduX…"');
    expect(html).toContain('aria-autocomplete="list"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('value="java"');
    expect(html.includes('type="submit"')).toBe(variant === "page");
  });

  it("preserves optional submit visibility and the mobile dialog trigger", () => {
    const hidden = renderToStaticMarkup(createElement(GlobalSearchField, { variant: "page", showSubmit: false }));
    expect(hidden).not.toContain('type="submit"');
    const shown = renderToStaticMarkup(createElement(GlobalSearchField, { variant: "header", showSubmit: true }));
    expect(shown).toContain('type="submit" aria-label="Search"');
    const trigger = renderToStaticMarkup(createElement(GlobalSearchTrigger));
    expect(trigger).toContain('aria-label="Search CampusEduX"');
    expect(trigger).toContain('aria-haspopup="dialog"');
    expect(trigger).toContain('aria-expanded="false"');
  });
});

describe("shared navigation presentation preserves destinations", () => {
  it("keeps the original logo assets, home link, and desktop destinations", () => {
    const html = renderToStaticMarkup(createElement(Header));
    expect(html).toContain('href="/"');
    expect(html).toContain('aria-label="CampusEduX home"');
    expect(html).toContain("logo-wordmark-horizontal");
    expect(html).toContain("logo-mark");
    for (const item of HEADER_LINKS) expect(html).toContain(`href="${item.href}"`);
  });

  it("keeps all five bottom destinations in the same order", () => {
    const html = renderToStaticMarkup(createElement(BottomNav));
    expect([...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1])).toEqual(BOTTOM_TABS.map(tab => tab.href));
    for (const tab of BOTTOM_TABS) expect(html).toContain(tab.label);
  });

  it.each(["/", "/learning/java/loops", "/account/profile"])("preserves the active tab on %s", pathname => {
    navigation.pathname = pathname;
    const html = renderToStaticMarkup(createElement(BottomNav));
    const active = [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>/g)].map(match => match[0]);
    expect(active).toHaveLength(1);
    expect(active[0]).toContain(`href="${pathname === "/" ? "/" : pathname.startsWith("/learning") ? "/learning" : "/account"}"`);
  });

  it.each(["/login", "/register", "/logout", "/custom-projects/start", "/custom-projects/features", "/custom-projects/estimate", "/custom-projects/checkout", "/custom-projects/checkout/example"])("keeps the bottom bar hidden on %s", pathname => {
    navigation.pathname = pathname;
    expect(renderToStaticMarkup(createElement(BottomNav))).toBe("");
  });

  it("keeps reading progress decorative without inventing persisted completion", () => {
    const html = renderToStaticMarkup(createElement(ReadingProgress, { targetId: "lesson-article" }));
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="progressbar"');
    expect(html).not.toContain("Completed");
  });
});
