import type { LucideIcon } from "lucide-react";
import { Calculator, Braces, MessagesSquare, ClipboardList, BookOpen, Building2 } from "lucide-react";

/** The 9 categories from `prep_notes.category` (admin NOTE_CATEGORIES). */
export const NOTE_CATEGORIES = [
  "Aptitude",
  "Logical Reasoning",
  "Verbal",
  "DSA",
  "Coding",
  "HR",
  "Technical Interview",
  "Company Preparation",
  "General Placement",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export function noteCategory(value: string | undefined): NoteCategory | undefined {
  return value && (NOTE_CATEGORIES as readonly string[]).includes(value) ? (value as NoteCategory) : undefined;
}

export interface PlacementTrack {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  tint: string;
  bg: string;
}

export const PLACEMENT_TRACKS: PlacementTrack[] = [
  {
    slug: "aptitude",
    name: "Aptitude",
    description: "Quantitative, logical reasoning and verbal ability — topic by topic.",
    icon: Calculator,
    tint: "#4F39F6",
    bg: "#EEF0FF",
  },
  {
    slug: "dsa",
    name: "DSA & Algorithms",
    description: "Data-structure and algorithm problems, grouped by topic and difficulty.",
    icon: Braces,
    tint: "#0D9488",
    bg: "#CCFBF1",
  },
  {
    slug: "hr",
    name: "HR & Interview",
    description: "Common HR and behavioural questions with guidance and sample answers.",
    icon: MessagesSquare,
    tint: "#DB2777",
    bg: "#FCE7F3",
  },
  {
    slug: "tests",
    name: "Practice Tests",
    description: "Timed mock tests — attempt them in the CampusEduX app, scored and tracked.",
    icon: ClipboardList,
    tint: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    slug: "notes",
    name: "Learning Notes",
    description: "Study notes across aptitude, DSA, HR, coding and company preparation.",
    icon: BookOpen,
    tint: "#16A34A",
    bg: "#DCFCE7",
  },
  {
    slug: "companies",
    name: "Company Prep",
    description: "Practice sets and question banks organised by hiring company.",
    icon: Building2,
    tint: "#EA580C",
    bg: "#FFEDD5",
  },
];
