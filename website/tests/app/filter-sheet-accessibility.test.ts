import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { Drawer } from "@/components/ui/Drawer";
import { JobFilters } from "@/components/marketplace/JobFilters";
import { ProjectFilters } from "@/components/marketplace/ProjectFilters";
import { PracticeFilters } from "@/app/practice/problems/PracticeFilters";

const state = vi.hoisted(() => ({ open: false, scope: "drawer-one" }));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useId: () => state.scope, useState: () => [state.open, (open: boolean) => { state.open = open; }] };
});

type Props = { children?: ReactNode; [key: string]: unknown };
function find(node: ReactNode, type: unknown): ReactElement<Props> | undefined {
  if (!isValidElement<Props>(node)) return undefined;
  if (node.type === type) return node;
  for (const child of Children.toArray(node.props.children)) {
    const result = find(child, type);
    if (result) return result;
  }
}
function sheet(children: ReactNode) {
  const tree = FilterSheet({ children });
  const drawer = find(tree, Drawer)!;
  const content = drawer.props.children as ReactElement;
  const attach = (content as unknown as { ref?: (root: HTMLDivElement | null) => void }).ref ?? (() => {});
  return { tree, drawer, content, attach };
}

// Node-only attribute fixture for the real ref callback; this does not claim
// browser label activation, keyboard focus, or portal rendering coverage.
class ElementAttributes {
  constructor(readonly tag: string, readonly attributes: Map<string, string>) {}
  get id() { return this.attributes.get("id") ?? ""; }
  set id(value: string) { this.attributes.set("id", value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
}
function elements(html: string) {
  return [...html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/g)].map(match => new ElementAttributes(
    match[1], new Map([...match[2].matchAll(/([\w:-]+)="([^"]*)"/g)].map(attr => [attr[1], attr[2]])),
  ));
}
function root(nodes: ElementAttributes[]) {
  return { querySelectorAll: (selector: string) => nodes.filter(node => selector.split(",").some(part => node.attributes.has(part.slice(1, -1)))) } as unknown as HTMLDivElement;
}
const formValues = (nodes: ElementAttributes[]) => nodes.map(node => [...node.attributes].filter(([key]) => ["action", "method", "name", "value", "checked", "selected"].includes(key)));

beforeEach(() => { state.open = false; state.scope = "drawer-one"; });

describe("FilterSheet ID and value preservation", () => {
  it("names the square trigger and retains the active-filter count", () => {
    const html = renderToStaticMarkup(createElement(FilterSheet, { iconOnly: true, activeCount: 2, children: null }));
    expect(html).toContain('aria-label="Filters (2 active filters)"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('class="sr-only">Filters</span>');
  });
  const children = [
    ["Jobs", createElement(JobFilters, { state: { q: "developer", location: "Remote", exp: "fresher", type: "Full Time" } })],
    ["Projects", createElement(ProjectFilters, { categories: [{ id: "web", name: "Web" }], state: { q: "example", category: "web", min: "100", max: "2000", flag: "premium" } })],
    ["Practice", createElement(PracticeFilters, { categories: [], state: { q: "loops", difficulty: "Easy", category: "arrays", lang: "java", status: "solved", page: 1 } })],
  ] as const;

  it.each(children)("keeps simultaneously mounted %s IDs unique and labels local", (_name, child) => {
    const markup = renderToStaticMarkup(child);
    const desktop = elements(markup);
    const mobile = elements(markup);
    const before = formValues(mobile);
    sheet(child).attach(root(mobile));
    const ids = [...desktop, ...mobile].filter(node => node.id).map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const label of mobile.filter(node => node.getAttribute("for"))) {
      const target = label.getAttribute("for");
      expect(mobile.some(node => node.id === target)).toBe(true);
      expect(desktop.some(node => node.id === target)).toBe(false);
    }
    expect(formValues(mobile)).toEqual(before);
    expect(desktop.map(node => node.id)).toEqual(elements(markup).map(node => node.id));
  });

  it("updates local ARIA references while retaining external descriptions", () => {
    const nodes = elements('<input id="control" aria-labelledby="label" aria-describedby="help external-help" aria-controls="options" aria-activedescendant="option"/><label id="label" for="control"></label><p id="help"></p><div id="options"><span id="option"></span></div>');
    const { attach } = sheet(null);
    attach(root(nodes));
    const input = nodes[0];
    expect(input.id).toBe("drawer-one-control");
    expect(input.getAttribute("aria-labelledby")).toBe("drawer-one-label");
    expect(input.getAttribute("aria-describedby")).toBe("drawer-one-help external-help");
    expect(input.getAttribute("aria-controls")).toBe("drawer-one-options");
    expect(input.getAttribute("aria-activedescendant")).toBe("drawer-one-option");
    expect(nodes[1].getAttribute("for")).toBe(input.id);
    const attributes = nodes.map(node => [...node.attributes]);
    attach(null);
    attach(root(nodes));
    expect(nodes.map(node => [...node.attributes])).toEqual(attributes);
  });

  it("uses a separate namespace for different sheets", () => {
    const first = elements('<input id="control"/><label for="control"></label>');
    sheet(null).attach(root(first));
    state.scope = "drawer-two";
    const second = elements('<input id="control"/><label for="control"></label>');
    sheet(null).attach(root(second));
    expect(first[0].id).not.toBe(second[0].id);
    expect(second[1].getAttribute("for")).toBe(second[0].id);
  });

  it("keeps the same child tree and existing Drawer contract across open/close", () => {
    const child = children[0][1];
    let current = sheet(child);
    expect(current.drawer.props.open).toBe(false);
    expect(current.drawer.props.side).toBe("bottom");
    expect(current.content.props.children).toBe(child);
    (find(current.tree, "button")!.props.onClick as () => void)();
    current = sheet(child);
    expect(current.drawer.props.open).toBe(true);
    expect(current.content.props.children).toBe(child);
    (current.drawer.props.onClose as () => void)();
    current = sheet(child);
    expect(current.drawer.props.open).toBe(false);
    expect(current.content.props.children).toBe(child);
  });
});
