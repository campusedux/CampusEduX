import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "../../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("MOB-11: no raw multi-button Alert.alert (dead on web)", () => {
  it("only lib/notify.ts uses Alert.alert with a button array", () => {
    const offenders = walk(path.join(root, "src"))
      .filter((f) => !f.endsWith(path.join("lib", "notify.ts")))
      .filter((f) => /Alert\.alert\(/.test(fs.readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("MOB-10/20/21: dead/placeholder UI removed", () => {
  it("ApplyJob dead form is gone", () => {
    expect(fs.existsSync(path.join(root, "src/jobs/ApplyJobScreen.tsx"))).toBe(false);
    expect(read("src/navigation/JobNavigator.tsx")).not.toMatch(/ApplyJob/);
  });
  it("no placeholder phone number or Google mission blurb", () => {
    for (const f of ["src/settings/ContactSupportScreen.tsx", "src/myProjects/SupportScreen.tsx"]) {
      expect(read(f)).not.toMatch(/9876543210|98765 43210|tel:/);
    }
    expect(read("src/jobs/JobDetailsScreen.tsx")).not.toMatch(/organize its industry/);
  });
  it("resume upload copy is honest (no drag & drop)", () => {
    expect(read("src/jobs/ResumeUploadScreen.tsx")).not.toMatch(/Drag & drop/i);
  });
});

describe("MOB-30/31: EAS + dependency config", () => {
  const app = JSON.parse(read("app.json")).expo;
  const eas = JSON.parse(read("eas.json"));
  const pkg = JSON.parse(read("package.json"));

  it("declares build versioning and runtimeVersion", () => {
    expect(app.android.versionCode).toBe(1);
    expect(app.ios.buildNumber).toBe("1");
    expect(app.runtimeVersion).toEqual({ policy: "appVersion" });
  });
  it("eas.json uses remote versioning and per-profile environments, with no secrets", () => {
    expect(eas.cli.appVersionSource).toBe("remote");
    for (const p of ["development", "preview", "production"]) expect(eas.build[p].environment).toBe(p);
    expect(JSON.stringify(eas)).not.toMatch(/sb_(publishable|secret)_|eyJ/);
  });
  it("does not depend on expo-modules-core directly", () => {
    expect(pkg.dependencies["expo-modules-core"]).toBeUndefined();
  });
});
