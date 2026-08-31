import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { notify, confirmAction } from "@/lib/notify";
import { useMembership, useCancelSubscription } from "@/hooks/usePremium";
import type { PremiumStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PremiumStackParamList, "MembershipDetails">;

export function MembershipDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const { data: membership, isLoading, isError, refetch } = useMembership();
  const cancelSubscription = useCancelSubscription();

  const handleCancel = () => {
    if (!membership) return;
    confirmAction(
      "Cancel Subscription",
      "You'll keep Premium access until your current billing period ends, then it won't renew. Continue?",
      async () => {
        try {
          await cancelSubscription.mutateAsync(membership.subscriptionId);
          notify("Subscription Cancelled", "Auto-renewal has been turned off.");
        } catch (error: any) {
          notify("Couldn't cancel", error.message ?? "Please try again.");
        }
      },
      "Cancel Subscription"
    );
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Membership Details</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading your membership..." />
      ) : isError ? (
        <ErrorState message="Couldn't load membership details." onRetry={refetch} />
      ) : !membership ? (
        <>
          <EmptyState icon="diamond-outline" title="No active membership" subtitle="Subscribe to Premium to unlock all features." />
          <Button label="View Premium Plans" onPress={() => (navigation as any).navigate("PremiumPlans")} className="mt-4" />
        </>
      ) : (
        <>
          <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: "#4F39F6" }}>
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Ionicons name="diamond" size={20} color="#FBBF24" />
                <Text className="text-white font-bold text-lg ml-2">Premium Member</Text>
              </View>
              <View className="bg-green-400/20 rounded-full px-3 py-1">
                <Text className="text-green-100 text-xs font-semibold capitalize">{membership.status}</Text>
              </View>
            </View>
            <Text className="text-indigo-100 text-sm">Member since {new Date(membership.memberSince).toLocaleDateString()}</Text>
            {membership.nextBillingDate && (
              <Text className="text-indigo-100 text-sm mt-0.5">
                {membership.autoRenew ? "Next billing on" : "Access ends on"} {new Date(membership.nextBillingDate).toLocaleDateString()}
              </Text>
            )}
          </View>

          <Text className="font-bold text-gray-900 mb-3">Plan Details</Text>
          <View className="border border-gray-100 rounded-2xl p-4 mb-6">
            <Row label="Plan Name" value={membership.planName} />
            <Row label="Price" value={`₹${membership.price.toFixed(2)} / ${membership.billingCycle === "monthly" ? "month" : "year"}`} />
            <Row label="Status" value={membership.status.charAt(0).toUpperCase() + membership.status.slice(1)} />
            <Row label="Payment Method" value={membership.paymentMethod} />
            <Row label="Auto Renew" value={membership.autoRenew ? "Enabled" : "Disabled"} last />
          </View>

          <Text className="font-bold text-gray-900 mb-3">What&apos;s Included</Text>
          {membership.includedFeatures.map((feature) => (
            <View key={feature} className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              <Text className="text-gray-600 text-sm ml-2">{feature}</Text>
            </View>
          ))}

          <Button
            label="Manage Subscription"
            variant="outline"
            className="mt-6 mb-3"
            onPress={() => (navigation as any).navigate("PremiumPlans")}
          />
          {membership.autoRenew && membership.status === "active" && (
            <Button label="Cancel Subscription" variant="danger" loading={cancelSubscription.isPending} onPress={handleCancel} className="mb-6" />
          )}
        </>
      )}
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between ${last ? "" : "mb-3"}`}>
      <Text className="text-gray-500">{label}</Text>
      <Text className="text-gray-900 font-medium">{value}</Text>
    </View>
  );
}

export default MembershipDetailsScreen;
