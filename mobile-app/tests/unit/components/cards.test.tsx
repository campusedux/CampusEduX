import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { JobCard } from "@/components/cards/JobCard";

function render(el: React.ReactElement) {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  return r;
}
const texts = (r: TestRenderer.ReactTestRenderer) =>
  r.root.findAllByType(Text).map((t) => (Array.isArray(t.props.children) ? t.props.children.join("") : String(t.props.children)));

const project = (over: object = {}) =>
  ({ id: "p1", title: "Chat App", price: 499, techStack: ["React"], categoryName: "Web", rating: 4.5, reviewCount: 8, ...over }) as any;
const job = (over: object = {}) =>
  ({ id: "j1", title: "SDE Intern", companyName: "Acme", jobType: "Internship", location: "Pune", salaryRange: "₹20k", postedAt: "2d ago", ...over }) as any;

describe("<ProjectCard /> rating row", () => {
  (["featured", "compact"] as const).forEach((variant) => {
    it(`${variant}: shows star row for a valid rating with reviews`, () => {
      const r = render(<ProjectCard project={project()} variant={variant} onPress={() => {}} />);
      expect(texts(r)).toContain("4.5 (8)");
      expect(r.root.findAll((n) => n.props.name === "star").length).toBeGreaterThan(0);
    });

    it(`${variant}: null/undefined rating does not crash and hides the star row`, () => {
      [null, undefined].forEach((rating) => {
        const r = render(<ProjectCard project={project({ rating })} variant={variant} onPress={() => {}} />);
        expect(r.root.findAll((n) => n.props.name === "star")).toHaveLength(0);
        expect(texts(r).some((t) => t.includes("("))).toBe(false);
        expect(texts(r)).toContain("Chat App");
      });
    });

    it(`${variant}: hides the rating when reviewCount is 0 but keeps the price`, () => {
      const r = render(<ProjectCard project={project({ reviewCount: 0 })} variant={variant} onPress={() => {}} />);
      expect(r.root.findAll((n) => n.props.name === "star")).toHaveLength(0);
      expect(texts(r).some((t) => t.includes("499"))).toBe(true);
    });
  });
});

describe("<JobCard />", () => {
  it("renders the job type badge when present", () => {
    expect(texts(render(<JobCard job={job()} onPress={() => {}} />))).toContain("Internship");
  });

  it("renders no badge for an empty/missing jobType", () => {
    ["", undefined].forEach((jobType) => {
      const t = texts(render(<JobCard job={job({ jobType })} onPress={() => {}} />));
      expect(t).not.toContain("Internship");
      expect(t).toEqual(expect.arrayContaining(["SDE Intern", "Acme"]));
    });
  });

  it("omits the salary text when empty but keeps postedAt", () => {
    const t = texts(render(<JobCard job={job({ salaryRange: "" })} onPress={() => {}} />));
    expect(t).not.toContain("₹20k");
    expect(t).toContain("2d ago");
  });
});
