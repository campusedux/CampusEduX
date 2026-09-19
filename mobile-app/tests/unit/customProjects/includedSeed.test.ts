import { readFileSync } from "fs";
import { join } from "path";

// Guards the seeded defaults (0116) and mirrors the DB CHECK from 0115: for
// every project type, the Standard included set must be a subset of Advanced.
const SEED = readFileSync(
  join(__dirname, "../../../supabase/migrations/0116_seed_custom_feature_included_defaults.sql"),
  "utf8"
);
const ADMIN_SEED = readFileSync(
  join(__dirname, "../../../../admin-panel/supabase/migrations/088_seed_custom_feature_included_defaults.sql"),
  "utf8"
);

const rows = [...SEED.matchAll(/\('([a-z0-9-]+)',\s*array\[([^\]]+)\]\)/g)].map((m) => ({
  id: m[1],
  keys: [...m[2].matchAll(/'([a-z]+:[a-z]+)'/g)].map((k) => k[1]),
}));

describe("included-feature seed (0116)", () => {
  it("parses the expected 13 features", () => {
    expect(rows).toHaveLength(13);
  });

  it("is byte-identical between mobile 0116 and admin 088", () => {
    expect(ADMIN_SEED).toBe(SEED);
  });

  it.each(["academic", "personal", "business"])(
    "%s: the Standard included set is a subset of the Advanced set",
    (type) => {
      const standard = rows.filter((r) => r.keys.includes(`${type}:standard`)).map((r) => r.id);
      const advanced = new Set(rows.filter((r) => r.keys.includes(`${type}:advanced`)).map((r) => r.id));
      expect(standard.filter((id) => !advanced.has(id))).toEqual([]);
    }
  );

  it("matches the approved per-tier counts", () => {
    const count = (k: string) => rows.filter((r) => r.keys.includes(k)).length;
    expect([
      count("academic:standard"), count("academic:advanced"),
      count("personal:standard"), count("personal:advanced"),
      count("business:standard"), count("business:advanced"),
    ]).toEqual([4, 7, 6, 9, 8, 12]);
  });
});
