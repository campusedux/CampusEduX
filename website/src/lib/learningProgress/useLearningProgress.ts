"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  computeStreak,
  courseProgress,
  dailyGoalInfo,
  deriveBadges,
  firstIncomplete,
  recentDays,
  totalCompleted,
  type LearningProgressState,
} from "./model";
import { getServerSnapshot, getSnapshot, learningProgressService, subscribe } from "./store";

/**
 * The single entry point UI code uses for learning progress: lesson
 * completion, last visited lesson ("continue learning"), streak, daily goal,
 * and derived badges.
 *
 * DEVICE-ONLY for now (localStorage via `store.ts`) — see that file for how to
 * move it to Supabase without touching components.
 *
 * `ready` is false during the server render and the first client render (the
 * stored state isn't readable there); render nothing progress-specific until
 * it flips, so server and client HTML always match.
 */
export function useLearningProgress() {
  const state: LearningProgressState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return useMemo(() => {
    const now = new Date();
    return {
      ready,
      state,
      lastVisited: state.lastVisited,
      streak: { ...computeStreak(state.activity, now), best: state.bestStreak },
      today: dailyGoalInfo(state, now),
      week: recentDays(state, now, 7),
      totalCompleted: totalCompleted(state),
      badges: deriveBadges(state, now),
      isComplete: (gridSlug: string, topicSlug: string) => !!state.courses[gridSlug]?.completed[topicSlug],
      courseProgress: (gridSlug: string, totalLessons: number) => courseProgress(state, gridSlug, totalLessons),
      firstIncomplete: (gridSlug: string, orderedTopicSlugs: string[]) => firstIncomplete(state, gridSlug, orderedTopicSlugs),
      ...learningProgressService,
    };
  }, [state, ready]);
}

export type LearningProgress = ReturnType<typeof useLearningProgress>;
