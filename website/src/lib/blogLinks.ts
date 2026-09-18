/**
 * Small, hand-curated internal-linking glossary for blog article bodies.
 *
 * Unlike `topicLinks.ts` (auto-built from a Learning grid's own topic tree),
 * blog posts aren't scoped to one grid, so this is a short, manually reviewed
 * list of terms that genuinely appear in the current posts' prose, each
 * pointing at a real, existing route. Reuses the same `TopicLinkEntry` shape
 * and the same `Markdown` auto-linking pass (first mention only, one link per
 * `topicKey`, page-wide cap) that Learning topic pages already use — no new
 * linking mechanism, just a different glossary source. Deliberately short:
 * the brief is "a small number of contextual links," not a link farm.
 */
import type { TopicLinkEntry } from "@/lib/topicLinks";

export const BLOG_TOPIC_LINKS: TopicLinkEntry[] = [
  {
    terms: ["machine learning", "deep learning", "neural network", "neural networks"],
    href: "/learning/ai-ml-notes",
    label: "AI/ML Notes",
    topicKey: "ai-ml-notes",
  },
  {
    terms: ["generative ai"],
    href: "/learning/generative-ai",
    label: "Generative AI Tutorial",
    topicKey: "generative-ai",
  },
  {
    terms: ["python"],
    href: "/learning/python-tutorial",
    label: "Python Tutorial",
    topicKey: "python-tutorial",
  },
  {
    terms: ["jobs"],
    href: "/jobs",
    label: "Jobs",
    topicKey: "jobs",
  },
  {
    terms: ["projects", "project"],
    href: "/projects",
    label: "Projects",
    topicKey: "projects",
  },
];
