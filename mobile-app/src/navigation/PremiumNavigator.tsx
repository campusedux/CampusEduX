import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PremiumPlansScreen } from "@/premium/PremiumPlansScreen";
import { PremiumFeaturesScreen } from "@/premium/PremiumFeaturesScreen";
import { PremiumPaymentScreen } from "@/premium/PremiumPaymentScreen";
import { PremiumSuccessScreen } from "@/premium/PremiumSuccessScreen";
import { MembershipDetailsScreen } from "@/premium/MembershipDetailsScreen";
import type { PremiumStackParamList } from "@/types";

const Stack = createNativeStackNavigator<PremiumStackParamList>();

/** Module 10 - Premium (5 screens), reached from the drawer. */
export function PremiumNavigator() {
  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PremiumPlans" component={PremiumPlansScreen} />
      <Stack.Screen name="PremiumFeatures" component={PremiumFeaturesScreen} />
      <Stack.Screen name="PremiumPayment" component={PremiumPaymentScreen} />
      <Stack.Screen name="PremiumSuccess" component={PremiumSuccessScreen} />
      <Stack.Screen name="MembershipDetails" component={MembershipDetailsScreen} />
    </Stack.Navigator>
  );
}

export default PremiumNavigator;
