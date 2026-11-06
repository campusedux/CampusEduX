import type { LegalDocument } from "./types";

/** Website additions are separate so legal:sync preserves the mobile disclosures. */
export function websiteDocument(source: LegalDocument): LegalDocument {
  const doc: LegalDocument = JSON.parse(JSON.stringify(source));
  for (const section of doc.sections) {
    if (doc.id === "terms" || doc.id === "refund-policy") {
      const replacePrice = (text: string) => text
        .replace("Mentoring ₹1,500 / Personal ₹3,000 / Business ₹6,000 at the current pricing", "{{customProjectTokenPrices}}")
        .replace("Mentoring ₹1,500 / Personal ₹3,000 / Business ₹6,000", "{{customProjectTokenPrices}}");
      for (const block of [section, ...(section.subsections ?? [])]) {
        block.body = block.body?.map(replacePrice);
        block.bullets = block.bullets?.map(replacePrice);
      }
    }
    if (doc.id !== "privacy-policy") continue;
    for (const subsection of section.subsections ?? []) {
      if (subsection.heading !== "Website analytics (website only)") continue;
      subsection.bullets = subsection.bullets?.map(text => text.replace(
        "GA4 records page views and general technical information (such as browser type and approximate location derived from IP address) and sets the cookies described in the Cookie Policy. We have not linked this data to your CampusEduX account.",
        "GA4 receives page views and technical request information on public pages. Analytics storage is denied by default: limited cookieless measurements still send data to Google before consent and after rejection. If you allow analytics, GA4 may set the cookies described in the Cookie Policy. We have not linked this data to your CampusEduX account.",
      ));
    }
    section.bullets = section.bullets?.map((text) => text
      .replace("We do NOT use your personal data for third-party advertising, and we do NOT sell your personal data.", "The mobile app does not use personal data for third-party advertising. On the website, when we display advertising, Google and third-party vendors may process advertising data as described below. We do not sell your personal data.")
      .replace("We do not sell your personal data and we do not share it with third parties for their own advertising.", "We do not sell your personal data. When we display advertising on the website, data may be shared with Google and third-party advertising vendors as described below; this does not change the mobile app disclosures."));
  }
  if (doc.id === "privacy-policy") doc.sections.push({
    heading: "Website advertising (website only)",
    body: [
      "When we display advertising through Google AdSense, Google and third-party vendors may use cookies and other identifiers, your IP address, browser information and page activity to serve and measure ads, limit repetition and prevent fraud. Personalised ads may reflect your interests and previous visits to this or other websites; non-personalised ads use contextual information but may still use cookies for measurement, frequency capping and fraud prevention.",
      "Advertising is off by default. Before advertising is enabled, you can choose Advertising in the cookie banner and later reject or withdraw it through Cookie settings in the footer. Our website does not load advertising without advertising consent. This banner is not a Google-certified TCF consent management platform; a certified platform must be integrated before personalised ads are served to visitors in the EEA, UK or Switzerland.",
      "Read how Google uses data from partner sites: https://policies.google.com/technologies/partner-sites and how its advertising technologies work: https://policies.google.com/technologies/ads. Manage Google ad personalisation in Google Ads Settings: https://adssettings.google.com/ or use participating vendors' opt-outs at https://www.aboutads.info/choices/. These controls do not replace your Cookie settings choice on this website. You can also delete or block cookies in your browser.",
      "These advertising disclosures apply only when we display advertising on the website. The mobile app's existing disclosures about advertising and analytics SDKs remain unchanged.",
    ],
  });
  return doc;
}
