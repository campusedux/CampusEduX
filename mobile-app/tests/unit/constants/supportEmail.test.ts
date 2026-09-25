import fs from "fs";
import path from "path";
import { BRAND } from "@/constants/brand";
import { LEGAL } from "@/constants/legal";

const OLD_ADDRESSES = ["support@campusedux.app", "privacy@campusedux.app", "grievance@campusedux.app", "legal@campusedux.app"];

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|json|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("support email has one source of truth (legal.config.json)", () => {
  it("BRAND.supportEmail reads the config value", () => {
    expect(LEGAL.supportEmail).toBe("campusedux@gmail.com");
    expect(BRAND.supportEmail).toBe(LEGAL.supportEmail);
  });

  it("no source file or generated legal page still carries an old @campusedux.app contact address", () => {
    const root = path.resolve(__dirname, "../../..");
    const files = [...walk(path.join(root, "src")), ...walk(path.join(root, "legal-site"))];
    const offenders = files.filter((f) => OLD_ADDRESSES.some((a) => fs.readFileSync(f, "utf8").includes(a)));
    expect(offenders.map((f) => path.relative(root, f))).toEqual([]);
  });
});
