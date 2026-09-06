import { LegalPageShell } from "@/legal/LegalPageShell";
import { LegalProse } from "@/legal/LegalProse";
import { RelatedPolicies } from "@/legal/LegalDocView";
import { interpolateDocument } from "@/legal/interpolate";
import { LEGAL_VERSIONS, formatLegalDate } from "@/legal/config";
import { composedLegalMetadata } from "@/legal/seo";
import type { LegalDocument } from "@/legal/types";

const PATH = "/grievance";
const META = LEGAL_VERSIONS.grievance;

export const metadata = composedLegalMetadata({
  title: "Grievance Redressal",
  description: "How to raise a grievance with CampusEduX and reach the Grievance Officer.",
  path: PATH,
});

/**
 * Hand-composed page (no shared content JSON) so it can pull the Grievance
 * Officer name / address / emails straight from `legal.config.json`. Authored in
 * the same `LegalDocument` shape and run through the same interpolation +
 * renderer as every other policy, so it looks and reads identically.
 */
const DOC: LegalDocument = {
  id: "privacy-policy", // unused by the renderer; satisfies the type
  title: "Grievance Redressal",
  summary: "How to raise a grievance with {{appName}} and reach the Grievance Officer.",
  intro: [
    "{{appName}} is operated by {{entityDescription}}. If you have a complaint about your data, our content, a payment, a listing, another user, or anything else about the service, you can raise it with us using the steps below.",
    "This page is provided in line with the Digital Personal Data Protection Act, 2023 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. It is not legal advice.",
  ],
  sections: [
    {
      heading: "1. How to raise a grievance",
      body: ["Email {{grievanceEmail}} with:"],
      bullets: [
        "The registered email address or mobile number on your {{appName}} account, so we can locate it.",
        "A clear description of the issue and what outcome you are looking for.",
        "Any order ID, screenshot, listing link or other detail that helps us investigate.",
        "For a data-protection complaint, say that it concerns your personal data so we route it to the Grievance Officer.",
      ],
    },
    {
      heading: "2. Grievance Officer",
      body: [
        "In line with Indian law, complaints — including complaints about the processing of your personal data — can be addressed to our Grievance Officer:",
        "Name: {{grievanceOfficerName}}",
        "Email: {{grievanceEmail}}",
        "Postal address: {{registeredAddress}}",
      ],
    },
    {
      heading: "3. Acknowledgement and resolution timeline",
      bullets: [
        "We aim to acknowledge every grievance within {{supportResponseBusinessDays}} business days of receiving it.",
        "We aim to resolve grievances within 30 days, in line with Indian law. Complex cases that need more time will be updated with a reason and an expected date.",
        "Requests to access or correct your personal data, and account-deletion requests, are handled as described in the Privacy Policy and the Delete Account page.",
      ],
    },
    {
      heading: "4. If you are not satisfied",
      bullets: [
        "For a personal-data complaint that we have not resolved to your satisfaction, you may escalate to the Data Protection Board of India under the Digital Personal Data Protection Act, 2023.",
        "For a purchase or refund dispute, you may also use the consumer grievance mechanisms available in {{country}}, and the dispute process of the payment provider, {{paymentProcessorName}}.",
        "Nothing here limits any right you have under applicable law.",
      ],
    },
    {
      heading: "5. Other contacts",
      bullets: [
        "Privacy and account data: {{privacyEmail}}",
        "Support, billing and refunds: {{supportEmail}}",
        "Legal notices and copyright: {{legalEmail}}",
        "Operator: {{companyName}} — {{entityDescription}}",
        "Website: {{website}}",
      ],
    },
  ],
};

export default function Page() {
  const doc = interpolateDocument(DOC);
  return (
    <LegalPageShell title={doc.title} version={META.version} effectiveDate={formatLegalDate(META.effectiveDate)}>
      <LegalProse doc={doc} />
      <RelatedPolicies id="grievance" />
    </LegalPageShell>
  );
}
