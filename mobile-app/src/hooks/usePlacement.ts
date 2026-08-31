import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placementService } from "@/services/placement.service";
import { useAuthStore } from "@/store/authStore";
import type { AptitudeCategory, TestAttemptAnswer } from "@/types";

export const placementQueryKeys = {
  dashboard: ["placement", "dashboard"] as const,
  aptitudeTopics: (category: AptitudeCategory) => ["placement", "aptitude-topics", category] as const,
  tests: (filters: { category?: string; companyId?: string }) => ["placement", "tests", filters] as const,
  testDetail: (testId: string) => ["placement", "test", testId] as const,
  testQuestions: (testId: string) => ["placement", "test-questions", testId] as const,
  testResult: (attemptId: string) => ["placement", "test-result", attemptId] as const,
  performance: ["placement", "performance"] as const,
  dsaTopics: ["placement", "dsa-topics"] as const,
  dsaProblems: (topicId: string) => ["placement", "dsa-problems", topicId] as const,
  dsaProblemDetail: (problemId: string) => ["placement", "dsa-problem", problemId] as const,
  hrQuestions: (category?: string) => ["placement", "hr-questions", category] as const,
  favoriteQuestions: ["placement", "favorite-questions"] as const,
  companies: ["placement", "companies"] as const,
  companyQuestions: (companyId: string) => ["placement", "company-questions", companyId] as const,
  companyPerformance: (companyId: string) => ["placement", "company-performance", companyId] as const,
};

export const usePlacementDashboard = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.dashboard,
    queryFn: () => placementService.getDashboardSummary(userId as string),
    enabled: !!userId,
  });
};

export const useAptitudeTopics = (category: AptitudeCategory) =>
  useQuery({ queryKey: placementQueryKeys.aptitudeTopics(category), queryFn: () => placementService.getAptitudeTopics(category) });

export const usePracticeTests = (filters: { category?: string; companyId?: string } = {}) =>
  useQuery({ queryKey: placementQueryKeys.tests(filters), queryFn: () => placementService.getPracticeTests(filters) });

export const useTestDetail = (testId: string) =>
  useQuery({ queryKey: placementQueryKeys.testDetail(testId), queryFn: () => placementService.getTestDetail(testId), enabled: !!testId });

export const useTestQuestions = (testId: string) =>
  useQuery({ queryKey: placementQueryKeys.testQuestions(testId), queryFn: () => placementService.getTestQuestions(testId), enabled: !!testId });

export const useSubmitTestAttempt = (testId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ answers, timeTakenSeconds }: { answers: TestAttemptAnswer[]; timeTakenSeconds: number }) =>
      placementService.submitTestAttempt(userId as string, testId, answers, timeTakenSeconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placementQueryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: placementQueryKeys.performance });
    },
  });
};

export const useTestResult = (attemptId: string) =>
  useQuery({ queryKey: placementQueryKeys.testResult(attemptId), queryFn: () => placementService.getTestResult(attemptId), enabled: !!attemptId });

export const usePerformanceAnalysis = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.performance,
    queryFn: () => placementService.getPerformanceAnalysis(userId as string),
    enabled: !!userId,
  });
};

export const useDSATopics = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: placementQueryKeys.dsaTopics, queryFn: () => placementService.getDSATopics(userId) });
};

export const useDSAProblems = (topicId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.dsaProblems(topicId),
    queryFn: () => placementService.getDSAProblems(topicId, userId),
    enabled: !!topicId,
  });
};

export const useDSAProblemDetail = (problemId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.dsaProblemDetail(problemId),
    queryFn: () => placementService.getDSAProblemDetail(problemId, userId),
    enabled: !!problemId,
  });
};

export function useRunCode() {
  const [isRunning, setIsRunning] = useState(false);
  const run = useCallback(async (language: string, code: string, stdin = "") => {
    setIsRunning(true);
    try {
      return await placementService.runCode(language, code, stdin);
    } finally {
      setIsRunning(false);
    }
  }, []);
  return { run, isRunning };
}

/** Runs a submission against every test case (see placementService.judgeSolution). */
export function useJudgeSolution() {
  const [isJudging, setIsJudging] = useState(false);
  const judge = useCallback(
    async (language: string, code: string, cases: { input: string; output: string }[]) => {
      setIsJudging(true);
      try {
        return await placementService.judgeSolution(language, code, cases);
      } finally {
        setIsJudging(false);
      }
    },
    []
  );
  return { judge, isJudging };
}

export const useMarkProblemSolved = (problemId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: () => placementService.markProblemSolved(userId as string, problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placementQueryKeys.dsaTopics });
      queryClient.invalidateQueries({ queryKey: placementQueryKeys.dsaProblemDetail(problemId) });
      queryClient.invalidateQueries({ queryKey: placementQueryKeys.dashboard });
    },
  });
};

export const useHRQuestions = (category?: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.hrQuestions(category),
    queryFn: () => placementService.getHRQuestions(userId, category),
  });
};

export const useToggleFavoriteQuestion = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ questionId, isCurrentlyFavorite }: { questionId: string; isCurrentlyFavorite: boolean }) =>
      placementService.toggleFavoriteQuestion(userId as string, questionId, isCurrentlyFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placementQueryKeys.favoriteQuestions });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "placement" && q.queryKey[1] === "hr-questions" });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "placement" && q.queryKey[1] === "company-questions" });
    },
  });
};

export const useFavoriteQuestions = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.favoriteQuestions,
    queryFn: () => placementService.getFavoriteQuestions(userId as string),
    enabled: !!userId,
  });
};

export const usePlacementCompanies = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: placementQueryKeys.companies, queryFn: () => placementService.getCompanies(userId) });
};

export const useCompanyQuestions = (companyId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.companyQuestions(companyId),
    queryFn: () => placementService.getCompanyQuestions(companyId, userId),
    enabled: !!companyId,
  });
};

export const useCompanyPerformance = (companyId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: placementQueryKeys.companyPerformance(companyId),
    queryFn: () => placementService.getCompanyPerformance(userId as string, companyId),
    enabled: !!userId && !!companyId,
  });
};
