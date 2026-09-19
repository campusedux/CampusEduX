import { useEffect } from "react";
import { AppState } from "react-native";
import { READING_ACTIVITY_SECONDS } from "@/learning/progress/progressLogic";
import { useProgressActions, useProgressUserId } from "@/learning/progress/progressStore";

/**
 * Streak rule, reader side: after the learner has stayed on a topic for
 * READING_ACTIVITY_SECONDS (60 s) with the app in the foreground, today counts
 * as an active day. Resets whenever the topic changes / the screen unmounts.
 */
export function useReadingActivity(topicId: string | undefined, enabled: boolean) {
  const { recordReadingActivity } = useProgressActions();
  // Keyed by user so a pending 60 s timer can never credit a different account after a switch.
  const userId = useProgressUserId();
  useEffect(() => {
    if (!enabled || !topicId || !userId) return;
    const id = setTimeout(() => {
      if (AppState.currentState === "active") recordReadingActivity();
    }, READING_ACTIVITY_SECONDS * 1000);
    return () => clearTimeout(id);
  }, [topicId, enabled, userId, recordReadingActivity]);
}
