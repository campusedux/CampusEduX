import type { LearningContentBlock } from "@/lib/learning.types";
import { classifyLessonHeading } from "@/lib/lessonSections";
import type { TopicLinkEntry, TopicLinkState } from "@/lib/topicLinks";
import { Markdown, slugId } from "./Markdown";
import { LessonHeading, LessonSectionFrame } from "./LessonSection";
import { TopicDiagrams } from "./TopicDiagrams";

/**
 * One lesson content block: its own heading (as <h2>) + body. A block whose
 * heading is "Practice Problems" / "Key Points" (Java keeps its practice
 * questions in a separate block) is framed as that card, heading included;
 * every other block renders as before, with the lesson section treatment
 * applied inside its Markdown.
 */
export function LessonBlock({
  block,
  topicLinks,
  linkState,
}: {
  block: Pick<LearningContentBlock, "heading" | "body" | "content_format"> & Partial<Pick<LearningContentBlock, "metadata">>;
  topicLinks?: TopicLinkEntry[];
  linkState?: TopicLinkState;
}) {
  const kind = block.heading && block.content_format !== "plain" ? classifyLessonHeading(block.heading) : null;
  if (kind === "practice" || kind === "keypoints") {
    return (
      <LessonSectionFrame kind={kind}>
        <LessonHeading as="h2" id={slugId(block.heading)} kind={kind} number={null} framed>
          {block.heading}
        </LessonHeading>
        <Markdown source={block.body} topicLinks={topicLinks} linkState={linkState} callouts sectionBody={kind} />
        <TopicDiagrams metadata={block.metadata} />
      </LessonSectionFrame>
    );
  }
  return (
    <>
      {block.heading ? (
        <h2 id={slugId(block.heading)} className="mb-3 scroll-mt-24 text-2xl font-bold tracking-tight text-ink">
          {block.heading}
        </h2>
      ) : null}
      {block.content_format === "plain" ? (
        <p className="whitespace-pre-line leading-8 text-ink-muted">{block.body}</p>
      ) : (
        <Markdown source={block.body} topicLinks={topicLinks} linkState={linkState} callouts sections />
      )}
      <TopicDiagrams metadata={block.metadata} />
    </>
  );
}

export default LessonBlock;
