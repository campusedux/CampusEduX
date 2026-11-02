import { beforeEach, describe, expect, it, vi } from "vitest";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import { HeaderLinks } from "@/components/nav/HeaderLinks";
import { BottomNav } from "@/components/nav/BottomNav";
import Footer from "@/components/Footer";
import SupportPage from "@/app/support/page";
import { MobileNav } from "@/components/nav/MobileNav";
import { PlacementPrep } from "@/components/home/PlacementPrep";
import { Drawer } from "@/components/ui";

const state = vi.hoisted(() => ({ open: false, pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("@/lib/useSessionProfile", () => ({ useSessionProfile: () => ({ profile: null }) }));
// Call the component directly to inspect its interaction contract in Node.
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => [state.open, (open: boolean) => { state.open = open; }],
  useEffect: () => {},
}));

type Props = { children?: ReactNode; [key: string]: unknown };
function nodes(node: ReactNode): ReactElement<Props>[] {
  if (!isValidElement<Props>(node)) return [];
  return [node, ...Children.toArray(node.props.children).flatMap(nodes)];
}

beforeEach(() => { state.open = false; state.pathname = "/"; });

describe("mobile navigation accessibility", () => {
  it("exposes menu state and closes on selection of the current route", () => {
    let tree = nodes(MobileNav());
    const trigger = tree.find(node => node.type === "button" && node.props["aria-label"] === "Open menu")!;
    expect(trigger.props["aria-haspopup"]).toBe("dialog");
    expect(trigger.props["aria-expanded"]).toBe(false);
    (trigger.props.onClick as () => void)();
    tree = nodes(MobileNav());
    expect(tree.find(node => node.type === "button" && node.props["aria-label"] === "Open menu")!.props["aria-expanded"]).toBe(true);
    expect(tree.find(node => node.type === Drawer)!.props).toMatchObject({ open: true, ariaLabel: "Menu" });
    expect(tree.find(node => node.type === "nav")!.props["aria-label"]).toBe("Main menu");
    const home = tree.find(node => node.type === Link && node.props.href === "/")!;
    expect(home.props["aria-current"]).toBe("page");
    (home.props.onClick as () => void)();
    expect(nodes(MobileNav()).find(node => node.type === Drawer)!.props.open).toBe(false);
  });

  it.each([
    ["drawer", () => MobileNav()],
    ["homepage", () => PlacementPrep({ problemCount: 1, interviewTopicCount: 1 })],
  ] as const)("defers compiler prefetching from the %s while retaining its destination", (_name, component) => {
    const links = nodes(component()).filter(node => node.type === Link);
    const compiler = links.find(node => node.props.href === "/compiler")!;
    expect(compiler).toBeDefined();
    expect(compiler.props.prefetch).toBe(false);
    expect(links.find(node => node.props.href === "/learning")!.props.prefetch).toBeUndefined();
  });
});


describe("Projects navigation without inventory gates", () => {
  it.each([
    ["header", () => HeaderLinks()],
    ["bottom tabs", () => BottomNav()],
    ["footer", () => Footer()],
    ["support", () => SupportPage()],
  ] as const)("keeps the original Projects link in the %s", (_name, component) => {
    const html = renderToStaticMarkup(component());
    expect(html).toMatch(/href="\/projects"[^>]*>[\s\S]*?(?:Projects|Browse projects)/);
    expect(html).not.toMatch(/coming soon|Projects · soon/i);
  });

  it("keeps the drawer Projects wording and destination", () => {
    const project = nodes(MobileNav()).find(node => node.type === Link && node.props.href === "/projects")!;
    expect(project).toBeDefined();
    const labels = nodes(project).filter(node => node.type === "span").map(node => node.props.children);
    expect(labels).toContain("Projects");
  });
});
