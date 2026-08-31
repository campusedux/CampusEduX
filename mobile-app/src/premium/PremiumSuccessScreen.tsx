import React from "react";
import { View, Text } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useMembership } from "@/hooks/usePremium";

export function PremiumSuccessScreen() {
  const navigation = useNavigation();
  const { data: membership, isLoading, isError, refetch } = useMembership();

  return (
    <Screen className="px-6 items-center justify-center">
      <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: "#DCFCE7" }}>
        <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</Text>
      <Text className="text-gray-500 text-center mb-6">Welcome to Premium 🎉 You now have access to all premium features.</Text>

      {isLoading ? (
        <LoadingState label="Loading your membership..." />
      ) : isError || !membership ? (
        <ErrorState message="Couldn't load membership details." onRetry={refetch} />
      ) : (
        <View className="w-full border border-gray-100 rounded-2xl p-4 mb-8">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-bold text-gray-900">{membership.planName} Plan</Text>
            <View className="bg-green-50 rounded-full px-2.5 py-1">
              <Text className="text-green-700 text-xs font-semibold">Active</Text>
            </View>
          </View>
          <Row label="Amount Paid" value={`₹${membership.price.toFixed(2)}`} />
          {membership.nextBillingDate && <Row label="Next Billing" value={new Date(membership.nextBillingDate).toLocaleDateString()} last />}
        </View>
      )}

      <Button
        label="Explore Premium"
        className="w-full mb-3"
        onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "MembershipDetails" }] }))}
      />
      <Button
        label="Go to Dashboard"
        variant="text"
        onPress={() => (navigation.getParent() as any)?.navigate("MainTabs", { screen: "Home" })}
      />
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between ${last ? "" : "mb-2"}`}>
      <Text className="text-gray-500">{label}</Text>
      <Text className="text-gray-900 font-medium">{value}</Text>
    </View>
  );
}

export default PremiumSuccessScreen;
