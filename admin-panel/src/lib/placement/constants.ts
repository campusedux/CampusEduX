/** Pure constants — safe to import from client components. */

export const APT_CATEGORIES = ['aptitude', 'logical', 'verbal'] as const;
export const TEST_CATEGORIES = ['aptitude', 'logical', 'verbal', 'hr', 'company'] as const;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;
export const LIVE_STATUS = ['upcoming', 'ongoing', 'completed', 'cancelled'] as const;

export const QUESTION_TYPES = ['aptitude', 'dsa', 'hr'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const PLACEMENT_PAGE_SIZE = 20;

export const HR_CATEGORIES = [
  'General Questions',
  'Behavioural',
  'Situational',
  'Strengths & Weaknesses',
  'Career Goals',
  'Company Fit',
] as const;

/** Preparation → Notes categories. Must match the prep_notes CHECK constraint
 *  (admin 010_notes_admin.sql / mobile 0028_preparation_notes.sql). */
export const NOTE_CATEGORIES = [
  'Aptitude',
  'Logical Reasoning',
  'Verbal',
  'DSA',
  'Coding',
  'HR',
  'Technical Interview',
  'Company Preparation',
  'General Placement',
] as const;
