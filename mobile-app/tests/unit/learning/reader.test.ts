import { matchCallout, normalizeLabel } from "@/learning/reader/calloutConfig";
import { inlineToText as inlineToTextForTest, parseInline, parseMarkdown, safeLinkUrl } from "@/learning/reader/markdownParser";
import { BOX_MAX_WORDS, countWords, flattenText, nodeGap, prepareTopic, readingMinutes, MIN_TOC_ITEMS } from "@/learning/reader/readerModel";
import { normalizeLang, tokenize } from "@/learning/reader/highlight";
import type { LearningContentBlock } from "@/types";

const block = (body: string, heading = "", extra: Partial<LearningContentBlock> = {}): LearningContentBlock => ({
  id: `b${Math.random()}`, heading, body, content_format: "markdown", file_url: null, video_url: null, metadata: {}, ...extra,
});

describe("callout detection (config)", () => {
  it.each([
    ["What is it?", "definition"], ["Definition", "definition"],
    ["Why do we use it?", "why"], ["Why is it used?", "why"],
    ["Real-World Example", "example"], ["Real-Life Example", "example"], ["How It Works", "example"], ["Example", "example"], ["Example 2", "example"],
    ["Edge Cases and Pitfalls", "warning"], ["Common Mistakes", "warning"], ["Common Beginner Mistakes — Summary for This Section", "warning"],
    ["Key Points", "key"], ["Key Points to Remember", "key"], ["Summary", "key"], ["Interview Tip", "key"],
  ])("%s → %s", (label, kind) => expect(matchCallout(label)?.kind).toBe(kind));

  it("numbering, case, emoji and trailing punctuation are ignored", () => {
    expect(matchCallout("## nothing")).toBeNull();
    expect(matchCallout("2. Why is it used?")?.kind).toBe("why");
    expect(matchCallout("  6)  KEY   POINTS TO REMEMBER: ")?.kind).toBe("key");
    expect(matchCallout("💡 What is it?")?.kind).toBe("definition");
    expect(normalizeLabel("3. Real-World Example")).toBe("real world example");
  });

  it("non-matching headings stay normal", () => {
    for (const h of ["1. What is Java?", "Syntax", "Examples of loops", "Program 1: Sum", "Introduction"]) expect(matchCallout(h)).toBeNull();
  });
});

describe("markdown parser", () => {
  it("parses the common blocks", () => {
    const b = parseMarkdown("## 1. Title\n\nSome **bold** and `code` text.\n\n- a\n- b\n\n```java\nint x;\n```\n\n> quote\n\n---");
    expect(b.map((x) => x.t)).toEqual(["heading", "paragraph", "list", "code", "quote", "hr"]);
    expect(b[3]).toMatchObject({ t: "code", lang: "java", code: "int x;" });
  });

  it("ordered list keeps source numbers even when items are separated by blank lines", () => {
    const b = parseMarkdown("1. one\n\n2. two\n3. three");
    expect(b).toHaveLength(2);
    expect((b[1] as any).items.map((i: any) => i.n)).toEqual([2, 3]);
  });

  it("nested list levels", () => {
    const l = parseMarkdown("- a\n  - b\n    - c")[0] as any;
    expect(l.items.map((i: any) => i.level)).toEqual([0, 1, 2]);
  });

  it("tables", () => {
    const t = parseMarkdown("| A | B |\n|---|:-:|\n| 1 | **2** |")[0] as any;
    expect(t.t).toBe("table");
    expect(t.header).toHaveLength(2);
    expect(t.rows[0][1][0].t).toBe("bold");
  });

  it("escaped pipes inside table cells are literal pipes, not column breaks", () => {
    const t = parseMarkdown("| Task | MySQL | Postgres |\n|---|---|---|\n| Concat | `CONCAT(a,b)` | `a \\|\\| b` |\n| Abs | \\|error\\| | x |")[0] as any;
    expect(t.header).toHaveLength(3);
    expect(t.rows.map((r: any) => r.length)).toEqual([3, 3]);
    expect(inlineToTextForTest(t.rows[0][2])).toContain("a || b");
    expect(inlineToTextForTest(t.rows[1][1])).toBe("|error|");
  });

  it("a paragraph followed by --- is a paragraph + hr, not a table", () => {
    expect(parseMarkdown("a | b\n---").map((x) => x.t)).toEqual(["paragraph", "hr"]);
  });

  it("inline: snake_case_names and `2 * 3 * 4` are NOT emphasised; real emphasis is", () => {
    expect(parseInline("use my_variable_name here")).toEqual([{ t: "text", v: "use my_variable_name here" }]);
    expect(parseInline("2 * 3 * 4")).toEqual([{ t: "text", v: "2 * 3 * 4" }]);
    expect(parseInline("an _italic_ word")[1]).toMatchObject({ t: "italic" });
    expect(parseInline("**bold `x`**")[0]).toMatchObject({ t: "bold" });
  });

  it("blocks unsafe link schemes", () => {
    expect(safeLinkUrl("javascript:alert(1)")).toBeNull();
    expect(safeLinkUrl("https://a.b")).toBe("https://a.b");
    expect((parseInline("[x](javascript:evil)")[0] as any).href).toBeNull();
  });

  it("unclosed code fence takes the rest instead of losing it", () => {
    expect(parseMarkdown("```sql\nselect 1;")[0]).toMatchObject({ t: "code", code: "select 1;" });
  });
});

