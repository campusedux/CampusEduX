import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import { resumeService } from "@/services/resume.service";
import { resumeAssistService, type AssistRequestInput } from "@/services/resumeAssist.service";
import { useAuthStore } from "@/store/authStore";
import type {
  ResumePersonalDetails,
  ResumeEducationEntry,
  ResumeSkills,
  ResumeFreeformSectionKey,
  ResumeTemplate,
  ResumeProjectCandidate,
  ResumeContent,
  ResumeDesign,
} from "@/types";
import { demoResume } from "@/data/demoResumes";

export const resumeQueryKeys = {
  list: ["resumes-builder"] as const,
  detail: (id: string) => ["resumes-builder", "detail", id] as const,
  atsScore: (id: string) => ["resumes-builder", "ats", id] as const,
  downloadHistory: ["resumes-builder", "downloads"] as const,
  myCustomProjects: ["resumes-builder", "my-custom-projects"] as const,
  templateCatalog: ["resumes-builder", "templates"] as const,
};

/** The admin-managed template catalog — same source of truth the admin panel and website read. */
export const useTemplateCatalog = () =>
  useQuery({ queryKey: resumeQueryKeys.templateCatalog, queryFn: () => resumeService.getTemplateCatalog(), staleTime: 5 * 60 * 1000 });

export const useResumeList = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({ queryKey: resumeQueryKeys.list, queryFn: () => resumeService.getResumes(userId as string), enabled: !!userId });
};

export const useResumeDetail = (resumeId: string) =>
  useQuery({ queryKey: resumeQueryKeys.detail(resumeId), queryFn: () => resumeService.getResumeDetail(resumeId), enabled: !!resumeId });

export const useCreateResume = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (template: ResumeTemplate) => resumeService.createResume(userId as string, template),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list }),
  });
};

export const useUpdateTemplate = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (template: ResumeTemplate) => resumeService.updateTemplate(resumeId, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) });
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list });
    },
  });
};

export const useUpdatePersonalDetails = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (details: ResumePersonalDetails) => resumeService.updatePersonalDetails(resumeId, details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) });
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list });
    },
  });
};

export const useUpdateEducation = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (education: ResumeEducationEntry[]) => resumeService.updateEducation(resumeId, education),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

export const useUpdateSkills = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skills: ResumeSkills) => resumeService.updateSkills(resumeId, skills),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

/** Create a résumé pre-filled with a template's demo persona (flagged is_demo). */
export const useCreateResumeFromDemo = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (template: ResumeTemplate) => {
      const demo = demoResume(template);
      return resumeService.createResumeFromDemo(userId as string, template, { personalDetails: demo.personalDetails, content: demo.content });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list }),
  });
};

/** The block-list editor's autosave — writes the whole structured `content`. */
export const useUpdateResumeContent = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: ResumeContent) => resumeService.updateContent(resumeId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

export const useSetResumeDemoFlag = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isDemo: boolean) => resumeService.setDemoFlag(resumeId, isDemo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

export const useClearResumeContent = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => resumeService.clearContent(resumeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

export const useUpdateResumeDesign = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (design: ResumeDesign) => resumeService.updateDesign(resumeId, design),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

export const useMatchResumeToJd = (resumeId: string) =>
  useMutation({ mutationFn: (jdText: string) => resumeService.matchJd(resumeId, jdText) });

export const useParseUploadedResume = () =>
  useMutation({ mutationFn: (file: { uri: string; name: string; mimeType?: string | null }) => resumeService.parseUploadedResume(file) });

export const useCreateResumeFromParsed = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (parsed: Parameters<typeof resumeService.createResumeFromParsed>[1]) =>
      resumeService.createResumeFromParsed(userId as string, parsed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list }),
  });
};

export const useUpdateFreeformSection = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, content, currentSections }: { key: ResumeFreeformSectionKey; content: string; currentSections: Record<string, string> }) =>
      resumeService.updateFreeformSection(resumeId, key, content, currentSections),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

/** Finished (ready/delivered) Custom Project Builder requests the user can add to a resume. */
export const useMyCustomProjectsForResume = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: resumeQueryKeys.myCustomProjects,
    queryFn: () => resumeService.listMyCustomProjects(userId as string),
    enabled: !!userId,
  });
};

export const useAppendProjectToResume = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ project, currentSections }: { project: ResumeProjectCandidate; currentSections: Record<string, string> }) =>
      resumeService.appendProjectToResume(resumeId, project, currentSections),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.detail(resumeId) }),
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resumeId: string) => resumeService.deleteResume(resumeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: resumeQueryKeys.list }),
  });
};

export const useATSBreakdown = (resumeId: string) =>
  useQuery({ queryKey: resumeQueryKeys.atsScore(resumeId), queryFn: () => resumeService.getATSBreakdown(resumeId), enabled: !!resumeId });

/** Generates the PDF, then opens the native share/save sheet and logs it to download history. */
export function useDownloadResumePdf(resumeId: string, resumeTitle: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();

  const download = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { uri } = await resumeService.generatePdf(resumeId);
      await resumeService.recordDownload(userId as string, resumeId, resumeTitle, uri);
      queryClient.invalidateQueries({ queryKey: resumeQueryKeys.downloadHistory });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      }
      return uri;
    } finally {
      setIsGenerating(false);
    }
  }, [resumeId, resumeTitle, userId, queryClient]);

  return { download, isGenerating };
}

/** AI writing-assist — calls the website's /api/resume/assist. Never writes to the resume itself; the caller decides whether to accept the suggestion. */
export const useResumeAssist = () => useMutation({ mutationFn: (input: AssistRequestInput) => resumeAssistService.requestSuggestion(input) });

/** Creates a public share link for a resume; resolves to the full www.campusedux.com/r/<token> URL. */
export const useCreateResumeShare = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({ mutationFn: (resumeId: string) => resumeService.createShareLink(userId as string, resumeId) });
};

export const useResumeDownloadHistory = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: resumeQueryKeys.downloadHistory,
    queryFn: () => resumeService.getDownloadHistory(userId as string),
    enabled: !!userId,
  });
};
