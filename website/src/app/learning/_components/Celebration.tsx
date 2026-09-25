"use client";

import Link from "next/link";
import { ArrowRight, PartyPopper, Trophy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

const COLORS = ["#4F39F6", "#7C3AED", "#EC4899", "#F59E0B", "#16A34A", "#3B82F6"];
// Deterministic spread (no Math.random during render).
const PIECES = Array.from({ length: 36 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  x: `${((i * 53) % 41) - 20}vw`,
  r: `${((i * 97) % 720) - 360}deg`,
  d: `${1.6 + ((i * 29) % 12) / 10}s`,
  delay: `${((i * 13) % 10) / 20}s`,
  c: COLORS[i % COLORS.length],
}));

export type CelebrationKind = "section" | "course";

/**
 * Light "you finished it" moment: CSS confetti + a small success dialog with a
 * next step. Shown when the last lesson of a section / the course is marked
 * complete. No animation library.
 */
export function Celebration({
  kind,
  name,
  open,
  onClose,
  next,
}: {
  kind: CelebrationKind;
  /** Section or course name. */
  name: string;
  open: boolean;
  onClose: () => void;
  next: { href: string; label: string };
}) {
  if (!open) return null;
  const Icon = kind === "course" ? Trophy : PartyPopper;
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden>
        {PIECES.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={
              { left: p.left, animationDelay: p.delay, "--x": p.x, "--r": p.r, "--d": p.d, "--c": p.c } as React.CSSProperties
            }
          />
        ))}
      </div>
      <Modal open={open} onClose={onClose} ariaLabel={kind === "course" ? "Course complete" : "Section complete"} className="max-w-md">
        <div className="py-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-warning to-accent-pink text-white shadow-glow">
            <Icon className="h-8 w-8" aria-hidden />
          </span>
          <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
            {kind === "course" ? "Course complete!" : "Section complete!"}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {kind === "course" ? (
              <>
                You finished every lesson in <span className="font-semibold text-ink">{name}</span>. Great work.
              </>
            ) : (
              <>
                You finished <span className="font-semibold text-ink">{name}</span>. Keep the momentum going.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href={next.href} onClick={onClose} className="btn-primary">
              {next.label} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button type="button" onClick={onClose} className="btn-ghost">
              Stay here
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Celebration;
