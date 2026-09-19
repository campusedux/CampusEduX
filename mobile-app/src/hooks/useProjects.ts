import { userScopedKey } from "@/lib/queryClient";
import { useState, useCallback } from "react";
import { Linking, Platform } from "react-native";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { projectService } from "@/services/project.service";
import { useAuthStore } from "@/store/authStore";
import { academicFromUser, academicKey } from "@/lib/personalization";
import type { ProjectDetail, ProjectFilters } from "@/types";

export const projectQueryKeys = {
  all: (filters: Partial<ProjectFilters>, academic = "") => ["projects", "all", academic, filters] as const,
  category: (categoryId: string) => ["projects", "category", categoryId] as const,
  search: (query: string) => ["projects", "search", query] as const,
  detail: (projectId: string) => ["projects", "detail", projectId] as const,
  downloadableFiles: (projectId: string) => ["projects", "downloadable-files", projectId] as const,
  similar: (projectId: string) => ["projects", "similar", projectId] as const,
  reviews: (projectId: string) => ["projects", "reviews", projectId] as const,
  wishlist: ["wishlist"] as const,
  purchased: ["purchased-projects"] as const,
  downloads: ["download-history"] as const,
};

export const useAllProjects = (filters: Partial<ProjectFilters>) => {
  const academic = academicFromUser(useAuthStore((s) => s.user));
  return useInfiniteQuery({
    queryKey: projectQueryKeys.all(filters, academicKey(academic)),
    queryFn: ({ pageParam = 0 }) => projectService.getAllProjects(filters, pageParam, academic),
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    initialPageParam: 0,
  });
};

export const useCategoryProjects = (categoryId: string) =>
  useQuery({
    queryKey: projectQueryKeys.category(categoryId),
    queryFn: () => projectService.getCategoryProjects(categoryId),
    enabled: !!categoryId,
  });

export const useSearchProjects = (query: string) =>
  useQuery({
    queryKey: projectQueryKeys.search(query),
    queryFn: () => projectService.searchProjects(query),
    enabled: query.trim().length > 1,
  });

export const useProjectDetail = (projectId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: projectQueryKeys.detail(projectId),
    queryFn: () => projectService.getProjectDetail(projectId, userId),
    enabled: !!projectId,
  });
};

export const useDownloadableFiles = (
  projectId: string,
  detail: Pick<ProjectDetail, "sourceCodeSizeMB" | "documentationSizeMB"> | undefined
) =>
  useQuery({
    queryKey: projectQueryKeys.downloadableFiles(projectId),
    queryFn: () => projectService.getDownloadableFiles(projectId, detail as Pick<ProjectDetail, "sourceCodeSizeMB" | "documentationSizeMB">),
    enabled: !!projectId && !!detail,
  });

export const useSimilarProjects = (projectId: string, categoryId: string | undefined) =>
  useQuery({
    queryKey: projectQueryKeys.similar(projectId),
    queryFn: () => projectService.getSimilarProjects(projectId, categoryId as string),
    enabled: !!categoryId,
  });

export const useReviews = (projectId: string) =>
  useQuery({ queryKey: projectQueryKeys.reviews(projectId), queryFn: () => projectService.getReviews(projectId) });

export const useAddReview = (projectId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string }) =>
      projectService.addReview(projectId, userId as string, rating, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.reviews(projectId) });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) });
    },
  });
};

export const useWishlist = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(projectQueryKeys.wishlist, userId),
    queryFn: () => projectService.getWishlist(userId as string),
    enabled: !!userId,
  });
};

export const useToggleWishlist = (projectId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (isCurrentlyWishlisted: boolean) =>
      isCurrentlyWishlisted
        ? projectService.removeFromWishlist(projectId, userId as string)
        : projectService.addToWishlist(projectId, userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.wishlist });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) });
    },
  });
};

export const usePurchasedProjects = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(projectQueryKeys.purchased, userId),
    queryFn: () => projectService.getPurchasedProjects(userId as string),
    enabled: !!userId,
  });
};

export const useDownloadHistory = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(projectQueryKeys.downloads, userId),
    queryFn: () => projectService.getDownloadHistory(userId as string),
    enabled: !!userId,
  });
};

export const useRecordDownload = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ projectId, fileLabel, fileSizeMB }: { projectId: string; fileLabel: string; fileSizeMB: number }) =>
      projectService.recordDownload(userId as string, projectId, fileLabel, fileSizeMB),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectQueryKeys.downloads }),
  });
};

/**
 * Downloads a project file to local storage and opens the native
 * share/save sheet, then records it in download history. Used by
 * DownloadProjectScreen (Module 3) and DownloadFilesScreen (Module 7).
 */
export function useDownloadFile() {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const recordDownload = useRecordDownload();

  const downloadFile = useCallback(
    async (params: { projectId: string; fileName: string; label: string; url: string; sizeMB: number }) => {
      if (!params.url) {
        throw new Error("This file isn't available right now. Please try again later or contact support.");
      }
      setDownloadingKey(params.fileName);
      try {
        if (Platform.OS === "web") {
          // FileSystem/Sharing are native-only: hand the signed URL to the browser.
          await Linking.openURL(params.url);
          await recordDownload.mutateAsync({ projectId: params.projectId, fileLabel: params.label, fileSizeMB: params.sizeMB });
          return params.url;
        }
        const destination = `${FileSystem.documentDirectory}${params.fileName}`;
        const { uri } = await FileSystem.downloadAsync(params.url, destination);
        await recordDownload.mutateAsync({ projectId: params.projectId, fileLabel: params.label, fileSizeMB: params.sizeMB });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        }
        return uri;
      } finally {
        setDownloadingKey(null);
      }
    },
    [recordDownload]
  );

  return { downloadFile, downloadingKey };
}
