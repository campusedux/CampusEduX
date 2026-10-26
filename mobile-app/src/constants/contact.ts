/**
 * Support / sales contact channels. Mirrors the website's WhatsApp Support
 * number (`website/src/lib/whatsapp.ts`, +91 9370764290).
 */
export const WHATSAPP_NUMBER = "+919370764290";

/** Human-readable form of WHATSAPP_NUMBER for display. */
export const WHATSAPP_DISPLAY = "+91 93707 64290";

/** Support message pre-filled when a user opens WhatsApp from Help / Contact. */
export const WHATSAPP_SUPPORT_MESSAGE = "Hi CampusEduX, I need help with the app.";

/**
 * Public store listing URL. Leave "" until the app is published: the About
 * screen hides its "Rate Us" row while this is empty.
 */
export const STORE_URL = "";

export const WHATSAPP_CONSULTATION_MESSAGE = "Hi CampusEduX, I would like project mentoring on work I author, or non-academic custom software. I understand you do not complete assessed work for students.";

/** wa.me wants digits only — no "+", spaces or dashes. */
export function whatsappUrl(message: string = WHATSAPP_CONSULTATION_MESSAGE, number: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
}
