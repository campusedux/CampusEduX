import { useCallback, useEffect, useRef, useState } from "react";

/** Countdown gate for "Resend …" actions so they cannot be spammed. */
export function useResendCooldown(seconds = 30) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const start = useCallback(() => {
    stop();
    setSecondsLeft(seconds);
    timer.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stop();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [seconds]);

  useEffect(() => stop, []);

  return { secondsLeft, canResend: secondsLeft === 0, start };
}
