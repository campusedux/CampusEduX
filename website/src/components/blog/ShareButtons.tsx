"use client";

import { useState } from "react";
import { Check, Link2, Linkedin, Share2, Twitter } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Article social sharing. Uses the native Web Share sheet when available
 * (mobile), and always offers copy-link + X + LinkedIn + WhatsApp intents.
 * `url` is the absolute canonical URL, resolved on the server and passed in.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user dismissed — no-op */
      }
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  const iconBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition hover:border-primary/40 hover:text-primary";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Share</span>

      <button type="button" onClick={nativeShare} aria-label="Share" className={cn(iconBtn, "sm:hidden")}>
        <Share2 className="h-4 w-4" aria-hidden />
      </button>

      <a
        href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className={iconBtn}
      >
        <Twitter className="h-4 w-4" aria-hidden />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={iconBtn}
      >
        <Linkedin className="h-4 w-4" aria-hidden />
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${enc(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className={iconBtn}
      >
        {/* lucide has no WhatsApp glyph — a simple speech mark keeps the row consistent */}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.33 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm5.82 14.06c-.25.7-1.44 1.33-1.98 1.38-.53.05-1.02.24-3.44-.72-2.9-1.14-4.75-4.1-4.9-4.29-.14-.19-1.17-1.55-1.17-2.96s.74-2.1 1-2.39c.25-.29.55-.36.73-.36s.37 0 .53.01c.17.01.4-.06.62.48.25.6.86 2.06.94 2.2.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.3-.13.59.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.65-.15.26.1 1.65.78 1.94.92.29.15.48.22.55.34.07.12.07.7-.18 1.4Z" />
        </svg>
      </a>

      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        className={cn(iconBtn, copied && "border-primary/40 text-primary")}
      >
        {copied ? <Check className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

export default ShareButtons;
