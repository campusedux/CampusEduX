import React from "react";
import TestRenderer, { act } from "react-test-renderer";

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
jest.mock("@/theme/fonts", () => ({ useLearningFonts: () => true }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: ({ children }: any) => children }));

import { ChapterHeader } from "@/components/learning/ChapterAccordion";
import { CourseHero } from "@/components/learning/CourseHero";
import { TopicRow } from "@/components/learning/TopicRow";
import { COURSE_ACCENTS, accentTokens } from "@/theme/courseAccents";

const accent = accentTokens(COURSE_ACCENTS.dbms, "light");
const topic = { id: "t1", title: "What is a Database?", slug: "what-is-a-database", short_description: "The basics of storing data.", is_premium: true };
const mounted: TestRenderer.ReactTestRenderer[] = [];
const render = (el: React.ReactElement) => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(el);
  });
  mounted.push(r);
  return r;
};
// Unmount so running Animated timers (progress fill, fade-in) stop before Jest tears down.
afterEach(() => {
  act(() => {
    mounted.splice(0).forEach((r) => r.unmount());
  });
});
const texts = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());

it("TopicRow renders number / check / current states, premium lock and bookmark", () => {
  const base = { topic, number: 3, isFirst: false, isLast: true, bookmarked: false, canBookmark: true, accent, onOpen: jest.fn(), onToggleBookmark: jest.fn() };
  const plain = texts(render(<TopicRow {...base} completed={false} current={false} />));
  expect(plain).toContain("What is a Database?");
  expect(plain).toContain("Topic 3, What is a Database?, not started, premium");
  expect(plain).toContain("Bookmark What is a Database?");

  expect(texts(render(<TopicRow {...base} completed current={false} />))).toContain("completed");
  const cur = texts(render(<TopicRow {...base} completed={false} current />));
  expect(cur).toContain("in progress");
  expect(cur).toContain("Continue from here");
});

it("TopicRow hides the bookmark button when signed out", () => {
  const out = texts(render(<TopicRow topic={topic} number={1} isFirst isLast={false} completed={false} current={false} bookmarked={false} canBookmark={false} accent={accent} onOpen={jest.fn()} onToggleBookmark={jest.fn()} />));
  expect(out).not.toContain("Bookmark What");
});

it("ChapterHeader shows number, counts and progress; empty chapter is disabled", () => {
  const chapter = { id: "s1", index: 1, name: "Relational Model", topics: [], total: 12, done: 3, percent: 25 };
  const out = texts(render(<ChapterHeader chapter={chapter} open accent={accent} onToggle={jest.fn()} />));
  expect(out).toContain("Relational Model");
  expect(out).toContain("12 topics");
  expect(out).toContain("3 done");
  expect(out).toContain("Chapter 2");
  const empty = texts(render(<ChapterHeader chapter={{ ...chapter, total: 0, done: 0, percent: 0 }} open={false} accent={accent} onToggle={jest.fn()} />));
  expect(empty).toContain("No topics yet");
});

it("CourseHero: Start/Continue/Review label, hides time + button when data is missing", () => {
  const props = { title: "DBMS & SQL", description: "Databases from zero.", accent, chapterCount: 20, topicCount: 294, timeLabel: "~39 hrs", done: 0, percent: 0, onBack: jest.fn(), onCta: jest.fn() };
  expect(texts(render(<CourseHero {...props} mode="start" />))).toContain("Start course");
  expect(texts(render(<CourseHero {...props} mode="continue" done={5} percent={2} />))).toContain("Continue");
  expect(texts(render(<CourseHero {...props} mode="review" />))).toContain("Review course");
  expect(texts(render(<CourseHero {...props} mode="start" />))).toContain("~39 hrs");
  const none = texts(render(<CourseHero {...props} topicCount={0} timeLabel={null} mode={null} />));
  expect(none).not.toContain("hrs");
  expect(none).not.toContain("Start course");
});
