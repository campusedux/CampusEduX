import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";

const api = vi.hoisted(() => ({ user: vi.fn(), grids: vi.fn(), wallet: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireUser: api.user }));
vi.mock("@/lib/learning", () => ({ getLearningGrids: api.grids }));
vi.mock("@/lib/supabase/authed-server", () => ({
  createAuthedServerSupabase: () => ({
    from: () => {
      const query = {
        select: () => query, eq: () => query, order: () => query, range: api.wallet,
        maybeSingle: async () => ({ data: null, error: null }),
        then: (resolve: (r: unknown) => unknown) => Promise.resolve({ count: 0 }).then(resolve),
      };
      return query;
    },
  }),
}));
vi.mock("@/components/account/AccountLearningCard", () => ({ AccountLearningCard: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import AccountPage from "@/app/account/page";

const content = () => {
  const child = AccountPage().props.children;
  return child.type(child.props);
};

function streamAccount(onChunk?: (html: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const sink = new PassThrough();
    let html = "";
    sink.on("data", chunk => { html += chunk.toString(); onChunk?.(html); });
    sink.on("end", () => resolve(html));
    sink.on("error", reject);
    const stream = renderToPipeableStream(AccountPage(), {
      onShellReady() { stream.pipe(sink); },
      onError: reject,
    });
  });
}

beforeEach(() => {
  api.user.mockResolvedValue({ id: "fixture-user", fullName: "" });
  api.grids.mockRejectedValue(new Error("Learning catalog is unavailable"));
  api.wallet.mockReset().mockResolvedValue({ data: [], error: null, count: 0 });
});

describe("account optional reads", () => {
  it("still renders the authorized account when the public catalog fails", async () => {
    const html = await streamAccount();
    expect(html).toContain('href="/account/wallet"');
    expect(html).toContain("Welcome back");
    expect(api.user).toHaveBeenCalled();
  });

  it("continues to reject an account authorization failure", async () => {
    api.user.mockRejectedValueOnce(new Error("Sign in required"));
    await expect(content()).rejects.toThrow("Sign in required");
  });

  it.each(["query", "denied", "network"])("renders all other sections when the wallet has a %s failure", async mode => {
    if (mode === "network") api.wallet.mockRejectedValue(new Error("private-provider-detail"));
    else api.wallet.mockResolvedValue({ data: null, error: { code: mode === "denied" ? "42501" : "PGRST202" }, count: null });
    const html = await streamAccount();
    for (const path of ["purchases", "applications", "saved-projects", "referral", "saved-jobs", "resume"]) {
      expect(html).toContain(`href="/account/${path}"`);
    }
    expect(html).toContain("Welcome back");
    expect(html).toContain("Shortcuts");
    expect(html).toContain("Wallet balance is unavailable");
    expect(html).toContain("Retry");
    expect(html).not.toContain("₹");
    expect(html).not.toContain("private-provider-detail");
    expect(html).not.toContain("This page hit a snag");
    expect(api.wallet).toHaveBeenCalledOnce();
  });

  it("streams the dashboard and local loading state before the wallet resolves", async () => {
    let finishWallet!: (result: { data: never[]; error: null; count: number }) => void;
    api.wallet.mockReturnValue(new Promise(resolve => { finishWallet = resolve; }));
    let showShell!: (html: string) => void;
    const shell = new Promise<string>(resolve => { showShell = resolve; });
    const complete = streamAccount(html => {
      if (html.includes("Loading wallet balance") && html.includes("Shortcuts")) showShell(html);
    });
    try {
      const html = await shell;
      expect(html).toContain("Welcome back");
      expect(html).toContain('href="/account/purchases"');
      expect(html).not.toContain("₹");
      expect(api.wallet).toHaveBeenCalledOnce();
    } finally {
      finishWallet({ data: [], error: null, count: 0 });
    }
    expect(await complete).toContain("₹0");
  });
});
