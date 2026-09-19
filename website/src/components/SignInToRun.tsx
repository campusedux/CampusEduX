import Link from "next/link";
import { SIGN_IN_BANNER_TEXT } from "@/lib/runErrors";

/** Friendly signed-out state shown in an Output panel (compiler + judge UIs). */
export function SignInToRun({ next }: { next: string }) {
  const q = encodeURIComponent(next);
  return (
    <div role="status" className="space-y-3">
      <p className="text-slate-200">{SIGN_IN_BANNER_TEXT}</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/login?next=${q}`}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-white transition hover:bg-primary-600"
        >
          Sign in
        </Link>
        <Link
          href={`/register?next=${q}`}
          className="inline-flex h-9 items-center rounded-lg border border-white/20 px-3.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
