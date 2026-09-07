import type { LucideIcon } from "lucide-react";
import { GraduationCap, LayoutGrid, Briefcase, Newspaper, FileText } from "lucide-react";
import type { SearchGroupType } from "@/lib/searchModel";

/**
 * One icon per content type — used by the `/search` results page and the navbar
 * suggestions dropdown so a group always reads the same. Plain data (no
 * `"use client"`); safe to import from server and client components alike.
 */
export const GROUP_ICON: Record<SearchGroupType, LucideIcon> = {
  learning: GraduationCap,
  projects: LayoutGrid,
  jobs: Briefcase,
  blog: Newspaper,
  resume: FileText,
};
