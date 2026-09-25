/** Jobs-screen design tokens (spec: text #0F172A, secondary #64748B, borders #E2E8F0, primary #4F46E5). */
export const J = {
  text: "#0F172A",
  secondary: "#64748B",
  border: "#E2E8F0",
  borderSoft: "#EEF0F6",
  hoverBorder: "#C7D2FE",
  primary: "#4F46E5",
  primaryTint: "#EEF2FF",
  inputBg: "#F8FAFC",
  fresher: { bg: "#DCFCE7", fg: "#166534" },
  experienced: { bg: "#DBEAFE", fg: "#1E40AF" },
  neutral: { bg: "#F1F5F9", fg: "#475569" },
  maxWidth: 1200,
} as const;

export const SOFT_SHADOW = {
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
} as const;

/** Column count from window width: 4 (≥1024), 3 (≥768), else 2. */
export function categoryColumns(windowWidth: number): number {
  return windowWidth >= 1024 ? 4 : windowWidth >= 768 ? 3 : 2;
}
