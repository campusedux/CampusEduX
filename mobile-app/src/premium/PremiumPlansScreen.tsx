import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { usePremiumPlans } from "@/hooks/usePremium";
import type { PremiumStackParamList, PremiumPlan, BillingCycle } from "@/types";

type Nav = NativeStackNavigationProp<PremiumStackParamList, "PremiumPlans">;

const HERO_HIGHLIGHTS = [
  "Access to All Projects",
  "Premium Placement Prep",
  "Unlimited Mock Tests",
  "Resume Analyzer (ATS)",
  "Priority Support",
];

export function PremiumPlansScreen() {
  const navigation = useNavigation<Nav>();
  const { data: plans, isLoading, isError, refetch } = usePremiumPlans();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (plans && !selectedPlanId) {
      setSelectedPlanId(plans.find((p) => p.isPopular)?.id ?? plans[0]?.id ?? null);
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Premium Plans</Text>
      </View>

      <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
        <View className="flex-row items-center mb-1">
          <Ionicons name="diamond" size={20} color="#FBBF24" />
          <Text className="text-white font-bold text-lg ml-2">Go Premium</Text>
        </View>
        <Text className="text-indigo-100 text-sm mb-4">Unlock all features and accelerate your success</Text>
        {HERO_HIGHLIGHTS.map((item) => (
          <View key={item} className="flex-row items-center mb-1.5">
            <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
            <Text className="text-white text-sm ml-2">{item}</Text>
          </View>
        ))}
      </View>

      <View className="flex-row bg-gray-100 rounded-xl p-1 mb-6">
        <Pressable
          onPress={() => setBillingCycle("monthly")}
          className="flex-1 items-center py-2.5 rounded-lg"
          style={{ backgroundColor: billingCycle === "monthly" ? "#fff" : "transparent" }}
        >
          <Text className={billingCycle === "monthly" ? "font-semibold text-gray-900" : "text-gray-500"}>Monthly</Text>
        </Pressable>
        <Pressable
          onPress={() => setBillingCycle("yearly")}
          className="flex-1 items-center py-2.5 rounded-lg flex-row justify-center"
          style={{ backgroundColor: billingCycle === "yearly" ? "#fff" : "transparent" }}
        >
          <Text className={billingCycle === "yearly" ? "font-semibold text-gray-900" : "text-gray-500"}>Yearly</Text>
          <View className="bg-green-100 rounded-full px-1.5 py-0.5 ml-1.5">
            <Text className="text-green-700 text-[10px] font-bold">Save 40%</Text>
          </View>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState label="Loading plans..." />
      ) : isError || !plans ? (
        <ErrorState message="Couldn't load plans." onRetry={refetch} />
      ) : (
        plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isSelected={selectedPlanId === plan.id}
            onSelect={() => setSelectedPlanId(plan.id)}
          />
        ))
      )}

      <Pressable onPress={() => (navigation as any).navigate("PremiumFeatures")} className="items-center mb-6">
        <Text className="text-primary font-medium">View All Premium Features</Text>
      </Pressable>

      <Button
        label={selectedPlan ? `Choose ${selectedPlan.name}` : "Choose Premium"}
        disabled={!selectedPlan}
        onPress={() => selectedPlan && (navigation as any).navigate("PremiumPayment", { planId: selectedPlan.id, billingCycle })}
        className="mb-6"
      />
    </Screen>
  );
}

function PlanCard({
  plan,
  billingCycle,
  isSelected,
  onSelect,
}: {
  plan: PremiumPlan;
  billingCycle: BillingCycle;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const period = billingCycle === "monthly" ? "/month" : "/year";

  return (
    <Pressable
      onPress={onSelect}
      className="rounded-2xl border p-4 mb-4"
      style={{ borderColor: isSelected ? "#4F39F6" : "#E5E7EB", borderWidth: isSelected ? 2 : 1, backgroundColor: isSelected ? "#EEF0FF" : "#fff" }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center flex-1">
          <Text className="font-bold text-gray-900 text-base mr-2">{plan.name}</Text>
          {plan.isPopular && (
            <View className="bg-amber-100 rounded-full px-2.5 py-1">
              <Text className="text-amber-700 text-[10px] font-bold">Most Popular</Text>
            </View>
          )}
        </View>
        <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={20} color={isSelected ? "#4F39F6" : "#D1D5DB"} />
      </View>
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        ₹{price} <Text className="text-sm font-normal text-gray-400">{period}</Text>
      </Text>
      {plan.features.map((feature) => (
        <View key={feature} className="flex-row items-center mb-1">
          <Ionicons name="checkmark" size={14} color="#16A34A" />
          <Text className="text-gray-600 text-sm ml-2">{feature}</Text>
        </View>
      ))}
    </Pressable>
  );
}

export default PremiumPlansScreen;
