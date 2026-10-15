import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { LEGAL, formatLegalDate } from "@/legal/config";
import { fillTokens } from "@/legal/interpolate";
import { LEGAL_INDEX } from "@/legal/registry";

const lastUpdated = LEGAL_INDEX.map((item) => item.effectiveDate).sort().at(-1)!;

export const metadata: Metadata = {
  title: { absolute: "CampusEduX Legal & Privacy Policies" },
  description: "Find CampusEduX privacy, terms, refund, cookie, grievance and other policies in one place.",
  alternates: { canonical: "/legal" },
  openGraph: {
    title: `${LEGAL.appName} — Legal & Privacy`,
    description: `The policies that govern your use of ${LEGAL.appName}, on the web and in the app.`,
    url: absoluteUrl("/legal"),
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default function LegalHubPage() {
  return (
    <div className="page-shell-narrow">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Legal &amp; Privacy</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Policies</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        These policies govern your use of {LEGAL.appName}. Each policy shows its own effective date; the Cookie Policy
        and Grievance Redressal page apply to this website.
      </p>
      <p className="mt-1 text-sm text-ink-faint">
        Last updated {formatLegalDate(lastUpdated)}
      </p>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {LEGAL_INDEX.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className="group flex items-start gap-4 py-4 transition-colors hover:bg-surface"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold text-ink group-hover:text-primary">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">{fillTokens(item.summary)}</span>
                <span className="mt-1 block text-xs text-ink-faint">
                  v{item.version} · {formatLegalDate(item.effectiveDate)}
                </span>
              </span>
              <ArrowRight
                className="mt-1 h-4 w-4 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm text-ink-muted">
        Questions? Email{" "}
        <a
          className="text-primary underline underline-offset-2 hover:no-underline"
          href={`mailto:${LEGAL.privacyEmail}`}
        >
          {LEGAL.privacyEmail}
        </a>{" "}
        or see the <Link href="/grievance" className="text-primary underline underline-offset-2 hover:no-underline">Grievance Redressal</Link> page.
      </p>
    </div>
  );
}
