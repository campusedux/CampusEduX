/** ₹ amount with a thousands separator, matching the rest of the app. */
export function rupees(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export const capitalize = (s: string | null): string => (s ? s[0].toUpperCase() + s.slice(1) : "—");

/** Like rupees(), but keeps paise when present (₹1,500.50) — for dues/add-on prices that must not round away. */
export function money(n: number): string {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const frac = !Number.isInteger(v);
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: frac ? 2 : 0, maximumFractionDigits: frac ? 2 : 0 })}`;
}
