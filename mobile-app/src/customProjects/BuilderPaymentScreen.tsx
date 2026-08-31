import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LoadingState, ErrorState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useCustomFeatures, useCustomPricing, useCustomProjectSubmit } from "@/hooks/useCustomProjects";
import { estimatePrice } from "@/services/customProjects.service";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, rupees } from "./components/wizard";
import type { CustomProjectBuilderConfig, CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderPayment">;

function isComplete(c: CustomProjectBuilderConfig): boolean {
  return !!(c.projectType && c.projectLevel && c.platform && c.title.trim().length >= 3);
}

export function BuilderPaymentScreen() {
  const navigation = useNavigation<Nav>();
  const featuresQ = useCustomFeatures();
  const pricingQ = useCustomPricing();
  const config = useBuilderStore((s) => s.config);
  const { submit, isProcessing } = useCustomProjectSubmit();

  const estimate = useMemo(
    () =>
      estimatePrice(
        config,
        pricingQ.data?.pricing ?? [],
        pricingQ.data?.platformPricing ?? [],
        featuresQ.data ?? []
      ),
    [config, pricingQ.data, featuresQ.data]
  );

  if (featuresQ.isLoading || pricingQ.isLoading) return <LoadingState label="Preparing payment…" />;
  if (featuresQ.isError || pricingQ.isError) {
    return <ErrorState message="Couldn't prepare the payment." onRetry={pricingQ.refetch} />;
  }

  const handlePay = async () => {
    if (!isComplete(config)) {
      notify("Missing details", "Please complete the project type, level, platform and title.");
      return;
    }
    const result = await submit(config);
    if (result.status === "success") {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: "MyCustomProjects" },
            {
              name: "SubmitSuccess",
              params: {
                requestId: result.requestId,
                requestCode: result.requestCode,
                tokenAmount: result.tokenAmount,
                title: result.title,
              },
            },
          ],
        })
      );
    } else if (result.status === "failed") {
      navigation.navigate("SubmitFailed", { message: result.message });
    }
    // "cancelled" -> stay so the user can retry (draft/config kept, §39)
  };

  return (
    <WizardScreen
      step={8}
      title="Pay the project token"
      subtitle="A one-time initial payment to submit and start your request."
      onBack={() => navigation.goBack()}
      onNext={handlePay}
      nextLabel={`Pay ${rupees(estimate.tokenAmount)} & Submit Request`}
      nextDisabled={!isComplete(config)}
      nextLoading={isProcessing}
    >
      <View className="rounded-2xl border border-gray-100 p-4 mb-4">
        <View className="flex-row justify-between py-1.5">
          <Text className="text-gray-500">Estimated Project Price</Text>
          <Text className="text-gray-900 font-medium">{rupees(estimate.estimatedTotal)}</Text>
        </View>
        <View className="flex-row justify-between border-t border-gray-100 pt-2.5 mt-1.5">
          <Text className="font-bold text-gray-900">Initial Token Amount</Text>
          <Text className="font-bold text-primary text-lg">{rupees(estimate.tokenAmount)}</Text>
        </View>
      </View>

      <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#F0FDF4" }}>
        <View className="flex-row items-start">
          <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
          <Text className="text-green-800 text-sm ml-2 flex-1">
            The token amount is verified and charged by our server — it cannot be changed from the
            app. Payment is processed securely by Razorpay.
          </Text>
        </View>
      </View>

      <Text className="text-gray-400 text-xs">
        After a successful payment your request is created with a Request ID and our team is
        notified. If a payment fails, nothing is charged and your configuration is kept so you can
        retry.
      </Text>
    </WizardScreen>
  );
}

export default BuilderPaymentScreen;
