import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { describeRunFailure } from "@/lib/runErrors";
import { SignInToRun } from "@/components/SignInToRun";

describe("describeRunFailure", () => {
  it("401 -> auth", () => {
    const f = describeRunFailure(401, { error: "Sign in to run code." });
    expect(f.kind).toBe("auth");
    expect(f.message).toBe("Sign in to run and submit code — it's free.");
  });
  it("429 uses body retry_after, then header, then generic", () => {
    expect(describeRunFailure(429, { retry_after: 12 }).message).toBe(
      "You're running code too fast — try again in 12 seconds.",
    );
    const h = describeRunFailure(429, { error: "x" }, "1");
    expect(h.retryAfter).toBe(1);
    expect(h.message).toBe("You're running code too fast — try again in 1 second.");
    expect(describeRunFailure(429, null, null).message).toBe("You're running code too fast — try again in a few seconds.");
    expect(describeRunFailure(429, null, "abc").retryAfter).toBeUndefined();
  });
  it("502/503/504 -> generic unavailable without internal details", () => {
    for (const s of [502, 503, 504]) {
      const f = describeRunFailure(s, { error: "Judge is not configured. secret" });
      expect(f.kind).toBe("unavailable");
      expect(f.message).toBe("Code execution is temporarily unavailable.");
    }
  });
  it("other statuses use a 4xx server message or a generic fallback", () => {
    expect(describeRunFailure(400, { error: "Bad language" }).message).toBe("Bad language");
    expect(describeRunFailure(500, { error: "stack trace" }).message).not.toContain("stack");
    expect(describeRunFailure(418, undefined).kind).toBe("other");
  });
});

describe("SignInToRun", () => {
  it("renders banner and encoded login/register links", () => {
    const html = renderToStaticMarkup(<SignInToRun next="/coding-problems/two-sum?x=1&y=2" />);
    expect(html).toContain("Sign in to run and submit code");
    expect(html).toContain('href="/login?next=%2Fcoding-problems%2Ftwo-sum%3Fx%3D1%26y%3D2"');
    expect(html).toContain('href="/register?next=%2Fcoding-problems%2Ftwo-sum%3Fx%3D1%26y%3D2"');
    expect(html).toContain("Create account");
  });
});