describe("prepareTopic", () => {
  const body = "## 1. What is Java?\n\nIntro.\n\n## 2. Why is it used?\n\nBecause.\n\n### Detail\n\nMore.\n\n## 3. Syntax\n\n```java\nint a;\n```\n\n## 4. Key Points to Remember\n\n- x\n- y";

  it("hides a first heading equal to the topic title (case/space-insensitive) and keeps the rest", () => {
    const p = prepareTopic([block("# Java   Intro\n\nHello\n\n## Next")], "java intro");
    expect(flattenText(p.blocks[0].nodes)).toEqual(["Hello", "Next"]);
  });

  it("also hides the block heading when it repeats the title, and a duplicate right after it", () => {
    const p = prepareTopic([block("# Variables\n\nText", "Variables")], "Variables");
    expect(flattenText(p.blocks[0].nodes)).toEqual(["Text"]);
  });

  it("does not hide a heading that merely resembles the title, or a later matching heading", () => {
    expect(flattenText(prepareTopic([block("## Variables in Java\n\nx")], "Variables").blocks[0].nodes)).toEqual(["Variables in Java", "x"]);
    expect(flattenText(prepareTopic([block("## Intro\n\n## Variables")], "Variables").blocks[0].nodes)).toEqual(["Intro", "Variables"]);
  });

  it("wraps callout sections without dropping or reordering ANY content", () => {
    const flat = flattenText(prepareTopic([block(body)], "Something else").blocks[0].nodes);
    expect(flat).toEqual([
      "1. What is Java?", "Intro.",
      "[why] 2. Why is it used?", "Because.", "Detail", "More.",
      "3. Syntax", "int a;",
      "[key] 4. Key Points to Remember", "x", "y",
    ]);
    // "1. What is Java?" is a normal heading (not a callout); Detail stays a heading INSIDE the "why" callout
    const nodes = prepareTopic([block(body)], "x").blocks[0].nodes;
    expect(nodes.map((n) => n.t)).toEqual(["heading", "paragraph", "callout", "heading", "code", "callout"]);
  });

  it("a callout ends at the next heading of the same or higher level", () => {
    const nodes = prepareTopic([block("### Example\n\na\n\n### Other\n\nb\n\n## Big\n\nc")], "z").blocks[0].nodes;
    expect(nodes.map((n) => n.t)).toEqual(["callout", "heading", "paragraph", "heading", "paragraph"]);
  });

  it("a block heading that is a callout label owns that block's body", () => {
    const nodes = prepareTopic([block("Body text.\n\n- item", "What is it?")], "z").blocks[0].nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ t: "callout", kind: "definition", label: "What is it?" });
  });

  it("outline lists sections + callouts + sub-headings; TOC threshold is 3", () => {
    const p = prepareTopic([block(body)], "x");
    expect(p.toc.map((t) => [t.text, t.depth])).toEqual([
      ["1. What is Java?", 0], ["2. Why is it used?", 0], ["Detail", 1], ["3. Syntax", 0], ["4. Key Points to Remember", 0],
    ]);
    expect(prepareTopic([block("## A\n\nx\n\n## B\n\ny")], "x").toc.length).toBeLessThan(MIN_TOC_ITEMS);
  });

  it("anchor ids are unique", () => {
    const ids = prepareTopic([block(body), block(body)], "x").toc.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("plain-format blocks become paragraphs", () => {
    const p = prepareTopic([block("one\n\ntwo", "", { content_format: "plain" })], "x");
    expect(flattenText(p.blocks[0].nodes)).toEqual(["one", "two"]);
  });

  it("carries attachment urls through", () => {
    const p = prepareTopic([block("x", "", { file_url: "https://f", video_url: "https://v" })], "t");
    expect([p.blocks[0].fileUrl, p.blocks[0].videoUrl]).toEqual(["https://f", "https://v"]);
  });
});

