"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import { formatINR } from "@/lib/format";

export function AccountWalletCard({ balance, loading = false }: { balance: number | null; loading?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const busy = loading || pending;

  return (
    <section aria-labelledby="account-wallet-title" aria-busy={busy}
      className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary to-accent-violet p-4 text-white shadow-card">
      <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
      <h2 id="account-wallet-title" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
        <Wallet className="h-4 w-4" aria-hidden /> Wallet balance
      </h2>
      {busy ? (
        <p role="status" className="mt-2 text-sm">{pending ? "Retrying wallet balance…" : "Loading wallet balance…"}</p>
      ) : balance === null ? (
        <div className="mt-2">
          <p role="alert" className="text-sm">Wallet balance is unavailable. Please retry.</p>
          <button type="button" onClick={() => startTransition(() => router.refresh())}
            className="relative mt-2 min-h-11 rounded-lg border border-white/40 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Retry
          </button>
        </div>
      ) : (
        <p className="mt-1 font-display text-2xl font-semibold">{formatINR(balance)}</p>
      )}
      <Link href="/account/wallet" className="relative mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold hover:underline">
        View wallet <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </section>
  );
}
