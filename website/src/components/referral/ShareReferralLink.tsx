"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "@/components/ui/Toast";

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

/**
 * The student's referral link with one-tap copy (toast confirmation), the
 * native share sheet where the browser has one, and a WhatsApp share link.
 */
export function ShareReferralLink({ link, code }: { link: string; code?: string | null }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  const message = `Join me on CampusEduX — tutorials, coding practice, projects and jobs for students. Sign up with my link: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({ tone: "success", title: "Referral link copied", description: "Paste it anywhere to invite a friend." });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ tone: "error", title: "Couldn't copy", description: "Select the link and copy it manually." });
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "Join me on CampusEduX", text: message, url: link });
    } catch {
      /* dismissed */
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5">
          {code && (
            <span className="flex-shrink-0 rounded-md bg-primary-50 px-2 py-0.5 font-mono text-xs font-bold text-primary">{code}</span>
          )}
          <code className="min-w-0 flex-1 truncate py-3 text-sm text-ink-muted">{link}</code>
        </div>
        <button type="button" onClick={copy} className="btn-primary h-12 flex-shrink-0 px-5" aria-live="polite">
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366]/15 px-4 text-sm font-semibold text-[#128C4B] transition hover:bg-[#25D366]/25 dark:text-[#5BE391]"
        >
          {WHATSAPP_ICON} Share on WhatsApp
        </a>
        {canShare && (
          <button type="button" onClick={share} className="btn-ghost h-10 px-4 text-sm">
            <Share2 className="h-4 w-4" aria-hidden /> More ways to share
          </button>
        )}
      </div>
    </div>
  );
}

export default ShareReferralLink;