describe("reading time + spacing", () => {
  it("real word count at 200 wpm, minimum 1 minute", () => {
    expect(countWords("Hello, world! 42 items")).toBe(4);
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(200)).toBe(1);
    expect(readingMinutes(201)).toBe(2);
    const long = block(Array.from({ length: 900 }, () => "word").join(" "));
    expect(prepareTopic([long], "t").readingMinutes).toBe(5);
  });

  it("vertical rhythm: 32 above H2, 20 above H3, 16 between paragraphs, 0 first", () => {
    const [h2, h3, p] = parseMarkdown("## a\n\n### b\n\ntext").map((b, i) => ({ ...b, id: `h${i}` })) as any[];
    expect(nodeGap(null, h2)).toBe(0);
    expect(nodeGap(p, h2)).toBe(32);
    expect(nodeGap(p, h3)).toBe(20);
    expect(nodeGap(p, p)).toBe(16);
    expect(nodeGap(h2, p)).toBe(10);
  });
});

describe("syntax highlighter", () => {
  const samples: Record<string, string> = {
    java: 'public class A {\n  // hi\n  static int x = 42; /* c */\n  void f() { System.out.println("a\\"b"); }\n}',
    python: 'def f(x):\n    """doc\nstring"""\n    # c\n    return {"a": 1.5, \'b\': None}\nclass Foo: pass',
    js: "const a = `t ${x}\nmore`; // c\nfunction g(n){ return n>=0x1F ? 'y' : \"n\"; }",
    sql: "-- c\nSELECT COUNT(*), name FROM users WHERE id >= 10 AND s = 'it''s' /* x */ ORDER BY 1;\nCREATE TABLE t (id INT PRIMARY KEY, n VARCHAR(20));",
  };

  it.each(Object.keys(samples))("%s: tokens rejoin to the exact input (lossless)", (lang) => {
    expect(tokenize(samples[lang], lang).map((t) => t.text).join("")).toBe(samples[lang]);
  });

  it("is lossless on hostile input and unknown languages", () => {
    for (const lang of ["java", "sql", "python", "js", "rust", "", null]) {
      for (const code of ['"unterminated', "'a\nb", "/* open", "```", "\\", "0x", "1.2.3e", "\t\n  ", "日本語 ünïcode", "a\r\nb"]) {
        expect(tokenize(code, lang as any).map((t) => t.text).join("")).toBe(code);
      }
    }
  });

  it("classifies the basics", () => {
    const kinds = (code: string, lang: string) => Object.fromEntries(tokenize(code, lang).filter((t) => t.kind !== "plain" && t.kind !== "operator").map((t) => [t.text, t.kind]));
    expect(kinds("SELECT count(*) FROM t -- x", "sql")).toMatchObject({ SELECT: "keyword", count: "fn", FROM: "keyword", "-- x": "comment" });
    expect(kinds("def add(a): return 'x' # c", "python")).toMatchObject({ def: "keyword", add: "fn", return: "keyword", "'x'": "string", "# c": "comment" });
    expect(kinds("public static void main() { int n = 10; }", "java")).toMatchObject({ public: "keyword", main: "fn", int: "keyword", "10": "number" });
    expect(kinds("const x = new Map(); // c", "js")).toMatchObject({ const: "keyword", new: "keyword", Map: "fn", "// c": "comment" });
    expect(kinds("String s;", "java")).toMatchObject({ String: "type" });
  });

  it("language aliases", () => {
    expect(["mysql", "py", "JavaScript", "ts", "text"].map(normalizeLang)).toEqual(["sql", "python", "js", "js", null]);
  });
});

