import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { learningService } from "@/services/learning.service";
import { useAuthStore } from "@/store/authStore";

export const learningQueryKeys = {
  grids: ["learning", "grids"] as const,
  tree: (gridSlug: string) => ["learning", "tree", gridSlug] as const,
  topic: (gridSlug: string, topicSlug: string) => ["learning", "topic", gridSlug, topicSlug] as const,
  practice: (gridSlug: string, topicSlug: string) =>
    ["learning", "topic-practice", gridSlug, topicSlug] as const,
  codingProblem: (slug: string) => ["learning", "coding-problem", slug] as const,
  search: (q: string) => ["learning", "search", q] as const,
  bookmarks: (userId: string) => ["learning", "bookmarks", userId] as const,
};

export const useLearningGrids = () =>
  useQuery({ queryKey: learningQueryKeys.grids, queryFn: () => learningService.listGrids() });

export const useLearningTree = (gridSlug: string) =>
  useQuery({
    queryKey: learningQueryKeys.tree(gridSlug),
    queryFn: () => learningService.getTree(gridSlug),
    enabled: !!gridSlug,
  });

export const useLearningTopic = (gridSlug: string, topicSlug: string) =>
  useQuery({
    queryKey: learningQueryKeys.topic(gridSlug, topicSlug),
    queryFn: () => learningService.getTopic(gridSlug, topicSlug),
    enabled: !!gridSlug && !!topicSlug,
  });

export const useLearningSearch = (q: string) =>
  useQuery({
    queryKey: learningQueryKeys.search(q.trim()),
    queryFn: () => learningService.search(q),
    enabled: q.trim().length > 1,
  });

export const useTopicPractice = (gridSlug: string, topicSlug: string) =>
  useQuery({
    queryKey: learningQueryKeys.practice(gridSlug, topicSlug),
    queryFn: () => learningService.getTopicPractice(gridSlug, topicSlug),
    enabled: !!gridSlug && !!topicSlug,
  });

export const useCodingProblem = (slug: string) =>
  useQuery({
    queryKey: learningQueryKeys.codingProblem(slug),
    queryFn: () => learningService.getCodingProblem(slug),
    enabled: !!slug,
  });

export const useLearningBookmarks = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: learningQueryKeys.bookmarks(userId ?? ""),
    queryFn: () => learningService.listBookmarkedTopicIds(userId as string),
    enabled: !!userId,
  });
};

export const useToggleLearningBookmark = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ topicId, isBookmarked }: { topicId: string; isBookmarked: boolean }) =>
      learningService.setBookmark(userId as string, topicId, !isBookmarked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning", "bookmarks"] });
    },
  });
};
