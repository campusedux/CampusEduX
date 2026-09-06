import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placementService } from "@/services/placement.service";
import { useAuthStore } from "@/store/authStore";
import type { TestAttemptAnswer } from "@/types";

/**
 * Hooks for the native mock-test-taking flow (TestInstruction → LiveTest →
 * TestResult → PerformanceAnalysis), reused by Learning topic practice.
 */
export const placementQueryKeys = {
  testDetail: (testId: string) => ["placement", "test", testId] as const,
  testQuestions: (testId: string) => ["placement", "test-questions", testId] as const,
  testResult: (attemptId: string) => ["placement", "test-result", attemptId] as const,
  performance: ["placement", "performance"] as const,
};

export const useTestDetail = (testId: string) =>
  useQuery({
    queryKey: placementQueryKeys.testDetail(testId),
    queryFn: () => placementService.getTestDetail(testId),
    enabled: !!testId,
  });

export const useTestQuestions = (testId: string) =>
  useQuery({
    queryKey: placementQueryKeys.testQuestions(testId),
    queryFn: () => placementService.getTestQuestions(testId),
    enabled: !!testId,
  });

export const useSubmitTestAttempt = (testId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ answers, timeTakenSeconds }: { answers: TestAttemptAnswer[]; timeTakenSeconds: number }) =>
      placementService.submitTestAttempt(userId as string, testId, answers, timeTakenSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placementQueryKeys.performance });
    },
  });
};

export const useTestResult = (attemptId: string) =>
  useQuery({
    queryKey: placementQueryKeys.testResult(attemptId),
    queryFn: () => placementService.getTestResult(attemptId),
    enabled: !!attemptId,
  });

export const usePerformanceAnalysis = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.performance,
    queryFn: () => placementService.getPerformanceAnalysis(userId as string),
    enabled: !!userId,
  });
};
