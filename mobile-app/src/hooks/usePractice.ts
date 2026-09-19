import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { practiceService } from "@/services/practice.service";
import type { PracticeProblemsQuery } from "@/types/practice.types";

export const practiceQueryKeys = {
  categories: ["practice", "categories"] as const,
  problems: (q: PracticeProblemsQuery) => ["practice", "problems", q] as const,
  problem: (slug: string) => ["practice", "problem", slug] as const,
  submissions: (userId: string) => ["practice", "submissions", userId] as const,
  submission: (id: string) => ["practice", "submission", id] as const,
  interviewCategories: ["practice", "interview", "categories"] as const,
  interviewTopics: (c: string) => ["practice", "interview", "topics", c] as const,
  interviewTopic: (c: string, t: string) => ["practice", "interview", "topic", c, t] as const,
};

export const usePracticeCategories = () =>
  useQuery({ queryKey: practiceQueryKeys.categories, queryFn: () => practiceService.listCategories() });

export const usePracticeProblems = (query: PracticeProblemsQuery) =>
  useInfiniteQuery({
    queryKey: practiceQueryKeys.problems(query),
    queryFn: ({ pageParam }) => practiceService.listProblems(query, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0);
      return last.items.length > 0 && loaded < last.total ? pages.length : undefined;
    },
  });

export const usePracticeProblem = (slug: string) =>
  useQuery({
    queryKey: practiceQueryKeys.problem(slug),
    queryFn: () => practiceService.getProblem(slug),
    enabled: !!slug,
  });

export const useMySubmissions = (userId: string | undefined) =>
  useInfiniteQuery({
    queryKey: practiceQueryKeys.submissions(userId ?? ""),
    queryFn: ({ pageParam }) => practiceService.listSubmissions(userId as string, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.rows.length, 0);
      return last.rows.length > 0 && loaded < last.total ? pages.length : undefined;
    },
    enabled: !!userId,
  });

export const useSubmission = (id: string) =>
  useQuery({
    queryKey: practiceQueryKeys.submission(id),
    queryFn: () => practiceService.getSubmission(id),
    enabled: !!id,
  });

export const useInterviewCategories = () =>
  useQuery({
    queryKey: practiceQueryKeys.interviewCategories,
    queryFn: () => practiceService.listInterviewCategories(),
  });

export const useInterviewTopics = (categorySlug: string) =>
  useQuery({
    queryKey: practiceQueryKeys.interviewTopics(categorySlug),
    queryFn: () => practiceService.listInterviewTopics(categorySlug),
    enabled: !!categorySlug,
  });

export const useInterviewTopic = (categorySlug: string, topicSlug: string) =>
  useQuery({
    queryKey: practiceQueryKeys.interviewTopic(categorySlug, topicSlug),
    queryFn: () => practiceService.getInterviewTopic(categorySlug, topicSlug),
    enabled: !!categorySlug && !!topicSlug,
  });
