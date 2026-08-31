jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
jest.mock("react-native-razorpay", () => ({ __esModule: true, default: { open: jest.fn() } }));

import { walletService } from "@/services/wallet.service";
import { resetSupabaseMock, setTableResult, setFunctionResult, supabase } from "../../mocks/supabase.mock";
import { walletTransactionRows } from "../../mocks/users.mock";

beforeEach(() => resetSupabaseMock());

describe("walletService.getWalletSummary", () => {
  it("computes balance and category totals from the ledger", async () => {
    setTableResult("wallet_transactions", { data: walletTransactionRows });

    const summary = await walletService.getWalletSummary("u-1");

    // credits: 500 + 200 + 50 = 750 ; withdrawal debits: 0
    expect(summary.balance).toBe(750);
    expect(summary.totalAdded).toBe(500);
    expect(summary.totalReferralEarnings).toBe(200);
    expect(summary.totalCashback).toBe(50);
    // "used" = project + mock-test debits
    expect(summary.totalUsed).toBe(299);
    expect(summary.recentTransactions).toHaveLength(4);
  });

  it("returns a zeroed summary for a new student with an empty ledger", async () => {
    setTableResult("wallet_transactions", { data: [] });

    const summary = await walletService.getWalletSummary("u-1");

    expect(summary).toEqual({
      balance: 0,
      totalAdded: 0,
      totalUsed: 0,
      totalCashback: 0,
      totalReferralEarnings: 0,
      recentTransactions: [],
    });
  });

  it("throws instead of returning sample balances when the query fails (money-safety)", async () => {
    setTableResult("wallet_transactions", { error: { message: "relation does not exist" } });

    // A real fetch failure must never render fabricated money figures — the
    // hook surfaces this as `isError` and the screen shows <ErrorState>.
    await expect(walletService.getWalletSummary("u-1")).rejects.toThrow("relation does not exist");
  });

  it("returns an empty transaction list for a new student (not the sample list)", async () => {
    setTableResult("wallet_transactions", { data: [] });

    expect(await walletService.getAllTransactions("u-1")).toEqual([]);
  });

  it("getAllTransactions throws instead of returning the sample ledger when the query fails", async () => {
    setTableResult("wallet_transactions", { error: { message: "relation does not exist" } });

    await expect(walletService.getAllTransactions("u-1")).rejects.toThrow("relation does not exist");
  });
});

describe("walletService.createTopUpOrder", () => {
  it("passes the amount to the Edge Function and returns its order fields", async () => {
    setFunctionResult("create-wallet-topup-order", {
      data: {
        orderId: "wt-order-1",
        razorpayOrderId: "order_rzp_1",
        razorpayKeyId: "rzp_test_1",
        amount: 50000,
        currency: "INR",
      },
    });

    const order = await walletService.createTopUpOrder(500);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("create-wallet-topup-order", { body: { amount: 500 } });
    expect(order).toEqual({
      orderId: "wt-order-1",
      razorpayOrderId: "order_rzp_1",
      razorpayKeyId: "rzp_test_1",
      amount: 50000,
      currency: "INR",
    });
  });
});

describe("walletService.verifyTopUp", () => {
  it("throws when the Edge Function reports an error", async () => {
    setFunctionResult("verify-wallet-topup-payment", { error: { message: "signature mismatch" } });

    await expect(
      walletService.verifyTopUp({
        orderId: "o",
        razorpayOrderId: "ro",
        razorpayPaymentId: "rp",
        razorpaySignature: "sig",
      })
    ).rejects.toThrow("signature mismatch");
  });
});
