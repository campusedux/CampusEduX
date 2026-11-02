import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const api = vi.hoisted(() => ({ client: vi.fn(), read: vi.fn(), refresh: vi.fn(), pending: false }));
vi.mock("@/lib/supabase/authed-server", () => ({ createAuthedServerSupabase: api.client }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: api.refresh }) }));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useTransition: () => [api.pending, (callback: () => void) => callback()],
}));
import { AccountWalletSummary } from "@/components/account/AccountWalletSummary";
import { AccountWalletCard } from "@/components/account/AccountWalletCard";
import { formatINR } from "@/lib/format";

let query: { select: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn>; order: ReturnType<typeof vi.fn>; range: typeof api.read };
const credit = { type: "credit", category: "added_money", amount: "250.00" };
const render = async () => renderToStaticMarkup(await AccountWalletSummary({ userId: "fixture-owner" }));

beforeEach(() => {
  api.pending = false;
  api.read.mockReset().mockResolvedValue({ data: [credit], error: null, count: 1 });
  query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: api.read };
  api.client.mockReset().mockResolvedValue({ from: vi.fn((table: string) => {
    expect(table).toBe("wallet_transactions");
    return query;
  }) });
});

describe("isolated Account wallet read", () => {
  it("uses the authenticated own-row ledger and the existing balance calculation", async () => {
    api.read.mockResolvedValue({ data: [credit,
      { type: "debit", category: "withdrawal", amount: "50.00" },
      { type: "debit", category: "project_purchase", amount: "999.00" },
      { type: "credit", category: "withdrawal", amount: "25.00" },
    ], error: null, count: 4 });
    expect(await render()).toContain(formatINR(225));
    expect(query.select).toHaveBeenCalledWith("type,category,amount", { count: "exact" });
    expect(query.eq).toHaveBeenCalledWith("user_id", "fixture-owner");
    expect(query.order).toHaveBeenCalledWith("id");
  });

  it("displays a genuine zero only after a successful empty-ledger read", async () => {
    api.read.mockResolvedValue({ data: [], error: null, count: 0 });
    const html = await render();
    expect(html).toContain(formatINR(0));
    expect(html).not.toContain("Retry");
  });

  it.each(["query", "denied", "missing", "network", "client", "partial", "changed"])(
    "contains a %s failure without a fabricated balance or provider details", async mode => {
      const error = { message: "private-provider-detail", code: mode === "denied" ? "42501" : "PGRST202" };
      if (mode === "query" || mode === "denied") api.read.mockResolvedValue({ data: [credit], error, count: 1 });
      if (mode === "missing") api.read.mockResolvedValue({ data: null, error: null, count: null });
      if (mode === "network") api.read.mockRejectedValue(new Error(error.message));
      if (mode === "client") api.client.mockRejectedValue(new Error(error.message));
      if (mode === "partial") api.read.mockResolvedValueOnce({ data: [credit], error: null, count: 2 })
        .mockResolvedValueOnce({ data: [], error: null, count: 2 });
      if (mode === "changed") api.read.mockResolvedValueOnce({ data: [credit], error: null, count: 2 })
        .mockResolvedValueOnce({ data: [credit], error: null, count: 3 });
      const html = await render();
      expect(html).toContain('role="alert"');
      expect(html).toContain("Wallet balance is unavailable");
      expect(html).toContain("Retry");
      expect(html).toContain('href="/account/wallet"');
      expect(html).not.toContain("₹");
      expect(html).not.toContain(error.message);
    },
  );

  it.each([null, undefined, "", " ", "invalid", "Infinity", -1, true])("rejects an invalid ledger amount %s", async amount => {
    api.read.mockResolvedValue({ data: [{ ...credit, amount }], error: null, count: 1 });
    expect(await render()).toContain("Wallet balance is unavailable");
  });

  it("reads all pages, including when the server cap is smaller than the requested page", async () => {
    api.read.mockResolvedValueOnce({ data: [credit], error: null, count: 2 })
      .mockResolvedValueOnce({ data: [{ type: "debit", category: "withdrawal", amount: 50 }], error: null, count: 2 });
    expect(await render()).toContain(formatINR(200));
    expect(api.read.mock.calls).toEqual([[0, 999], [1, 1000]]);
  });

  it("recovers on a new read after a failed request", async () => {
    api.read.mockRejectedValueOnce(new Error("network unavailable"));
    expect(await render()).toContain("Retry");
    expect(await render()).toContain(formatINR(250));
    expect(api.read).toHaveBeenCalledTimes(2);
  });
});

describe("wallet recovery presentation", () => {
  it.each([false, true])("shows a localized loading state while pending=%s", pending => {
    api.pending = pending;
    const html = renderToStaticMarkup(createElement(AccountWalletCard, { balance: null, loading: !pending }));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("₹");
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("<button");
  });

  it("retries only on user interaction through the existing router refresh pattern", () => {
    const tree = AccountWalletCard({ balance: null });
    expect(api.refresh).not.toHaveBeenCalled();
    function clickRetry(node: ReactNode): boolean {
      if (!isValidElement(node)) return false;
      const element = node as ReactElement<{ onClick?: () => void; children?: ReactNode }>;
      if (element.type === "button" && element.props.onClick) { element.props.onClick(); return true; }
      return (Array.isArray(element.props.children) ? element.props.children : [element.props.children]).some(clickRetry);
    }
    expect(clickRetry(tree)).toBe(true);
    expect(api.refresh).toHaveBeenCalledOnce();
  });
});
