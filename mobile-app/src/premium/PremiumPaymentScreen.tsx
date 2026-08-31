import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { usePremiumPlans, useSubscribeToPlan } from "@/hooks/usePremium";
import type { PremiumStackParamList } from "@/types";

type Rte = RouteProp<PremiumStackParamList, "PremiumPayment">;

type Method = "upi" | "card" | "netbanking" | "wallet";
const METHODS: { id: Method; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "upi", label: "UPI / Google Pay", icon: "phone-portrait-outline" },
  { id: "card", label: "Debit / Credit Card", icon: "card-outline" },
  { id: "netbanking", label: "Net Banking", icon: "business-outline" },
  { id: "wallet", label: "Wallet", icon: "wallet-outline" },
];
const GST_PERCENT = 18;

export function PremiumPaymentScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: plans, isLoading, isError, refetch } = usePremiumPlans();
  const { subscribe, isProcessing } = useSubscribeToPlan();
  const [method, setMethod] = useState<Method>("upi");

  const plan = plans?.find((p) => p.id === params.planId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading plan..." /></Screen>;
  if (isError || !plan) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this plan." onRetry={refetch} /></Screen>;

  const price = params.billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const gst = Math.round(price * (GST_PERCENT / 100) * 100) / 100;
  const total = price + gst;

  const handlePay = async () => {
    const result = await subscribe(params.planId, params.billingCycle);
    if (result.status === "success") {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "PremiumSuccess", params: { subscriptionId: result.subscriptionId } }] })
      );
    } else if (result.status === "failed") {
      notify("Payment Failed", result.message);
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
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white font-bold">{plan.name} Plan</Text>
          <View className="bg-white/20 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-semibold capitalize">{params.billingCycle}</Text>
          </View>
        </View>
        <Text className="text-indigo-100 text-2xl font-bold mt-1">₹{total.toFixed(2)}</Text>
        <Text className="text-indigo-100 text-xs mt-0.5">Billed {params.billingCycle}. Cancel anytime.</Text>
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
        <Text className="text-gray-500">{plan.name} Plan ({params.billingCycle})</Text>
        <Text className="text-gray-900">₹{price.toFixed(2)}</Text>
      </View>
      <View className="mb-4 flex-row justify-between">
        <Text className="text-gray-500">GST ({GST_PERCENT}%)</Text>
        <Text className="text-gray-900">₹{gst.toFixed(2)}</Text>
      </View>
      <View className="mb-5 flex-row justify-between border-t border-gray-100 pt-3">
        <Text className="font-bold text-gray-900">Total Amount</Text>
        <Text className="font-bold text-primary text-lg">₹{total.toFixed(2)}</Text>
      </View>

      <View className="flex-row items-center mb-5">
        <Ionicons name="lock-closed" size={14} color="#16A34A" />
        <Text className="text-gray-400 text-xs ml-2">Your payment information is safe and encrypted</Text>
      </View>

      <Button label={`Pay ₹${total.toFixed(2)}`} loading={isProcessing} onPress={handlePay} />
    </Screen>
  );
}

export default PremiumPaymentScreen;
