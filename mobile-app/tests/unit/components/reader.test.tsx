import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => children }));
jest.mock("expo-clipboard", () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

import * as Clipboard from "expo-clipboard";
import { CodeBlock } from "@/components/learning/reader/CodeBlock";
import { CompleteButton } from "@/components/learning/reader/CompleteButton";
import { ReaderContent } from "@/components/learning/reader/ReaderContent";
import { AnchorRegistry, ReaderCtx } from "@/components/learning/reader/readerContext";
import { TableOfContents } from "@/components/learning/reader/TableOfContents";
import { TopicNavFooter } from "@/components/learning/reader/TopicNavFooter";
import { ReaderHeader } from "@/components/learning/reader/ReaderHeader";
import { prepareTopic } from "@/learning/reader/readerModel";
import { COURSE_ACCENTS, accentTokens } from "@/theme/courseAccents";

const accent = accentTokens(COURSE_ACCENTS.java, "light");
const ctx = { accent, anchors: new AnchorRegistry(), enableRun: false };

const mounted: TestRenderer.ReactTestRenderer[] = [];
const render = (el: React.ReactElement) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(<ReaderCtx.Provider value={ctx}>{el}</ReaderCtx.Provider>);
  });
  mounted.push(r);
  return r;
};
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((r) => r.unmount());
  });
});
const dump = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());
/** All rendered text, concatenated in document order (nested spans joined). */
const textOf = (r: TestRenderer.ReactTestRenderer): string => {
  const walk = (n: any): string => (n == null ? "" : typeof n === "string" ? n : Array.isArray(n) ? n.map(walk).join("") : walk(n.children));
  return walk(r.toJSON());
};
const press = (r: TestRenderer.ReactTestRenderer, label: string) => {
  const node = r.root.findAll((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === "function")[0];
  act(() => node.props.onPress());
};

const md = `## 1. What is Java?

Java is **fast** and \`portable\`.

## 2. Why is it used?

- one
- two

## 3. Syntax

\`\`\`java
public class A {
  int x = 1;
  void f() {}
  // c
  String s = "a";
}
\`\`\`

## 4. Compare

| Feature | Java |
|---|---|
| Typed | **Yes** |
| Fast | Yes |

## 5. Key Points to Remember

1. first
2. second`;

const content = (body: string) => [{ id: "b1", heading: "", body, content_format: "markdown" as const, file_url: null, video_url: null, metadata: {} }];

it("CodeBlock: language label, line numbers on long code, Copy → 'Copied ✓' and clipboard receives the exact code", async () => {
  const code = 'public class A {\n  int x = 1;\n  void f() {}\n  // c\n  String s = "a";\n}';
  const r = render(<CodeBlock code={code} lang="java" />);
  const out = textOf(r);
  expect(out).toContain("java");
  expect(out).toContain("Copy");
  expect(out).toContain("1\n2\n3\n4\n5\n6"); // line-number gutter
  expect(out).toContain(code); // highlighted spans rejoin to the exact source
  await act(async () => {
    press(r, "Copy code");
  });
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code);
  expect(textOf(r)).toContain("Copied ✓");
});

it("CodeBlock: short block has no line numbers", () => {
  const r = render(<CodeBlock code={"SELECT 1;"} lang="sql" />);
  expect(textOf(r)).toContain("SELECT 1;");
  expect(dump(r)).not.toContain("no-hide-descendants"); // the line-number gutter is absent
});

it("ReaderContent renders callouts, numbered-heading badges, list, table and code — content intact", () => {
  const prepared = prepareTopic(content(md), "Other title");
  const r = render(<ReaderContent blocks={prepared.blocks} />);
  const out = textOf(r);
  // callouts: labels verbatim + icons
  expect(out).toContain("2. Why is it used?");
  expect(out).toContain("💡");
  expect(out).toContain("5. Key Points to Remember");
  expect(out).toContain("⭐");
  // "1. What is Java?" is NOT a recognised label → a normal numbered heading (badge "1" + title), no 📘 box
  expect(out).toContain("What is Java?");
  expect(out).not.toContain("📘");
  // body content
  for (const t of ["fast", "portable", "one", "two", "int x = 1;", "Feature", "Typed", "Yes", "first", "second"]) expect(out).toContain(t);
});

it("ReaderContent: the leading heading equal to the topic title is not rendered", () => {
  const prepared = prepareTopic(content("# Java Basics\n\nHello there"), "java  basics");
  const out = textOf(render(<ReaderContent blocks={prepared.blocks} />));
  expect(out).not.toContain("Java Basics");
  expect(out).toContain("Hello there");
});

it("TableOfContents: collapsed by default, expands, and selecting an item reports its id", () => {
  const items = [
    { id: "h0", text: "Intro", depth: 0 as const },
    { id: "h1", text: "Details", depth: 1 as const },
    { id: "h2", text: "Summary", depth: 0 as const },
  ];
  const onSelect = jest.fn();
  const r = render(<TableOfContents items={items} accent={accent} variant="collapsible" onSelect={onSelect} />);
  expect(dump(r)).not.toContain("Details");
  press(r, "In this topic, 3 sections");
  expect(dump(r)).toContain("Details");
  press(r, "Jump to Details");
  expect(onSelect).toHaveBeenCalledWith("h1");
  expect(dump(r)).not.toContain("Jump to Summary"); // collapsed again after choosing
});

it("CompleteButton toggles between the two states and calls back", () => {
  const onToggle = jest.fn();
  const r = render(<CompleteButton completed={false} onToggle={onToggle} accent={accent} />);
  expect(dump(r)).toContain("Mark as Complete ✓");
  press(r, "Mark this topic as complete");
  expect(onToggle).toHaveBeenCalledTimes(1);
  act(() => r.update(<ReaderCtx.Provider value={ctx}><CompleteButton completed onToggle={onToggle} accent={accent} /></ReaderCtx.Provider>));
  expect(dump(r)).toContain("Completed");
  expect(dump(r)).toContain("Tap to undo");
});

it("TopicNavFooter shows both neighbours with a chapter hint only when crossing a chapter", () => {
  const onOpen = jest.fn();
  const r = render(<TopicNavFooter prev={{ title: "Loops", slug: "loops" }} next={{ title: "Arrays", slug: "arrays", chapterName: "Data Structures" }} onOpen={onOpen} />);
  const out = dump(r);
  expect(out).toContain("Loops");
  expect(out).toContain("Arrays");
  expect(out).toContain("Next chapter · ");
  expect(out).toContain("Data Structures");
  expect(out).not.toContain("Previous chapter");
  press(r, "Next topic: Arrays, in Data Structures");
  expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ slug: "arrays" }));
  expect(dump(render(<TopicNavFooter prev={null} next={null} onOpen={onOpen} />))).toBe("null");
});

it("ReaderHeader: real reading time + chapter chips; nothing invented for a locked topic", () => {
  const out = textOf(render(<ReaderHeader title="Variables" summary="Names for values" minutes={7} chapterName="Basics" accent={accent} />));
  expect(out).toContain("7 min read");
  expect(out).toContain("Basics");
  expect(out).toContain("Names for values");
  expect(textOf(render(<ReaderHeader title="T" accent={accent} />))).not.toContain("min read");
});
