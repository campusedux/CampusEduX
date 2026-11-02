import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useProjectDetail } from "@/hooks/useProjects";
import { notify } from "@/lib/notify";
import { usePurchaseFlow } from "@/hooks/usePayment";
import type { ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "Payment">;
type Rte = RouteProp<ProjectStackParamList, "Payment">;

type Method = "upi" | "card" | "netbanking" | "wallet";

const METHODS: { id: Method; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "upi", label: "UPI / Google Pay", icon: "phone-portrait-outline" },
  { id: "card", label: "Debit / Credit Card", icon: "card-outline" },
  { id: "netbanking", label: "Net Banking", icon: "business-outline" },
  { id: "wallet", label: "Wallet", icon: "wallet-outline" },
];

/**
 * Razorpay's native checkout sheet handles the actual method selection
 * (UPI apps, card entry, netbanking, wallets) once launched, so this
 * screen's method list is a pre-selection UX step; the real charge always
 * happens inside RazorpayCheckout via usePurchaseFlow.
 */
export function PaymentScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: project, isLoading, isError, refetch } = useProjectDetail(params.projectId);
  const { purchase, isProcessing } = usePurchaseFlow(params.projectId);
  const [method, setMethod] = useState<Method>("upi");

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading..." /></Screen>;
  if (isError || !project) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load project." onRetry={refetch} /></Screen>;

  const platformFee = Math.round((project.price * project.platformFeePercent) / 100);
  const total = project.price + platformFee;

  const handlePay = async () => {
    const result = await purchase();
    if (result.status === "success") {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: "AllProjects" }, { name: "PaymentSuccess", params: { orderId: result.orderId } }],
        })
      );
    } else if (result.status === "pending" || !result.orderId) {
      notify(result.status === "pending" ? "Verification pending" : "Payment not completed", result.message ?? "Please retry.");
    } else if (result.status === "failed") {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: "AllProjects" }, { name: "PaymentFailed", params: { orderId: result.orderId } }],
        })
      );
    }
    // "cancelled" -> stay on this screen so the user can retry
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Payment</Text>
      </View>

      <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: "#4F39F6" }}>
        <Text className="text-white font-bold" numberOfLines={1}>{project.title}</Text>
        <Text className="text-indigo-100 text-2xl font-bold mt-1">₹{total}</Text>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Choose Payment Method</Text>
      {METHODS.map((m) => {
        const active = method === m.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => setMethod(m.id)}
            className="flex-row items-center justify-between border rounded-xl px-4 py-3.5 mb-2"
            style={{ borderColor: active ? "#4F39F6" : "#E5E7EB", backgroundColor: active ? "#EEF0FF" : "#fff" }}
          >
            <View className="flex-row items-center">
              <Ionicons name={m.icon} size={20} color={active ? "#4F39F6" : "#6B7280"} />
              <Text className={`ml-3 ${active ? "text-primary font-semibold" : "text-gray-700"}`}>{m.label}</Text>
            </View>
            <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={20} color={active ? "#4F39F6" : "#D1D5DB"} />
          </Pressable>
        );
      })}

      <Text className="font-bold text-gray-900 mt-5 mb-2">Price Details</Text>
      <View className="mb-1 flex-row justify-between">
        <Text className="text-gray-500">Price</Text>
        <Text className="text-gray-900">₹{project.price}</Text>
      </View>
      <View className="mb-4 flex-row justify-between">
        <Text className="text-gray-500">Platform Fee</Text>
        <Text className="text-gray-900">₹{platformFee}</Text>
      </View>

      <View className="flex-row items-center mb-5">
        <Ionicons name="lock-closed" size={14} color="#16A34A" />
        <Text className="text-gray-400 text-xs ml-2">Your payment information is safe and encrypted</Text>
      </View>

      <Button label={`Pay ₹${total}`} loading={isProcessing} onPress={handlePay} />
    </Screen>
  );
}

export default PaymentScreen;
