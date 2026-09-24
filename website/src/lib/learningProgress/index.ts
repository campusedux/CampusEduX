/**
 * Learning progress (DEVICE-ONLY, localStorage) — import from here.
 * - `useLearningProgress()` for components
 * - `learningProgressService` for imperative calls outside React
 * - pure rules/types from `./model`
 */
export { useLearningProgress } from "./useLearningProgress";
export type { LearningProgress } from "./useLearningProgress";
export { learningProgressService, PROGRESS_STORAGE_KEY } from "./store";
export type {
  LearningProgressState,
  LessonRef,
  LastVisited,
  StreakInfo,
  DailyGoalInfo,
  CourseProgressInfo,
  Badge,
} from "./model";
