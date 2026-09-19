import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { jobService } from "@/services/job.service";
import { useAuthStore } from "@/store/authStore";
import { academicFromUser, academicKey } from "@/lib/personalization";
import type { JobFilters, JobAlertPreferences } from "@/types";

export const jobQueryKeys = {
  all: (filters: Partial<JobFilters>, academic = "") => ["jobs", "all", academic, filters] as const,
  recommended: (academic = "") => ["jobs", "recommended", academic] as const,
  companies: (query: string) => ["companies", query] as const,
  companyDetail: (companyId: string) => ["companies", "detail", companyId] as const,
  companyJobs: (companyId: string) => ["companies", "jobs", companyId] as const,
  detail: (jobId: string) => ["jobs", "detail", jobId] as const,
  recruiter: (jobId: string) => ["jobs", "recruiter", jobId] as const,
  saved: ["jobs", "saved"] as const,
  categoryCounts: ["jobs", "category-counts"] as const,
  dashboardStats: ["jobs", "dashboard-stats"] as const,
  resumes: ["resumes"] as const,
  applied: ["applications"] as const,
  applicationDetail: (id: string) => ["applications", "detail", id] as const,
  jobAlerts: ["job-alerts"] as const,
};

export const useAllJobs = (filters: Partial<JobFilters>) => {
  const academic = academicFromUser(useAuthStore((s) => s.user));
  return useInfiniteQuery({
    queryKey: jobQueryKeys.all(filters, academicKey(academic)),
    queryFn: ({ pageParam = 0 }) => jobService.getAllJobs(filters, pageParam, academic),
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined),
    initialPageParam: 0,
  });
};

export const useRecommendedJobs = () => {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  return useQuery({
    queryKey: jobQueryKeys.recommended(academicKey(academicFromUser(user))),
    queryFn: () => jobService.getRecommendedJobs(userId as string),
    enabled: !!userId,
  });
};

export const useJobCategoryCounts = () =>
  useQuery({ queryKey: jobQueryKeys.categoryCounts, queryFn: jobService.getCategoryCounts, staleTime: 60_000 });

export const useJobDashboardStats = () =>
  useQuery({ queryKey: jobQueryKeys.dashboardStats, queryFn: jobService.getDashboardStats, staleTime: 60_000 });

export const useCompanies = (query = "") =>
  useQuery({ queryKey: jobQueryKeys.companies(query), queryFn: () => jobService.getCompanies(query) });

export const useCompanyDetail = (companyId: string) =>
  useQuery({ queryKey: jobQueryKeys.companyDetail(companyId), queryFn: () => jobService.getCompanyDetails(companyId), enabled: !!companyId });

export const useCompanyJobs = (companyId: string) =>
  useQuery({ queryKey: jobQueryKeys.companyJobs(companyId), queryFn: () => jobService.getCompanyJobs(companyId), enabled: !!companyId });

export const useJobDetail = (jobId: string) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: jobQueryKeys.detail(jobId), queryFn: () => jobService.getJobDetail(jobId, userId), enabled: !!jobId });
};

export const useRecruiterForJob = (jobId: string) =>
  useQuery({ queryKey: jobQueryKeys.recruiter(jobId), queryFn: () => jobService.getRecruiterForJob(jobId), enabled: !!jobId });

export const useToggleSavedJob = (jobId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (isCurrentlySaved: boolean) => jobService.toggleSavedJob(jobId, userId as string, isCurrentlySaved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.saved });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.detail(jobId) });
    },
  });
};

export const useSavedJobs = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: jobQueryKeys.saved, queryFn: () => jobService.getSavedJobs(userId as string), enabled: !!userId });
};

export const useResumes = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: jobQueryKeys.resumes, queryFn: () => jobService.getResumes(userId as string), enabled: !!userId });
};

/**
 * Wraps expo-document-picker + the resume upload service call so
 * ResumeUploadScreen only has to call one function.
 */
export function usePickAndUploadResume() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;

    const file = result.assets[0];
    setIsUploading(true);
    try {
      const uploaded = await jobService.uploadResume(userId as string, file.uri, file.name);
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.resumes });
      return uploaded;
    } finally {
      setIsUploading(false);
    }
  }, [userId, queryClient]);

  return { pickAndUpload, isUploading };
}

export const useApplyToJob = (jobId: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (resumeId: string) => jobService.applyToJob(userId as string, jobId, resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.applied });
      queryClient.invalidateQueries({ queryKey: jobQueryKeys.detail(jobId) });
    },
  });
};

export const useAppliedJobs = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: jobQueryKeys.applied, queryFn: () => jobService.getAppliedJobs(userId as string), enabled: !!userId });
};

export const useApplicationDetail = (applicationId: string) =>
  useQuery({
    queryKey: jobQueryKeys.applicationDetail(applicationId),
    queryFn: () => jobService.getApplicationDetail(applicationId),
    enabled: !!applicationId,
  });

export const useJobAlertPreferences = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: jobQueryKeys.jobAlerts,
    queryFn: () => jobService.getJobAlertPreferences(userId as string),
    enabled: !!userId,
  });
};

export const useSaveJobAlertPreferences = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (prefs: JobAlertPreferences) => jobService.saveJobAlertPreferences(userId as string, prefs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: jobQueryKeys.jobAlerts }),
  });
};
