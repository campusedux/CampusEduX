import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { useResendCooldown } from "@/auth/useResendCooldown";

describe("useResendCooldown", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("blocks resend for the cooldown then allows it again", () => {
    const box: { v?: ReturnType<typeof useResendCooldown> } = {};
    function Probe() {
      box.v = useResendCooldown(3);
      return null;
    }
    let r!: TestRenderer.ReactTestRenderer;
    act(() => {
      r = TestRenderer.create(<Probe />);
    });
    expect(box.v!.canResend).toBe(true);
    act(() => box.v!.start());
    expect(box.v!.canResend).toBe(false);
    expect(box.v!.secondsLeft).toBe(3);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(box.v!.canResend).toBe(true);
    act(() => r.unmount());
  });
});
