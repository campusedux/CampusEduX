/**
 * Single source of truth for the CampusEduX **WhatsApp Support** channel — the
 * web counterpart of `brand.ts`. Import from here instead of hard-coding the
 * number, the pre-filled message or the `wa.me` URL anywhere in the site.
 *
 * Consistent with how the site already handles optional contact/social config
 * (`brand.ts` reads `NEXT_PUBLIC_SUPPORT_EMAIL`, the footer renders a social
 * icon only when its `NEXT_PUBLIC_SOCIAL_*` URL is set), every value here has a
 * hard-coded default and an optional `NEXT_PUBLIC_*` override so an operator can
 * change the number, the message, or switch the whole channel off without a
 * code change and without any database wiring:
 *
 *   NEXT_PUBLIC_WHATSAPP_SUPPORT           "off" | "false" | "0" | "no"  → hide everywhere (default: on)
 *   NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER    digits only, no "+" / spaces  (default: 919370764290)
 *   NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE   pre-filled chat text          (default: the support greeting below)
 */

/** Digits only — no spaces, no leading "+". This is what `wa.me/<number>` needs. */
const DEFAULT_NUMBER = "919370764290";

/** Pre-filled so the user only has to press Send. */
const DEFAULT_MESSAGE =
  "Hello CampusEduX Support Team, I need help with CampusEduX. Please assist me.";

/** `"919370764290"` → `"+91 9370764290"` for display. Falls back to `+<digits>`. */
function formatForDisplay(digits: string): string {
  const m = /^(\d{1,3})(\d{10})$/.exec(digits);
  return m ? `+${m[1]} ${m[2]}` : `+${digits}`;
}

const rawNumber = (process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER ?? "").replace(/[^\d]/g, "");
const number = rawNumber || DEFAULT_NUMBER;
const message = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE?.trim() || DEFAULT_MESSAGE;

export const WHATSAPP_SUPPORT = {
  /** Bare digits for the `wa.me` URL — never contains spaces or a "+". */
  number,
  /** Human-readable, e.g. `+91 9370764290`. Safe to show in the UI. */
  displayNumber: formatForDisplay(number),
  /** The message pre-filled in WhatsApp when the user opens the chat. */
  message,
  /** Screen-reader / `aria-label` text for every WhatsApp trigger. */
  ariaLabel: "Chat with CampusEduX Support on WhatsApp",
} as const;

/**
 * Master on/off switch. Defaults to **on**; set `NEXT_PUBLIC_WHATSAPP_SUPPORT`
 * to `off` / `false` / `0` / `no` to hide WhatsApp Support from every configured
 * location (footer, Contact, Support, Grievance …). A single import, so every
 * surface stays in sync.
 */
export function isWhatsAppSupportEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT?.trim().toLowerCase();
  return !(v === "off" || v === "false" || v === "0" || v === "no" || v === "disabled");
}

/**
 * The click-to-chat URL: `https://wa.me/<number>?text=<url-encoded message>`.
 * `wa.me` is WhatsApp's official redirector — it opens the app on mobile and
 * WhatsApp Web / the desktop client elsewhere, so callers never build the raw
 * URL themselves. Pass a `customMessage` to override the default greeting.
 */
export function whatsAppSupportUrl(customMessage?: string): string {
  const text = encodeURIComponent((customMessage ?? WHATSAPP_SUPPORT.message).trim());
  return `https://wa.me/${WHATSAPP_SUPPORT.number}?text=${text}`;
}
