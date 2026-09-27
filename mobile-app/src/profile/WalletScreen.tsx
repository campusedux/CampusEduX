import React, { useState } from "react";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useWalletSummary, useWalletTopUp, useRequestWithdrawal, useWalletTransactions } from "@/hooks/useWallet";
import { isValidUpiId } from "@/services/wallet.service";
import type { ProfileStackParamList, WalletTransaction, WithdrawalStatus } from "@/types";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "Wallet">;

const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected · refunded",
  paid: "Paid",
};

const CATEGORY_META: Record<WalletTransaction["category"], { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  referral_bonus: { icon: "gift-outline", label: "Referral Bonus" },
  added_money: { icon: "add-circle-outline", label: "Added Money" },
  project_purchase: { icon: "cart-outline", label: "Project Purchase" },
  mock_test_purchase: { icon: "document-text-outline", label: "Mock Test Purchase" },
  cashback: { icon: "pricetag-outline", label: "Cashback" },
  withdrawal: { icon: "arrow-up-circle-outline", label: "Withdrawal" },
};

export function WalletScreen() {
  const navigation = useNavigation<Nav>();
  const { data: wallet, isLoading, isError, refetch } = useWalletSummary();
  const { topUp, isProcessing } = useWalletTopUp();
  const requestWithdrawal = useRequestWithdrawal();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { data: allTransactions } = useWalletTransactions();

  const [addMoneyVisible, setAddMoneyVisible] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [upiId, setUpiId] = useState("");

  const handleAddMoney = async () => {
    const amount = Number(amountText);
    if (!amount || amount < 10) {
      notify("Enter a valid amount", "Minimum top-up amount is ₹10.");
      return;
    }
    const result = await topUp(amount);
    if (result.status === "success") {
      setAddMoneyVisible(false);
      setAmountText("");
      notify("Money added", "Your wallet has been credited successfully.");
    } else if (result.status === "failed") {
      notify("Payment failed", result.message);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(amountText);
    if (!amount || amount < 1) {
      notify("Enter a valid amount", "Please enter an amount to withdraw.");
      return;
    }
    if (wallet && amount > wallet.balance) {
      notify("Insufficient balance", "You can't withdraw more than your wallet balance.");
      return;
    }
    if (!upiId.trim()) {
      notify("UPI ID required", "Please enter the UPI ID to withdraw to.");
      return;
    }
    if (!isValidUpiId(upiId)) {
      notify("Invalid UPI ID", "Enter a valid UPI ID, for example name@bank.");
      return;
    }
    try {
      await requestWithdrawal.mutateAsync({ amount, upiId: upiId.trim() });
      setWithdrawVisible(false);
      setAmountText("");
      setUpiId("");
      notify("Withdrawal requested", "The amount is on hold and will be sent to your UPI ID after review (3-5 business days).");
    } catch (error: any) {
      notify("Couldn't request withdrawal", error.message ?? "Please try again.");
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">My Wallet</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading wallet..." />
      ) : isError || !wallet ? (
        <ErrorState message="Couldn't load your wallet." onRetry={refetch} />
      ) : (
        <>
          <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
            <Text className="text-indigo-100 text-sm mb-1">Total Balance</Text>
            <Text className="text-white text-3xl font-bold">₹{wallet.balance.toLocaleString()}</Text>
          </View>

          <View className="flex-row justify-between mb-6" style={{ gap: 10 }}>
            <WalletAction icon="add-circle-outline" label="Add Money" onPress={() => setAddMoneyVisible(true)} />
            <WalletAction icon="arrow-up-circle-outline" label="Withdraw" onPress={() => setWithdrawVisible(true)} />
            <WalletAction icon="list-outline" label="Transactions" onPress={() => setShowAllTransactions((v) => !v)} />
          </View>

          <Text className="font-bold text-gray-900 mb-3">Wallet Summary</Text>
          <View className="border border-gray-100 rounded-2xl p-4 mb-6">
            <SummaryRow icon="add-circle-outline" label="Total Added" value={`₹${wallet.totalAdded.toLocaleString()}`} />
            <SummaryRow icon="remove-circle-outline" label="Total Used" value={`₹${wallet.totalUsed.toLocaleString()}`} />
            <SummaryRow icon="pricetag-outline" label="Total Cashback" value={`₹${wallet.totalCashback.toLocaleString()}`} />
            <SummaryRow icon="people-outline" label="Referral Earnings" value={`₹${wallet.totalReferralEarnings.toLocaleString()}`} last />
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-bold text-gray-900">{showAllTransactions ? "All Transactions" : "Recent Transactions"}</Text>
            <Pressable onPress={() => setShowAllTransactions((v) => !v)}>
              <Text className="text-primary text-sm font-medium">{showAllTransactions ? "Show Less" : "View All"}</Text>
            </Pressable>
          </View>
          {(() => {
            const list = showAllTransactions ? allTransactions ?? wallet.recentTransactions : wallet.recentTransactions;
            if (list.length === 0) return <Text className="text-gray-400 text-sm mb-6">No transactions yet.</Text>;
            return list.map((tx) => {
              const meta = CATEGORY_META[tx.category];
              return (
                <View key={tx.id} className="flex-row items-center justify-between border-b border-gray-100 py-3">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name={meta.icon} size={18} color="#4F39F6" />
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium text-sm">{meta.label}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()}
                        {tx.withdrawalStatus ? ` · ${WITHDRAWAL_STATUS_LABEL[tx.withdrawalStatus]}` : ""}
                      </Text>
                    </View>
                  </View>
                  <Text className={`font-semibold ${tx.type === "credit" ? "text-green-600" : "text-danger"}`}>
                    {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                  </Text>
                </View>
              );
            });
          })()}
          <View className="h-4" />
        </>
      )}

      <Modal visible={addMoneyVisible} transparent animationType="slide" onRequestClose={() => setAddMoneyVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Add Money to Wallet</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 text-gray-900 mb-4"
              style={{ height: 52 }}
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={amountText}
              onChangeText={setAmountText}
            />
            <Button label="Proceed to Pay" loading={isProcessing} onPress={handleAddMoney} className="mb-3" />
            <Button label="Cancel" variant="text" onPress={() => setAddMoneyVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={withdrawVisible} transparent animationType="slide" onRequestClose={() => setWithdrawVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-1">Withdraw Money</Text>
            <Text className="text-gray-400 text-sm mb-4">Processed within 3-5 business days.</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 text-gray-900 mb-3"
              style={{ height: 52 }}
              placeholder="Enter amount"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={amountText}
              onChangeText={setAmountText}
            />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 text-gray-900 mb-4"
              style={{ height: 52 }}
              placeholder="UPI ID (e.g. name@bank)"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              value={upiId}
              onChangeText={setUpiId}
            />
            <Button label="Request Withdrawal" loading={requestWithdrawal.isPending} onPress={handleWithdraw} className="mb-3" />
            <Button label="Cancel" variant="text" onPress={() => setWithdrawVisible(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function WalletAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center border border-gray-100 rounded-2xl py-4">
      <Ionicons name={icon} size={22} color="#4F39F6" />
      <Text className="text-gray-700 text-xs font-medium mt-2 text-center">{label}</Text>
    </Pressable>
  );
}

function SummaryRow({ icon, label, value, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between ${last ? "" : "mb-3"}`}>
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color="#6B7280" />
        <Text className="text-gray-500 text-sm ml-2">{label}</Text>
      </View>
      <Text className="text-gray-900 font-medium text-sm">{value}</Text>
    </View>
  );
}

export default WalletScreen;
