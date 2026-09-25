import { BRAND } from "@/constants/brand";
import { LEGAL_VERSIONS, LEGAL_HUB_ORDER, legalUrl } from "@/constants/legal";
import { LEGAL_DOCUMENTS } from "@/legal/content";
import { interpolateDocument } from "@/legal/interpolate";
import type { LegalDocId } from "@/types";

const IDS: LegalDocId[] = [
  "privacy-policy",
  "terms",
  "refund-policy",
  "project-license",
  "community-guidelines",
  "disclaimer",
  "data-and-permissions",
  "contact",
  "delete-account",
];

describe("legal content <-> config are in sync", () => {
  it("every id has a content file, a version and a URL", () => {
    for (const id of IDS) {
      const doc = LEGAL_DOCUMENTS[id];
      expect(doc).toBeDefined();
      expect(doc.id).toBe(id);
      expect(doc.title.trim().length).toBeGreaterThan(0);
      expect(doc.summary.trim().length).toBeGreaterThan(0);
      expect(doc.intro.length).toBeGreaterThan(0);
      expect(doc.sections.length).toBeGreaterThan(0);
      for (const s of doc.sections) {
        expect(s.heading.trim().length).toBeGreaterThan(0);
        const hasProse =
          (s.body?.length ?? 0) > 0 ||
          (s.bullets?.length ?? 0) > 0 ||
          (s.subsections?.length ?? 0) > 0;
        expect(hasProse).toBe(true);
      }

      expect(LEGAL_VERSIONS[id]?.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(LEGAL_VERSIONS[id]?.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(legalUrl(id).startsWith(`${BRAND.website.replace(/\/$/, "")}/`)).toBe(true);
    }
  });

  it("the Legal & Privacy hub lists exactly the known documents", () => {
    expect([...LEGAL_HUB_ORDER].sort()).toEqual([...IDS].sort());
  });

  it("no {{token}} placeholder is left unresolved after interpolation", () => {
    for (const id of IDS) {
      const filled = interpolateDocument(LEGAL_DOCUMENTS[id]);
      expect(JSON.stringify(filled)).not.toMatch(/\{\{\w+\}\}/);
    }
  });
});
