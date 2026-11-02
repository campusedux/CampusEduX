import Link from "next/link";
import StepBar from "./StepBar";

export default function FlowLayout({ current, children }: { current: 0 | 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <div className="custom-project-flow mx-auto max-w-[1120px] px-4 py-6 pb-28 sm:px-6">
      <style>{`body:has(.custom-project-flow) > footer { display: none; }`}</style>
      <StepBar current={current} />
      {children}
      <nav aria-label="Legal and support" className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-ink-muted">
        <Link href="/privacy-policy">Privacy</Link><span aria-hidden>·</span>
        <Link href="/terms">Terms</Link><span aria-hidden>·</span>
        <Link href="/refund-policy">Refund</Link><span aria-hidden>·</span>
        <Link href="/support">Support</Link>
      </nav>
    </div>
  );
}
