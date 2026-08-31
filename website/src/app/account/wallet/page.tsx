import { requireUser } from "@/lib/auth";
import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { formatINR, timeAgo } from "@/lib/format";
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

  const balance = (txns ?? []).reduce((sum, t: any) => sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy">Wallet</h1>
      <div className="mt-4 border border-navy/10 bg-white p-6">
        <div className="text-xs text-slate">Current balance</div>
        <div className="mt-1 font-serif text-3xl text-navy">{formatINR(balance)}</div>
        <TopUpForm />
      </div>

      <h2 className="mt-10 font-serif text-lg text-navy">Transaction history</h2>
      {(!txns || txns.length === 0) ? (
        <div className="empty-state mt-3">No transactions yet.</div>
      ) : (
        <div className="mt-3 divide-y divide-navy/10 border-t border-navy/10">
          {txns.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="text-navy">{t.description || t.category}</div>
                <div className="text-xs text-slate">{timeAgo(t.created_at)}</div>
              </div>
              <div className={t.type === "credit" ? "text-emerald" : "text-red-700"}>
                {t.type === "credit" ? "+" : "-"}{formatINR(t.amount)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
