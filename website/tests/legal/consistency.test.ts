import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { LEGAL, LEGAL_VERSIONS, CURRENT_LEGAL_VERSION } from "@/legal/config";
import { LEGAL_DOCUMENTS, LEGAL_INDEX, RELATED, legalPath } from "@/legal/registry";
import { interpolateDocument } from "@/legal/interpolate";
import type { LegalDocId, SharedLegalDocId } from "@/legal/types";

const WEBSITE_LEGAL = resolve(__dirname, "..", "..", "src", "legal");
const MOBILE_LEGAL = resolve(__dirname, "..", "..", "..", "mobile-app", "src", "legal");

/** The 9 documents that must stay byte-identical to the mobile app. */
const SHARED_IDS: SharedLegalDocId[] = [
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

const ALL_IDS = [...SHARED_IDS, "cookie-policy"] as LegalDocId[];

describe("website legal content is in sync with the mobile canonical source", () => {
  const mobileAvailable = existsSync(MOBILE_LEGAL);

  it.runIf(mobileAvailable)("legal.config.json is byte-identical to mobile-app's", () => {
    const web = readFileSync(join(WEBSITE_LEGAL, "legal.config.json"), "utf8");
    const mob = readFileSync(join(MOBILE_LEGAL, "legal.config.json"), "utf8");
    expect(web).toBe(mob);
  });

  it.runIf(mobileAvailable)("every shared content file is byte-identical to mobile-app's", () => {
    for (const id of SHARED_IDS) {
      const web = readFileSync(join(WEBSITE_LEGAL, "content", `${id}.json`), "utf8");
      const mob = readFileSync(join(MOBILE_LEGAL, "content", `${id}.json`), "utf8");
      expect(web, `${id}.json drifted — run \`npm run legal:sync\``).toBe(mob);
    }
  });

  it.runIf(mobileAvailable)("cookie-policy is website-only (absent from mobile-app)", () => {
    expect(existsSync(join(MOBILE_LEGAL, "content", "cookie-policy.json"))).toBe(false);
  });
});

describe("every legal document is complete and wired up", () => {
  it("has content, a version, a route path and a page file", () => {
    for (const id of ALL_IDS) {
      const doc = LEGAL_DOCUMENTS[id];
      expect(doc, id).toBeDefined();
      expect(doc.title.trim().length).toBeGreaterThan(0);
      expect(doc.summary.trim().length).toBeGreaterThan(0);
      expect(doc.intro.length).toBeGreaterThan(0);
      expect(doc.sections.length).toBeGreaterThan(0);
      for (const s of doc.sections) {
        expect(s.heading.trim().length).toBeGreaterThan(0);
        const hasProse =
          (s.body?.length ?? 0) > 0 || (s.bullets?.length ?? 0) > 0 || (s.subsections?.length ?? 0) > 0;
        expect(hasProse, `${id} › ${s.heading}`).toBe(true);
      }

      expect(LEGAL_VERSIONS[id]?.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(LEGAL_VERSIONS[id]?.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      const path = legalPath(id);
      expect(path.startsWith("/")).toBe(true);
      const pageFile = resolve(__dirname, "..", "..", "src", "app", path.replace(/^\//, ""), "page.tsx");
      expect(existsSync(pageFile), `missing route file for ${path}`).toBe(true);
    }
  });

  it("the /legal hub lists every document plus grievance, and each entry has a page", () => {
    const listed = LEGAL_INDEX.map((e) => e.id).sort();
    expect(listed).toEqual([...ALL_IDS, "grievance"].sort());
    for (const entry of LEGAL_INDEX) {
      const pageFile = resolve(__dirname, "..", "..", "src", "app", entry.path.replace(/^\//, ""), "page.tsx");
      expect(existsSync(pageFile), `missing route file for ${entry.path}`).toBe(true);
    }
  });

  it("grievance has a version and a page", () => {
    expect(LEGAL_VERSIONS.grievance?.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(existsSync(resolve(__dirname, "..", "..", "src", "app", "grievance", "page.tsx"))).toBe(true);
  });

  it("no {{token}} placeholder is left unresolved after interpolation", () => {
    for (const id of ALL_IDS) {
      const filled = interpolateDocument(LEGAL_DOCUMENTS[id]);
      expect(JSON.stringify(filled), id).not.toMatch(/\{\{\w+\}\}/);
    }
  });

  it("related-policy cross-links all point at known documents", () => {
    const known = new Set<string>([...ALL_IDS, "grievance"]);
    for (const [id, links] of Object.entries(RELATED)) {
      for (const target of links) {
        expect(known.has(target), `${id} → ${target}`).toBe(true);
      }
    }
  });
});

describe("owner information is resolved to the verified values", () => {
  const PLACEHOLDERS = ["[GOVERNING CITY, STATE]", "[REGISTERED BUSINESS ADDRESS]", "[GRIEVANCE OFFICER NAME]"];

  it("no bracketed owner-input placeholder remains in the raw config", () => {
    for (const p of PLACEHOLDERS) {
      expect(LEGAL.governingCityState).not.toBe(p);
      expect(LEGAL.registeredAddress).not.toBe(p);
      expect(LEGAL.grievanceOfficerName).not.toBe(p);
    }
  });

  it("no bracketed owner-input placeholder is left in any rendered legal document", () => {
    for (const id of ALL_IDS) {
      const filled = JSON.stringify(interpolateDocument(LEGAL_DOCUMENTS[id]));
      for (const p of PLACEHOLDERS) {
        expect(filled, `${id} still contains ${p}`).not.toContain(p);
      }
    }
  });

  it("owner facts match the verified values", () => {
    expect(LEGAL.entityDescription).toContain("Ganesh Pache");
    expect(LEGAL.governingCityState).toBe("Pune, Maharashtra");
    expect(LEGAL.registeredAddress).toBe("Kharadi, Pune, Pune, Maharashtra 411014, India");
    expect(LEGAL.grievanceOfficerName).toContain("Mukund P.");
    expect(LEGAL.grievanceOfficerName).toContain("Customer Support Manager");
    expect(LEGAL.grievanceEmail).toBe("studyfact8545@gmail.com");
    expect(LEGAL.supportEmail).toBe("campusedux@gmail.com");
    expect(LEGAL.legalEmail).toBe("campusedux@gmail.com");
    expect(LEGAL.privacyEmail).toBe("campusedux@gmail.com");
  });

  it("no grievance phone number is configured or rendered", () => {
    expect(LEGAL).not.toHaveProperty("grievancePhone");
    for (const id of ALL_IDS) {
      const filled = JSON.stringify(interpolateDocument(LEGAL_DOCUMENTS[id]));
      expect(filled).not.toMatch(/\{\{grievancePhone\}\}/);
    }
  });

  it("exposes a current policies version", () => {
    expect(CURRENT_LEGAL_VERSION).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });
});
