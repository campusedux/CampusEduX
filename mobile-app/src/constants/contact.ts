/**
 * Support / sales contact channels. Mirrors the website's WhatsApp Support
 * number (`website/src/lib/whatsapp.ts`, +91 9370764290).
 */
export const WHATSAPP_NUMBER = "+919370764290";

export const WHATSAPP_CONSULTATION_MESSAGE = "Hi CampusEduX, I'd like a free consultation for my project idea.";

/** wa.me wants digits only — no "+", spaces or dashes. */
export function whatsappUrl(message: string = WHATSAPP_CONSULTATION_MESSAGE, number: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
}
