/** ₹ amount with a thousands separator, matching the rest of the app. */
export function rupees(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export const capitalize = (s: string | null): string => (s ? s[0].toUpperCase() + s.slice(1) : "—");
