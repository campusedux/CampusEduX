import { readFileSync } from "fs";
import path from "path";
import { detectListItemQnA, detectQnA } from "@/learning/reader/qna";
import { inlineToText, parseMarkdown } from "@/learning/reader/markdownParser";
import { flattenText, nodeGap, prepareTopic, type ReaderNode } from "@/learning/reader/readerModel";
import type { LearningContentBlock } from "@/types";

const block = (body: string): LearningContentBlock => ({
  id: "b1", heading: "", body, content_format: "markdown", file_url: null, video_url: null, metadata: {},
});
const text = (nodes: ReaderNode[]) =>
  nodes.map((n) => (n.t === "qna" ? `Q[${inlineToText(n.question)}] Ans[${inlineToText(n.answer)}]` : n.t === "paragraph" ? `P[${inlineToText(n.inline)}]` : n.t));

describe("qna.ts is the website detector, byte for byte", () => {
  it("matches website/src/lib/qna.ts (edit both copies together)", () => {
    const here = readFileSync(path.join(__dirname, "../../../src/learning/reader/qna.ts"), "utf8");
    const web = readFileSync(path.join(__dirname, "../../../../website/src/lib/qna.ts"), "utf8");
    expect(here).toBe(web);
  });
});

// ---- Same cases as website/tests/lib/qna.test.ts ----
describe("detectQnA", () => {
  it("splits a bold question with the answer on the next line", () => {
    expect(detectQnA(["**What is Spring Boot, in two lines?**", "It is a framework on top of Spring."])).toEqual([
      { question: "**What is Spring Boot, in two lines?**", answer: "It is a framework on top of Spring." },
    ]);
  });

  it("splits a bold question with the answer on the same line", () => {
    expect(detectQnA(["**What is it?** Whole numbers, without a decimal point."])).toEqual([
      { question: "**What is it?**", answer: "Whole numbers, without a decimal point." },
    ]);
  });

  it("joins a multi-line answer and keeps inline code, links and bold intact", () => {
    expect(detectQnA(["**Q3. What is `==`?**", "It compares `refs`, see [docs](/x).", "It is **not** `.equals()`."])?.[0].answer).toBe(
      "It compares `refs`, see [docs](/x). It is **not** `.equals()`.",
    );
  });

  it("splits back-to-back pairs that share one paragraph", () => {
    expect(detectQnA(["**Q: One?**", "A: First.", "**Q: Two?**", "A: Second."])).toEqual([
      { question: "**Q: One?**", answer: "First." },
      { question: "**Q: Two?**", answer: "Second." },
    ]);
    // A later bold question with no answer of its own stays part of the previous answer.
    expect(detectQnA(["**Q: One?**", "First.", "**Really?**"])).toEqual([{ question: "**Q: One?**", answer: "First. **Really?**" }]);
  });

  it.each([
    ["A: Because every node has one parent.", "Because every node has one parent."],
    ["Answer: Python is interpreted.", "Python is interpreted."],
    ["Ans: Yes.", "Yes."],
    ["**A:** Yes.", "Yes."],
    ["**Answer:** Yes.", "Yes."],
  ])("drops the authored label %j so it is never doubled", (line, answer) => {
    expect(detectQnA(["**Q: Why?**", line])?.[0].answer).toBe(answer);
  });

  it("leaves lookalikes alone", () => {
    expect(detectQnA(["**What is it?**"])).toBeNull(); // no answer
    expect(detectQnA(["**Q: Why?**", "A:"])).toBeNull(); // label only
    expect(detectQnA(["**Note:** this is not a question?"])).toBeNull(); // bold is not the question
    expect(detectQnA(["Why does this work? **Because** it does."])).toBeNull(); // not opening bold
    expect(detectQnA(["Is it **really?** Yes."])).toBeNull(); // bold not at the start
    expect(detectQnA(["**Key point** — use a set?"])).toBeNull(); // bold doesn't end in "?"
  });

  it("leaves multiple-choice questions alone (the next lines are options, not the answer)", () => {
    expect(detectQnA(["**1. What is the default value of a boolean variable in Java?**", "a) true", "b) false", "c) 0", "d) null"])).toBeNull();
    expect(detectQnA(["**Which is immutable?** A) List  B) Tuple"])).toBeNull();
    expect(detectQnA(["**Which is immutable?**", "(b) Tuple"])).toBeNull();
  });
});

