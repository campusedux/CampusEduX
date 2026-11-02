import { createAuthedServerSupabase } from "@/lib/supabase/authed-server";
import { computeWalletBalance, type WalletBalanceTxn } from "@/lib/wallet";
import { AccountWalletCard } from "./AccountWalletCard";

async function loadBalance(userId: string): Promise<number | null> {
  try {
    const supabase = await createAuthedServerSupabase();
    const transactions: WalletBalanceTxn[] = [];
    let expectedCount: number | null = null;
    // Read the complete own-row ledger; a PostgREST row cap must never produce a partial balance.
    for (;;) {
      const { data, error, count } = await supabase.from("wallet_transactions")
        .select("type,category,amount", { count: "exact" })
        .eq("user_id", userId).order("id")
        .range(transactions.length, transactions.length + 999);
      if (error || !Array.isArray(data) || count === null ||
          (expectedCount !== null && count !== expectedCount)) return null;
      expectedCount = count;
      if (data.some(row => !row || (row.type !== "credit" && row.type !== "debit") ||
          typeof row.category !== "string" ||
          (typeof row.amount !== "number" && typeof row.amount !== "string") ||
          (typeof row.amount === "string" && row.amount.trim() === "") ||
          !Number.isFinite(Number(row.amount)) || Number(row.amount) < 0)) return null;
      transactions.push(...data);
      if (transactions.length === count) break;
      if (data.length === 0 || transactions.length > count) return null;
    }
    const balance = computeWalletBalance(transactions);
    return Number.isFinite(balance) ? balance : null;
  } catch {
    // A failed wallet read must stay inside this card, including rejected network requests.
    return null;
  }
}

/** userId comes from AccountContent's existing requireUser gate; the session client also enforces RLS. */
export async function AccountWalletSummary({ userId }: { userId: string }) {
  return <AccountWalletCard balance={await loadBalance(userId)} />;
}
