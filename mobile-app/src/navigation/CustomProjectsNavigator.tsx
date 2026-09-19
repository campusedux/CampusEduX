import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BuilderStartScreen } from "@/customProjects/BuilderStartScreen";
import { BuilderTypeScreen } from "@/customProjects/BuilderTypeScreen";
import { BuilderLevelScreen } from "@/customProjects/BuilderLevelScreen";
import { BuilderPlatformScreen } from "@/customProjects/BuilderPlatformScreen";
import { BuilderDetailsScreen } from "@/customProjects/BuilderDetailsScreen";
import { BuilderFeaturesScreen } from "@/customProjects/BuilderFeaturesScreen";
import { BuilderUploadsScreen } from "@/customProjects/BuilderUploadsScreen";
import { BuilderEstimateScreen } from "@/customProjects/BuilderEstimateScreen";
import { BuilderPaymentScreen } from "@/customProjects/BuilderPaymentScreen";
import { SubmitSuccessScreen } from "@/customProjects/SubmitSuccessScreen";
import { SubmitFailedScreen } from "@/customProjects/SubmitFailedScreen";
import { MyCustomProjectsScreen } from "@/customProjects/MyCustomProjectsScreen";
import { CustomProjectDetailScreen } from "@/customProjects/CustomProjectDetailScreen";
import { LegalDocumentScreen } from "@/legal";
import type { CustomProjectsStackParamList } from "@/types";

const Stack = createNativeStackNavigator<CustomProjectsStackParamList>();

/**
 * Custom Project Builder (spec v3) — reached from the drawer ("Custom Project
 * Builder" / "My Custom Projects") and a Home category tile. The 8-step wizard
 * keeps all state in useBuilderStore, so the screens carry no params.
 */
export function CustomProjectsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuilderStart" component={BuilderStartScreen} />
      <Stack.Screen name="BuilderType" component={BuilderTypeScreen} />
      <Stack.Screen name="BuilderLevel" component={BuilderLevelScreen} />
      <Stack.Screen name="BuilderPlatform" component={BuilderPlatformScreen} />
      <Stack.Screen name="BuilderDetails" component={BuilderDetailsScreen} />
      <Stack.Screen name="BuilderFeatures" component={BuilderFeaturesScreen} />
      <Stack.Screen name="BuilderUploads" component={BuilderUploadsScreen} />
      <Stack.Screen name="BuilderEstimate" component={BuilderEstimateScreen} />
      <Stack.Screen name="BuilderPayment" component={BuilderPaymentScreen} />
      <Stack.Screen name="SubmitSuccess" component={SubmitSuccessScreen} />
      <Stack.Screen name="SubmitFailed" component={SubmitFailedScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="MyCustomProjects" component={MyCustomProjectsScreen} />
      <Stack.Screen name="CustomProjectDetail" component={CustomProjectDetailScreen} />
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
    </Stack.Navigator>
  );
}

export default CustomProjectsNavigator;
