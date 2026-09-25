import { userScopedKey } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { myProjectsService } from "@/services/myProjects.service";
import { useAuthStore } from "@/store/authStore";

type OwnershipFilter = "purchased" | "wishlist" | "collections";

export const myProjectsQueryKeys = {
  owned: (filter: OwnershipFilter) => ["my-projects", "owned", filter] as const,
  detail: (orderId: string) => ["my-projects", "detail", orderId] as const,
  files: (projectId: string, category: "main" | "documentation") => ["my-projects", "files", projectId, category] as const,
  versions: (projectId: string) => ["my-projects", "versions", projectId] as const,
};

export const useOwnedProjects = (filter: OwnershipFilter) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(myProjectsQueryKeys.owned(filter), userId),
    queryFn: () => myProjectsService.getOwnedProjects(userId as string, filter),
    enabled: !!userId,
  });
};

export const useOwnedProjectDetail = (orderId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(myProjectsQueryKeys.detail(orderId), userId),
    queryFn: () => myProjectsService.getOwnedProjectDetail(orderId, userId as string),
    enabled: !!orderId && !!userId,
  });
};

export const useProjectFiles = (projectId: string, category: "main" | "documentation") =>
  useQuery({
    queryKey: myProjectsQueryKeys.files(projectId, category),
    queryFn: () => myProjectsService.getProjectFiles(projectId, category),
    enabled: !!projectId,
  });

export const useVersionHistory = (projectId: string) =>
  useQuery({
    queryKey: myProjectsQueryKeys.versions(projectId),
    queryFn: () => myProjectsService.getVersionHistory(projectId),
    enabled: !!projectId,
  });

export const useMarkVersionUpdated = (orderId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (newVersion: string) => myProjectsService.markVersionUpdated(orderId, userId as string, newVersion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myProjectsQueryKeys.detail(orderId) }),
  });
};