describe("callout box rule", () => {
  const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
  const variants = (md: string) =>
    prepareTopic([block(md)], "zzz").blocks[0].nodes.filter((n) => n.t === "callout").map((n: any) => `${n.kind}:${n.variant}`);

  it("short prose-only section → box", () => {
    expect(variants(`## Key Points\n\n${words(40)}`)).toEqual(["key:box"]);
  });

  it(`a section of ${BOX_MAX_WORDS}+ words → heading variant (no box)`, () => {
    expect(variants(`## Key Points\n\n${words(BOX_MAX_WORDS + 5)}`)).toEqual(["key:heading"]);
    expect(variants(`## Key Points\n\n${words(BOX_MAX_WORDS - 20)}`)).toEqual(["key:box"]);
  });

  it("a section containing code or a table is never boxed", () => {
    expect(variants("## Example\n\nShort.\n\n```java\nint a;\n```")).toEqual(["example:heading"]);
    expect(variants("## Summary\n\n| a | b |\n|---|---|\n| 1 | 2 |")).toEqual(["key:heading"]);
  });

  it("code nested in a sub-heading still disqualifies the parent", () => {
    expect(variants("## Example\n\nintro\n\n### Detail\n\n```sql\nselect 1;\n```")).toEqual(["example:heading"]);
  });

  it("no two boxes are adjacent: the second becomes the heading variant", () => {
    expect(variants("## Key Points\n\na\n\n## Common Mistakes\n\nb\n\n## Summary\n\nc")).toEqual(["key:box", "warning:heading", "key:box"]);
  });

  it("a normal node between two callouts lets both be boxes", () => {
    expect(variants("## Key Points\n\na\n\n## Syntax\n\nplain\n\n## Common Mistakes\n\nb")).toEqual(["key:box", "warning:box"]);
  });

  it("adjacency also holds across content blocks", () => {
    const p = prepareTopic([block("a", "Key Points"), block("b", "Common Mistakes")], "zzz");
    expect(p.blocks.flatMap((b) => b.nodes).map((n: any) => n.variant)).toEqual(["box", "heading"]);
  });

  it("a heading-variant callout may contain a boxed sub-callout, but a box never contains a box", () => {
    const big = prepareTopic([block(`## Example\n\n${words(200)}\n\n### Common Mistakes\n\nshort`)], "zzz").blocks[0].nodes[0] as any;
    expect(big.variant).toBe("heading");
    expect(big.children.find((c: any) => c.t === "callout")?.variant).toBe("box");
    const small = prepareTopic([block("## Example\n\nshort\n\n### Common Mistakes\n\nshort")], "zzz").blocks[0].nodes[0] as any;
    expect(small.variant).toBe("box");
    expect(small.children.find((c: any) => c.t === "callout")?.variant).toBe("heading");
  });

  it("still never drops or reorders content", () => {
    const md = `## Key Points\n\n${words(200)}\n\n## Common Mistakes\n\nx\n\n## Summary\n\ny`;
    const flat = flattenText(prepareTopic([block(md)], "zzz").blocks[0].nodes);
    expect(flat.map((f) => f.replace(/^\[[^\]]+\] /, ""))).toEqual(["Key Points", words(200), "Common Mistakes", "x", "Summary", "y"]);
  });

  it("heading-variant callouts stay in the outline and use heading spacing", () => {
    const p = prepareTopic([block(`## A\n\nx\n\n## Key Points\n\n${words(200)}\n\n## C\n\nz`)], "zzz");
    expect(p.toc.map((t) => t.text)).toEqual(["A", "Key Points", "C"]);
    const [, para, kp] = p.blocks[0].nodes as any[];
    expect(nodeGap(para, kp)).toBe(32);
  });

  it("a callout directly under a heading is tight (10), like any content after a heading", () => {
    const nodes = prepareTopic([block("### 9.1 Linear Regression\n\n### What is it?\n\ntext")], "zzz").blocks[0].nodes as any[];
    expect(nodes.map((n) => n.t)).toEqual(["heading", "callout"]);
    expect(nodeGap(nodes[0], nodes[1])).toBe(10);
  });
});
