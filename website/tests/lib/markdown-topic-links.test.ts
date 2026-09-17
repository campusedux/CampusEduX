import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown, createTopicLinkState } from "@/components/learning/Markdown";
import type { TopicLinkEntry } from "@/lib/topicLinks";

// CodeBlock (rendered for fenced ``` blocks) is a client component that calls
// useRouter() for its "open in compiler" action — stub it so a fenced block
// can render outside the Next app router, same as any other unit test of
// Markdown's block parsing would need.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const ARRAYLIST: TopicLinkEntry = {
  terms: ["arraylist", "java arraylist"],
  href: "/learning/java-tutorial/arraylist",
  label: "ArrayList",
  topicKey: "arraylist",
};
const LINKEDLIST: TopicLinkEntry = {
  terms: ["linkedlist"],
  href: "/learning/java-tutorial/linkedlist",
  label: "LinkedList",
  topicKey: "linkedlist",
};

describe("Markdown internal topic auto-linking", () => {
  it("links the first mention of a glossary term in a paragraph", () => {
    const html = renderToStaticMarkup(
      Markdown({ source: "Java ArrayList provides a resizable array.", topicLinks: [ARRAYLIST] }),
    );
    // The longer multi-word term ("Java ArrayList") wins over the shorter
    // overlapping alias ("ArrayList"), so the anchor text is the full phrase.
    expect(html).toContain('href="/learning/java-tutorial/arraylist"');
    expect(html).toContain(">Java ArrayList<");
  });

  it("links only the FIRST mention of a topic on the page, not every occurrence", () => {
    const source = "ArrayList is resizable. Later, ArrayList is used again in the example.";
    const html = renderToStaticMarkup(Markdown({ source, topicLinks: [ARRAYLIST] }));
    expect((html.match(/href="\/learning\/java-tutorial\/arraylist"/g) ?? []).length).toBe(1);
  });

  it("never links inside a fenced code block", () => {
    const source = ["Use ArrayList like this:", "", "```java", "ArrayList<Integer> list = new ArrayList<>();", "```"].join(
      "\n",
    );
    const html = renderToStaticMarkup(Markdown({ source, topicLinks: [ARRAYLIST] }));
    // Exactly one link overall (the prose mention) even though "ArrayList"
    // appears twice more inside the fenced code block.
    expect((html.match(/href="\/learning\/java-tutorial\/arraylist"/g) ?? []).length).toBe(1);
    expect(html).toContain("<code");
    expect(html).toContain("ArrayList&lt;Integer&gt;");
  });

  it("never links inside inline code spans", () => {
    const html = renderToStaticMarkup(Markdown({ source: "Call `new ArrayList()` to create one.", topicLinks: [ARRAYLIST] }));
    expect(html).not.toContain('href="/learning/java-tutorial/arraylist"');
  });

  it("never nests a new anchor inside an existing markdown link", () => {
    const html = renderToStaticMarkup(
      Markdown({ source: "See [the ArrayList docs](https://example.com/x).", topicLinks: [ARRAYLIST] }),
    );
    // One <a> for the authored markdown link; the auto-linker must not touch
    // text that's already inside it (renderInline already consumed it as a
    // single link token before the auto-link pass ever sees plain strings).
    expect((html.match(/<a /g) ?? []).length).toBe(1);
    expect(html).toContain("https://example.com/x");
  });

  it("does not self-link (glossary omits the current topic entirely)", () => {
    // Simulates buildTopicLinkIndex already excluding the current topic —
    // Markdown itself has no special-casing, it just links whatever glossary
    // it's given, so an empty/absent entry for "ArrayList" means no link.
    const html = renderToStaticMarkup(Markdown({ source: "ArrayList is a List.", topicLinks: [LINKEDLIST] }));
    expect(html).not.toContain("href=");
  });

  it("shares dedup state across multiple Markdown calls via linkState", () => {
    const state = createTopicLinkState();
    const html1 = renderToStaticMarkup(Markdown({ source: "ArrayList basics.", topicLinks: [ARRAYLIST], linkState: state }));
    const html2 = renderToStaticMarkup(Markdown({ source: "ArrayList again in block two.", topicLinks: [ARRAYLIST], linkState: state }));
    expect(html1).toContain('href="/learning/java-tutorial/arraylist"');
    expect(html2).not.toContain("href=");
  });

  it("respects the linksLeft cap across many matches", () => {
    const state = createTopicLinkState(1);
    const source = "ArrayList here. LinkedList there.";
    const html = renderToStaticMarkup(Markdown({ source, topicLinks: [ARRAYLIST, LINKEDLIST], linkState: state }));
    expect((html.match(/<a /g) ?? []).length).toBe(1);
  });

  it("does not auto-link inside headings", () => {
    const html = renderToStaticMarkup(Markdown({ source: "## ArrayList\n\nSee ArrayList above.", topicLinks: [ARRAYLIST] }));
    // The heading's own text must stay plain; the paragraph mention gets the link.
    expect(html).toMatch(/<h3[^>]*>ArrayList<\/h3>/);
    expect((html.match(/href="\/learning\/java-tutorial\/arraylist"/g) ?? []).length).toBe(1);
  });

  it("is a no-op when topicLinks is omitted (existing callers unaffected)", () => {
    const html = renderToStaticMarkup(Markdown({ source: "Java ArrayList provides a resizable array." }));
    expect(html).not.toContain("href=");
  });
});
