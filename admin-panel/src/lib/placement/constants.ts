/** Pure constants — safe to import from client components. Trimmed to what the
 *  surviving mock-test editor needs after the "Placement (legacy)" retirement
 *  (migration 036/0064). */

export const TEST_CATEGORIES = ['aptitude', 'logical', 'verbal', 'hr', 'company'] as const;
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

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
