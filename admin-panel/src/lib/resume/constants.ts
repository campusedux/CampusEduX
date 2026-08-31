/** Pure constants — safe for client components. */

export const ATS_SECTIONS = [
  'profile_summary',
  'work_experience',
  'education',
  'skills',
  'formatting',
  'general',
] as const;

export const ATS_SECTION_LABEL: Record<string, string> = {
  profile_summary: 'Profile Summary',
  work_experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  formatting: 'Formatting',
  general: 'General',
};

export const IMPORTANCE = ['low', 'medium', 'high', 'critical'] as const;

export const IMPORTANCE_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};
