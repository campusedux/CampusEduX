import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { rupees } from "./components/format";
import { BALANCE_TIMING_TEXT } from "./components/builderCopy";
import { NextStepsTimeline } from "./components/NextStepsTimeline";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "SubmitSuccess">;
type Rte = RouteProp<CustomProjectsStackParamList, "SubmitSuccess">;

function ReceiptRow({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-gray-500">{label}</Text>
      <Text className={`text-gray-900 ${strong ? "font-bold" : "font-medium"} ${mono ? "font-mono" : ""} flex-shrink ml-3`} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const NEXT_STEPS = [
  { title: "Our team reviews your request", body: "We go through your project type, features and details." },
  { title: "Development and testing", body: "We build your project and keep the status up to date." },
  { title: "Delivery", body: "You receive the finished project and files." },
];

export function SubmitSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const nextSteps = params.projectType === "academic"
    ? [{ title: "Mentor reviews your request", body: "We review your goals and your own work." },
       { title: "Guidance and feedback", body: "Use the message thread for code review, debugging and architecture guidance." },
       { title: "You continue building", body: "You author any assessed code, reports, slides and answers." }]
    : NEXT_STEPS;

  const openDetail = () =>
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: "MyCustomProjects" },
          { name: "CustomProjectDetail", params: { requestId: params.requestId } },
        ],
      })
    );

  const openList = () =>
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "MyCustomProjects" }] }));

  const balance = Math.max(0, params.estimatedTotal - params.tokenAmount);
  const paidOn = new Date(params.paidAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="items-center mt-4">
          <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#DCFCE7" }}>
            <Ionicons name="checkmark" size={40} color="#16A34A" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mt-5" accessibilityRole="header">
            Request submitted
          </Text>
          <Text className="text-lg font-semibold text-primary mt-1">{rupees(params.tokenAmount)} token paid</Text>
          <Text className="text-gray-500 text-center mt-1">Save your Request ID — you&apos;ll need it if you contact us.</Text>
        </View>

        <View className="rounded-2xl border border-gray-100 bg-white p-4 mt-6">
          <Text className="font-bold text-gray-900 mb-1">Receipt</Text>
          <ReceiptRow label="Request ID" value={params.requestCode} mono strong />
          <ReceiptRow label="Project" value={params.title} />
          <ReceiptRow label="Paid on" value={paidOn} />
          <ReceiptRow label="Estimated project price" value={rupees(params.estimatedTotal)} />
          <ReceiptRow label="Token amount paid" value={rupees(params.tokenAmount)} strong />
          <View className="border-t border-gray-100 mt-1.5 pt-1.5">
            <ReceiptRow label="Balance payable later" value={rupees(balance)} strong />
            <Text className="text-gray-500 text-xs">{BALANCE_TIMING_TEXT}</Text>
          </View>
        </View>

        <View className="rounded-2xl border border-gray-100 bg-white p-4 mt-4">
          <Text className="font-bold text-gray-900 mb-3">What happens next</Text>
          <NextStepsTimeline steps={nextSteps} />
          <Text className="text-gray-500 text-sm mt-1">
            Track progress anytime in My Custom Projects — every status change is shown there with your Request ID.
          </Text>
        </View>

        <View className="mt-6">
          <Button label="View project request" onPress={openDetail} />
          <Button label="Back to My Custom Projects" variant="text" onPress={openList} className="mt-1" />
        </View>
      </ScrollView>
    </Screen>
  );
}

export default SubmitSuccessScreen;
