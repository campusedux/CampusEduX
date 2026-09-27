import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { MarkdownText } from "@/components/learning/MarkdownText";
import { LIGHT_COLORS } from "@/theme/colors";

// MarkdownText (interview answers, practice problem statements / editorials) renders Q&A the
// same way as the Learning reader and the website: question line, then one "Ans:" label.

const mounted: TestRenderer.ReactTestRenderer[] = [];
const render = (source: string) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<MarkdownText source={source} />);
  });
  mounted.push(r);
  return r;
};
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((r) => r.unmount());
  });
});
/** Text of each host <Text> that is a direct child of a host <View> — i.e. one visual line/block. */
const lines = (r: TestRenderer.ReactTestRenderer): string[] => {
  const walk = (n: any): string => (n == null ? "" : typeof n === "string" ? n : Array.isArray(n) ? n.map(walk).join("") : walk(n.children));
  const out: string[] = [];
  const visit = (n: any) => {
    if (!n || typeof n === "string") return;
    if (Array.isArray(n)) return n.forEach(visit);
    if (n.type === "Text") out.push(walk(n));
    else visit(n.children);
  };
  visit(r.toJSON());
  return out;
};
const labels = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => typeof n.type === "string" && n.props.children === "Ans: ");

describe("MarkdownText Q&A", () => {
  it("puts the question on its own line and the answer behind one Ans: label (next-line and same-line)", () => {
    const r = render("**What does @SpringBootApplication do?**\nIt combines `@Configuration` and more.\n\n**What is it?** Whole numbers.");
    expect(lines(r)).toEqual([
      "What does @SpringBootApplication do?",
      "Ans: It combines @Configuration and more.",
      "What is it?",
      "Ans: Whole numbers.",
    ]);
    const label = labels(r)[0];
    expect(label.props.style).toMatchObject({ fontWeight: "700", color: LIGHT_COLORS.primaryText });
  });

  it("replaces authored A: / Answer: labels — never doubled — and splits back-to-back pairs", () => {
    const r = render("**Q: One?**\nA: First.\n**Q: Two?**\nAnswer: Second.");
    expect(lines(r)).toEqual(["Q: One?", "Ans: First.", "Q: Two?", "Ans: Second."]);
    expect(labels(r)).toHaveLength(2);
  });

  it("renders Q-marked bullets as Q&A and leaves other bullets alone", () => {
    const r = render("- **Q: Why normalize?** To store each fact once.\n- **What happened?** The HTTP status.");
    expect(lines(r)).toEqual(["•", "Q: Why normalize?", "Ans: To store each fact once.", "•", "What happened? The HTTP status."]);
  });

  it("leaves MCQs, practice answers and plain paragraphs unchanged", () => {
    const r = render("**1. What is the default value of a boolean?**\na) true\nb) false\n\n**Answer:** b) false\n\nPlain text with a question?");
    expect(labels(r)).toHaveLength(0);
    expect(lines(r)).toEqual(["1. What is the default value of a boolean? a) true b) false", "Answer: b) false", "Plain text with a question?"]);
  });
});
