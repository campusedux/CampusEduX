import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import TopUpForm from "./TopUpForm";

export default async function WalletPage() {
  const user = await requireUser();
  const supabase = createAuthedServerSupabase();

  const { data: txns } = await supabase
    .from("wallet_transactions")
    .select("id,type,category,amount,description,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const balance = (txns ?? []).reduce((sum, t) => sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Wallet</h1>
      <div className="mt-4 rounded-2xl border border-line bg-white p-6 shadow-card">
        <div className="text-xs text-ink-faint">Current balance</div>
        <div className="mt-1 text-3xl font-bold text-ink">{formatINR(balance)}</div>
        <TopUpForm />
      </div>

      <h2 className="mt-10 text-lg font-bold text-ink">Transaction history</h2>
      {!txns || txns.length === 0 ? (
        <EmptyState className="mt-3" title="No transactions yet" />
      ) : (
        <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <div className="text-ink">{t.description || t.category}</div>
                <div className="text-xs text-ink-faint">{timeAgo(t.created_at)}</div>
              </div>
              <div className={t.type === "credit" ? "font-semibold text-success" : "font-semibold text-danger"}>
                {t.type === "credit" ? "+" : "-"}
                {formatINR(t.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
