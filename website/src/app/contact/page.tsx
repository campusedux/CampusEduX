import ContactForm from "./ContactForm";
import { WhatsAppSupport } from "@/components/support/WhatsAppSupport";
import { LegalPageShell } from "@/legal/LegalPageShell";
import { LegalSections } from "@/legal/LegalProse";
import { RelatedPolicies } from "@/legal/LegalDocView";
import { interpolateDocument } from "@/legal/interpolate";
import { getLegalDocument } from "@/legal/registry";
import { LEGAL_VERSIONS, formatLegalDate } from "@/legal/config";
import { legalMetadata } from "@/legal/seo";

export const metadata = legalMetadata("contact");

export default function ContactPage() {
  const doc = interpolateDocument(getLegalDocument("contact"));
  const meta = LEGAL_VERSIONS.contact;

  return (
    <LegalPageShell title={doc.title} version={meta.version} effectiveDate={formatLegalDate(meta.effectiveDate)}>
      {doc.intro.map((p, i) => (
        <p key={i} className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          {p}
        </p>
      ))}

      <ContactForm />

      <div className="mt-10">
        <p className="text-sm font-semibold text-ink">Prefer a quick chat?</p>
        <p className="mt-1 text-sm text-ink-muted">
          Message the CampusEduX support team on WhatsApp — the chat opens with your question ready to send, so you
          only have to press Send.
        </p>
        <WhatsAppSupport variant="card" className="mt-4" />
      </div>

      <hr className="mt-10 border-line" />
      <p className="mt-6 text-sm font-semibold text-ink">Or email the right address directly</p>
      <LegalSections doc={doc} />

      <RelatedPolicies id="contact" />
    </LegalPageShell>
  );
}
