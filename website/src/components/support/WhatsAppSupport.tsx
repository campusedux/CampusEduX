import { cn } from "@/lib/cn";
import {
  WHATSAPP_SUPPORT,
  isWhatsAppSupportEnabled,
  whatsAppSupportUrl,
} from "@/lib/whatsapp";

/**
 * The one reusable WhatsApp Support trigger for the whole site. Server
 * component — it renders nothing but an `<a>`, so it ships zero client JS and
 * is safe to drop into the (JS-free) footer as well as any page.
 *
 * Everything routes through `src/lib/whatsapp.ts`: the number, the pre-filled
 * message and the master on/off switch live there, never in this file. When the
 * channel is switched off the component renders `null` everywhere at once.
 *
 * Variants (all open `wa.me` — WhatsApp's official redirector — in a new tab
 * with `rel="noopener noreferrer"`, and carry the same `aria-label`):
 *   • "button" — a CTA shaped like the site's primary <Button>.
 *   • "card"   — a full contact block: icon, "WhatsApp Support", the number,
 *                "Chat with us on WhatsApp" and the CTA. For the Contact page.
 *   • "inline" — a compact one-line link that matches the footer's mail row.
 */

type WhatsAppVariant = "button" | "card" | "inline";

interface WhatsAppSupportProps {
  variant?: WhatsAppVariant;
  /** CTA text for the "button" / "card" variants. */
  label?: string;
  /** Extra classes merged onto the root element. */
  className?: string;
  /** Override the pre-filled chat message (defaults to the support greeting). */
  message?: string;
}

/** WhatsApp glyph as inline SVG — lucide-react has no WhatsApp icon, and this
 *  matches the "inline SVG, no icon request" convention already used in the
 *  footer and the blog share row. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden focusable="false">
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.45 1.33 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm5.82 14.06c-.25.7-1.44 1.33-1.98 1.38-.53.05-1.02.24-3.44-.72-2.9-1.14-4.75-4.1-4.9-4.29-.14-.19-1.17-1.55-1.17-2.96s.74-2.1 1-2.39c.25-.29.55-.36.73-.36s.37 0 .53.01c.17.01.4-.06.62.48.25.6.86 2.06.94 2.2.07.15.12.32.02.51-.1.19-.15.31-.29.48-.15.17-.31.38-.44.51-.15.15-.3.3-.13.59.17.29.76 1.25 1.63 2.02 1.12.99 2.06 1.3 2.35 1.45.29.15.46.12.63-.07.17-.19.73-.85.92-1.14.19-.29.39-.24.65-.15.26.1 1.65.78 1.94.92.29.15.48.22.55.34.07.12.07.7-.18 1.4Z" />
    </svg>
  );
}

/** Shared anchor attributes for every variant. */
const LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer",
  "aria-label": WHATSAPP_SUPPORT.ariaLabel,
} as const;

/** CTA pill — shaped exactly like the site's `<Button variant="primary">` so it
 *  reads as a native CampusEduX button. WhatsApp identity is carried by the
 *  glyph and the green icon tile, not by recolouring the whole control (an
 *  all-green button would break the indigo design system and its contrast). */
const CTA_PILL =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition active:scale-[.98] motion-reduce:transform-none bg-primary text-white hover:bg-primary-600";

export function WhatsAppSupport({
  variant = "button",
  label = "Chat on WhatsApp",
  className,
  message,
}: WhatsAppSupportProps) {
  if (!isWhatsAppSupportEnabled()) return null;

  const href = whatsAppSupportUrl(message);

  if (variant === "inline") {
    return (
      <a
        href={href}
        {...LINK_PROPS}
        className={cn(
          "inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-primary focus-visible:text-primary",
          className,
        )}
      >
        <WhatsAppGlyph className="h-4 w-4 flex-shrink-0 text-ink-faint" />
        <span>
          WhatsApp Support <span className="text-ink-faint">·</span> {WHATSAPP_SUPPORT.displayNumber}
        </span>
      </a>
    );
  }

  if (variant === "card") {
    return (
      <a
        href={href}
        {...LINK_PROPS}
        className={cn(
          "card card-hover group flex flex-col gap-4 p-5 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <span className="flex items-start gap-4">
          <span
            aria-hidden
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-success/10 text-success"
          >
            <WhatsAppGlyph className="h-[22px] w-[22px]" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-ink">WhatsApp Support</span>
            <span className="mt-0.5 block text-sm text-ink-muted">{WHATSAPP_SUPPORT.displayNumber}</span>
            <span className="mt-0.5 block text-sm text-ink-muted">Chat with us on WhatsApp</span>
          </span>
        </span>
        <span className={cn(CTA_PILL, "h-11 flex-shrink-0 group-hover:bg-primary-600")}>
          <WhatsAppGlyph className="h-4 w-4" />
          {label}
        </span>
      </a>
    );
  }

  // variant === "button"
  return (
    <a
      href={href}
      {...LINK_PROPS}
      className={cn(
        CTA_PILL,
        "h-11 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        className,
      )}
    >
      <WhatsAppGlyph className="h-4 w-4" />
      {label}
    </a>
  );
}

export default WhatsAppSupport;
