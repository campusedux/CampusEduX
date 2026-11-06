import { getInterviewTopicDetail } from "@/lib/interviewQuestions";
import { renderOgCard } from "@/lib/ogImage";

export const alt = "CampusEduX interview questions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ category: string; topic: string }> }) {
  const { category, topic } = await params;
  const detail = await getInterviewTopicDetail(category, topic).catch(() => null);
  if (!detail?.questions.length) return renderOgCard({ title: "Interview Questions", eyebrow: "CampusEduX" });
  return renderOgCard({ title: `${detail.topic.name} Interview Questions`, eyebrow: detail.category.name });
}
