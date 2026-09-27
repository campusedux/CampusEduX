"use client";

import { MessageCircle } from "lucide-react";

/**
 * "Remind on WhatsApp" for a referred friend who hasn't purchased yet.
 * Deliberately the same no-phone-number `wa.me/?text=` pattern as
 * ShareReferralLink — it opens WhatsApp's own contact picker so the
 * referrer chooses who to send it to, never a number we don't have.
 */
export function ReferralReminderButton({ link, name }: { link: string; name: string | null }) {
  const message = `Hey${name ? " " + name : ""}! Join CampusEduX with my link and grab your first project — ${link}`;

  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-3 text-xs font-semibold text-[#128C4B] transition hover:bg-[#25D366]/25 dark:text-[#5BE391]"
    >
      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
      Remind on WhatsApp
    </a>
  );
}

export default ReferralReminderButton;
