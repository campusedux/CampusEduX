import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { detectListItemQnA, detectQnA } from "@/lib/qna";
import { Markdown } from "@/components/learning/Markdown";

// CodeBlock is a client component that calls useRouter() — see markdown-topic-links.test.ts.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const html = (source: string) => renderToStaticMarkup(Markdown({ source, callouts: true, sections: true }));
const count = (s: string, needle: string) => s.split(needle).length - 1;

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

describe("Markdown Q&A rendering", () => {
  it("renders the question on its own line and the answer behind one Ans: label", () => {
    const out = html("**What does @SpringBootApplication do?**\nIt combines `@Configuration` and more.");
    expect(out).toContain('<p class="block font-semibold leading-7 text-ink"><strong class="font-semibold text-ink">What does @SpringBootApplication do?</strong></p>');
    expect(out).toMatch(/<strong class="[^"]*">Ans:<\/strong>It combines <code[^>]*>@Configuration<\/code> and more\./);
  });

  it("never renders a doubled label", () => {
    const out = html("**Q: What replaced the hierarchical model?**\nA: The relational model.\n\n**Q1. Is it typed?**\nAnswer: Dynamically typed.");
    expect(count(out, "Ans:")).toBe(2);
    expect(out).not.toMatch(/Ans:<\/strong>\s*(A|Ans|Answer):/);
  });

  it("renders consecutive pairs as separate spaced blocks", () => {
    const out = html("**One?**\nFirst.\n\n**Two?**\nSecond.");
    expect(count(out, '<div class="block my-5">')).toBe(2);
  });

  it("keeps the code block of a multi-paragraph answer below the single Ans:", () => {
    const out = html("**How do you run it?**\nUse the jar:\n```bash\njava -jar app.jar\n```\nThen open the browser.");
    expect(count(out, "Ans:")).toBe(1);
    expect(out.indexOf("Ans:")).toBeLessThan(out.indexOf("java -jar app.jar"));
  });

  it("renders Q-marked bullets as Q&A inside the list item", () => {
    const out = html("- **Q: Why does normalization exist?** To store each fact once.\n- Plain bullet.");
    expect(out).toMatch(/<li[^>]*><span class="block">.*Why does normalization exist\?.*Ans:<\/strong>To store each fact once\.<\/span><\/span><\/li>/);
  });

  it("leaves checklists, practice answers and plain paragraphs as they were", () => {
    const out = html("1. **What goes in?** Identify the input.\n\n**Answer:** Not a question.\n\nPlain text with a question?");
    expect(out).not.toContain("Ans:");
    expect(out).toContain("<strong class=\"font-semibold text-ink\">What goes in?</strong> Identify the input.");
  });
});
