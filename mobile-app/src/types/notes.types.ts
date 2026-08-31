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

export interface PrepNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  topic: string;
  tags: string[];
  fileUrl: string | null;
  thumbnailUrl: string | null;
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  isBookmarked: boolean;
}

export interface NoteFilter {
  category?: NoteCategory | "All";
  search?: string;
  bookmarkedOnly?: boolean;
}
