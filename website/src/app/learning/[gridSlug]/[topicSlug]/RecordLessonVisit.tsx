"use client";

import { useEffect } from "react";
import { learningProgressService, type LessonRef } from "@/lib/learningProgress";

/**
 * Invisible: records this lesson as "last visited" (device-only progress —
 * see src/lib/learningProgress/store.ts) so Home can offer "Continue
 * learning". Renders nothing.
 */
export function RecordLessonVisit(lesson: LessonRef) {
  const { gridSlug, gridName, topicSlug, topicTitle, sectionName } = lesson;
  useEffect(() => {
    learningProgressService.recordVisit({ gridSlug, gridName, topicSlug, topicTitle, sectionName });
  }, [gridSlug, gridName, topicSlug, topicTitle, sectionName]);
  return null;
}

export default RecordLessonVisit;
