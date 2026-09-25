/** Pure helpers for the 6-box OTP entry (typing, paste, backspace). */
export const OTP_LENGTH = 6;

export interface OtpEdit {
  digits: string[];
  /** Box to focus next, or null to keep focus. */
  focusIndex: number | null;
}

const onlyDigits = (t: string) => t.replace(/[^0-9]/g, "");

export function emptyOtp(length = OTP_LENGTH): string[] {
  return Array(length).fill("");
}

/**
 * Text entered in box `index`. A single character fills the box and advances;
 * several characters (paste / SMS autofill) spread across the boxes — a full
 * code always fills from the first box.
 */
export function applyOtpChange(digits: string[], index: number, text: string, length = OTP_LENGTH): OtpEdit {
  const cleaned = onlyDigits(text);
  const next = [...digits];

  if (cleaned.length === 0) {
    next[index] = "";
    return { digits: next, focusIndex: null };
  }

  if (cleaned.length === 1) {
    next[index] = cleaned;
    return { digits: next, focusIndex: index < length - 1 ? index + 1 : null };
  }

  // The box already holds a digit, so typing into it yields 2 chars (old+new): treat as replace.
  if (cleaned.length === 2 && digits[index] && (cleaned[0] === digits[index] || cleaned[1] === digits[index])) {
    next[index] = cleaned[0] === digits[index] ? cleaned[1] : cleaned[0];
    return { digits: next, focusIndex: index < length - 1 ? index + 1 : null };
  }

  const start = cleaned.length >= length ? 0 : index;
  const chars = cleaned.slice(0, length - start).split("");
  chars.forEach((c, i) => {
    next[start + i] = c;
  });
  const last = start + chars.length;
  return { digits: next, focusIndex: Math.min(last, length - 1) };
}

/** Backspace pressed in box `index`: on an empty box clear the previous one and move back. */
export function applyOtpBackspace(digits: string[], index: number): OtpEdit {
  if (digits[index]) return { digits, focusIndex: null }; // native edit clears it via onChangeText("")
  if (index === 0) return { digits, focusIndex: null };
  const next = [...digits];
  next[index - 1] = "";
  return { digits: next, focusIndex: index - 1 };
}
