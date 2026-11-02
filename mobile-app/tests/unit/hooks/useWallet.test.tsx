import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { id: "u-1", fullName: "Rohan", email: "r@e.com", mobileNumber: "9" } }),
}));

const mockGetWalletSummary = jest.fn();
jest.mock("@/services/wallet.service", () => ({
  walletService: {
    getWalletSummary: (...args: unknown[]) => mockGetWalletSummary(...args),
    getAllTransactions: jest.fn(),
  },
}));

import { useWalletSummary, walletQueryKeys } from "@/hooks/useWallet";

const renderedTrees: TestRenderer.ReactTestRenderer[] = [];
const queryClients: QueryClient[] = [];
afterEach(async () => {
  await act(async () => { for (const tree of renderedTrees.splice(0)) tree.unmount(); });
  for (const client of queryClients.splice(0)) client.clear();
});

async function renderHookValue<T>(useHook: () => T): Promise<{ get: () => T }> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  queryClients.push(client);
  const box: { value?: T } = {};
  function Probe() {
    box.value = useHook();
    return null;
  }
  await act(async () => {
    renderedTrees.push(TestRenderer.create(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>
    ));
  });
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
  return { get: () => box.value as T };
}

describe("useWalletSummary", () => {
  beforeEach(() => mockGetWalletSummary.mockReset());

  it("exposes stable query keys", () => {
    expect(walletQueryKeys.summary).toEqual(["wallet", "summary"]);
    expect(walletQueryKeys.transactions).toEqual(["wallet", "transactions"]);
  });

  it("scopes the cache entry to the signed-in user (MOB-07)", async () => {
    mockGetWalletSummary.mockResolvedValue({ balance: 1 });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClients.push(client);
    function Probe() {
      useWalletSummary();
      return null;
    }
    await act(async () => {
      renderedTrees.push(TestRenderer.create(
        <QueryClientProvider client={client}>
          <Probe />
        </QueryClientProvider>
      ));
    });
    for (let i = 0; i < 5; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(client.getQueryData([...walletQueryKeys.summary, "u-1"])).toEqual({ balance: 1 });
    expect(client.getQueryData(walletQueryKeys.summary)).toBeUndefined();
  });

  it("calls walletService.getWalletSummary with the signed-in user id and returns its data", async () => {
    const summary = {
      balance: 750,
      totalAdded: 500,
      totalUsed: 0,
      totalCashback: 50,
      totalReferralEarnings: 200,
      recentTransactions: [],
    };
    mockGetWalletSummary.mockResolvedValue(summary);

    const hook = await renderHookValue(() => useWalletSummary());

    expect(mockGetWalletSummary).toHaveBeenCalledWith("u-1");
    expect(hook.get().data).toEqual(summary);
    expect(hook.get().isSuccess).toBe(true);
  });
});
