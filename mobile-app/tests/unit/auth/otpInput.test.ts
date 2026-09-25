import { applyOtpBackspace, applyOtpChange, emptyOtp } from "@/auth/otpInput";

describe("applyOtpChange", () => {
  it("single digit fills the box and advances", () => {
    const r = applyOtpChange(emptyOtp(), 2, "7");
    expect(r.digits[2]).toBe("7");
    expect(r.focusIndex).toBe(3);
  });
  it("does not advance past the last box", () => {
    expect(applyOtpChange(emptyOtp(), 5, "1").focusIndex).toBeNull();
  });
  it("strips non-digits and clearing keeps focus", () => {
    expect(applyOtpChange(emptyOtp(), 0, "a").digits.join("")).toBe("");
    const withDigit = applyOtpChange(emptyOtp(), 1, "4").digits;
    const cleared = applyOtpChange(withDigit, 1, "");
    expect(cleared.digits[1]).toBe("");
    expect(cleared.focusIndex).toBeNull();
  });
  it("a pasted 6-digit code fills every box from the first, whichever box received it", () => {
    const r = applyOtpChange(emptyOtp(), 3, "123 456");
    expect(r.digits.join("")).toBe("123456");
    expect(r.focusIndex).toBe(5);
  });
  it("typing over a filled box replaces it", () => {
    const start = ["1", "", "", "", "", ""];
    expect(applyOtpChange(start, 0, "19").digits[0]).toBe("9");
  });
  it("partial paste spreads from the current box and clamps", () => {
    const r = applyOtpChange(emptyOtp(), 4, "9876");
    expect(r.digits).toEqual(["", "", "", "", "9", "8"]);
  });
});

describe("applyOtpBackspace", () => {
  it("empty box clears previous and moves back", () => {
    const r = applyOtpBackspace(["1", "2", "", "", "", ""], 2);
    expect(r.digits.slice(0, 2)).toEqual(["1", ""]);
    expect(r.focusIndex).toBe(1);
  });
  it("filled box or first box: no focus change", () => {
    expect(applyOtpBackspace(["1", "", "", "", "", ""], 0).focusIndex).toBeNull();
    expect(applyOtpBackspace(["1", "2", "", "", "", ""], 1).focusIndex).toBeNull();
  });
});
