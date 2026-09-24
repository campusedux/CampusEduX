import { describe, expect, it } from "vitest";
import { detectCallout } from "@/lib/callouts";

describe("detectCallout", () => {
  it("recognises the two label shapes found in live content", () => {
    expect(detectCallout("**Definition:** Software testing is …")).toEqual({
      variant: "definition",
      label: "Definition",
      body: "Software testing is …",
    });
    expect(detectCallout("**Teacher's simple view:** Generative AI is not …")).toMatchObject({
      variant: "simple",
      label: "Teacher's simple view",
    });
  });

  it("supports Tip / Note / Warning in bold or plain form", () => {
    expect(detectCallout("**Tip**: use a Set")?.variant).toBe("tip");
    expect(detectCallout("Note: arrays are 0-indexed")?.variant).toBe("note");
    expect(detectCallout("**Common Mistakes:** commas in numbers")?.variant).toBe("warning");
    expect(detectCallout("**Key takeaway:** index selectively")?.variant).toBe("key");
  });

  it("leaves ordinary quotes, REPL output and unknown labels alone", () => {
    expect(detectCallout("Programs must be written for people to read.")).toBeNull();
    expect(detectCallout(">> print(2 + 3)")).toBeNull();
    expect(detectCallout(">>>>>> feature-login")).toBeNull();
    expect(detectCallout("**Output:** 5")).toBeNull();
    expect(detectCallout("Time: 10:30")).toBeNull();
  });
});