describe("detectListItemQnA", () => {
  it("accepts only bullets with an explicit Q marker", () => {
    expect(detectListItemQnA("**Q: Why three schemas instead of one?** To isolate end users.")).toEqual({
      question: "**Q: Why three schemas instead of one?**",
      answer: "To isolate end users.",
    });
    expect(detectListItemQnA("**Q1. Why?** Because.")?.answer).toBe("Because.");
  });

  it("leaves bold-question checklists untouched", () => {
    expect(detectListItemQnA("**What goes in?** Identify the data, prompt or other input.")).toBeNull();
    expect(detectListItemQnA("**What happened?** The HTTP status and a short error name.")).toBeNull();
  });
});

describe("parser + reader model Q&A", () => {
  it("next-line and same-line pairs become qna nodes; labels are replaced, never doubled", () => {
    const nodes = parseMarkdown("**What does @SpringBootApplication do?**\nIt combines `@Configuration` and more.\n\n**Q: Why?**\nA: Because.\n\n**What is it?** Whole numbers.") as ReaderNode[];
    expect(text(nodes)).toEqual([
      "Q[What does @SpringBootApplication do?] Ans[It combines @Configuration and more.]",
      "Q[Q: Why?] Ans[Because.]",
      "Q[What is it?] Ans[Whole numbers.]",
    ]);
    const first = nodes[0];
    expect(first.t === "qna" && first.answer.some((n) => n.t === "code" && n.v === "@Configuration")).toBe(true);
  });

  it("splits back-to-back pairs in one paragraph", () => {
    expect(text(parseMarkdown("**Q: One?**\nA: First.\n**Q: Two?**\nA: Second.") as ReaderNode[])).toEqual([
      "Q[Q: One?] Ans[First.]",
      "Q[Q: Two?] Ans[Second.]",
    ]);
  });

  it("keeps MCQs, checklists and plain paragraphs as they were", () => {
    const mcq = parseMarkdown("**1. What is the default value of a boolean variable in Java?**\na) true\nb) false\n\n**Answer: b) false**");
    expect(mcq.map((b) => b.t)).toEqual(["paragraph", "paragraph"]);
    const list = parseMarkdown("1. **What goes in?** Identify the input.\n- **What happened?** The HTTP status.");
    expect(list.every((b) => b.t !== "list" || b.items.every((it) => !it.qna))).toBe(true);
    expect(parseMarkdown("Plain text with a question?")[0].t).toBe("paragraph");
  });

  it("only Q-marked bullets carry a qna", () => {
    const [l] = parseMarkdown("- **Q: Why does normalization exist?** To store each fact once.\n- Plain bullet.");
    expect(l.t).toBe("list");
    if (l.t !== "list") return;
    expect(l.items[0].qna && inlineToText(l.items[0].qna.question)).toBe("Q: Why does normalization exist?");
    expect(l.items[0].qna && inlineToText(l.items[0].qna.answer)).toBe("To store each fact once.");
    expect(l.items[1].qna).toBeUndefined();
  });

  it("keeps all text in order and spaces consecutive pairs", () => {
    const { blocks } = prepareTopic([block("Intro.\n\n**One?**\nFirst.\n\n**Two?**\nSecond.")], "T");
    const nodes = blocks[0].nodes;
    expect(flattenText(nodes)).toEqual(["Intro.", "One?", "First.", "Two?", "Second."]);
    expect(nodeGap(nodes[1], nodes[2])).toBeGreaterThan(nodeGap(nodes[0], { t: "paragraph", inline: [] }));
  });
});
