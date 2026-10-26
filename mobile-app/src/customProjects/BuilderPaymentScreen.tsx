import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ErrorState } from "@/components/ui";
import { SkeletonList } from "@/components/ui/SkeletonLoader";
import { notify } from "@/lib/notify";
import { useCustomProjectSubmit } from "@/hooks/useCustomProjects";
import { useBuilderEstimate } from "./useBuilderEstimate";
import { WizardScreen, SectionCard } from "./components/wizard";
import { TermLabel } from "./components/InfoTooltip";
import { BALANCE_TIMING_TEXT, LEVEL_LABEL, TERMS, TYPE_LABEL, TITLE_MIN } from "./components/builderCopy";
import { rupees } from "./components/format";
import type { CustomProjectBuilderConfig, CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderPayment">;

function isComplete(c: CustomProjectBuilderConfig): boolean {
  return !!(c.projectType && c.projectLevel && c.platform && c.title.trim().length >= TITLE_MIN);
}

function SummaryLine({ label, value, strong }: { label: React.ReactNode; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <View className="flex-1 pr-3">{label}</View>
      <Text className={strong ? "text-primary font-bold text-lg" : "text-gray-900 font-medium"}>{value}</Text>
    </View>
  );
}

export function BuilderPaymentScreen() {
  const navigation = useNavigation<Nav>();
  const { config, estimate, isLoading, isError, refetch } = useBuilderEstimate();
  const { submit, isProcessing } = useCustomProjectSubmit();
  const [assessmentUse, setAssessmentUse] = useState<"yes" | "no" | null>(null);
  const [studentAuthored, setStudentAuthored] = useState(false);
  const [integrityAcknowledged, setIntegrityAcknowledged] = useState(false);
  const academic = config.projectType === "academic";
  const canPay = assessmentUse !== null && integrityAcknowledged && (academic ? studentAuthored : assessmentUse === "no");

  const handlePay = async () => {
    if (!isComplete(config)) {
      notify("Missing details", "Please complete the project type, level, platform and title.");
      return;
    }
    if (!canPay || !assessmentUse) return;
    const result = await submit(config, { assessmentUse, studentAuthored: academic && studentAuthored, integrityAcknowledged });
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
                projectType: config.projectType ?? undefined,
                requestCode: result.requestCode,
                tokenAmount: result.tokenAmount,
                title: result.title,
                estimatedTotal: estimate.total,
                paidAt: new Date().toISOString(),
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
      title="Pay the token to submit"
      helper="A one-time payment that confirms your request and starts the work."
      onBack={() => navigation.goBack()}
      onNext={handlePay}
      nextLabel={`Pay ${rupees(estimate.token)} & submit request`}
      nextDisabled={!isComplete(config) || !canPay || isLoading || isError}
      nextLoading={isProcessing}
      disabledReason={!isComplete(config) ? "Complete your project type, level, platform and title first." : undefined}
    >
      {isLoading ? (
        <SkeletonList count={2} />
      ) : isError ? (
        <ErrorState message="Couldn't prepare the payment." onRetry={refetch} />
      ) : (
        <>
          <SectionCard title="Academic-integrity check">
            <Text className="text-gray-900 mb-2">Will this request relate to work assessed by a school, college, or university?</Text>
            {(["yes", "no"] as const).map((answer) => <Pressable key={answer} accessibilityRole="radio" accessibilityState={{ selected: assessmentUse === answer }} onPress={() => setAssessmentUse(answer)} className="py-2"><Text>{assessmentUse === answer ? "◉" : "○"} {answer === "yes" ? "Yes" : "No"}</Text></Pressable>)}
            {!academic && assessmentUse === "yes" && <Text className="text-red-700">Choose project mentoring for assessed work. We cannot build it for you.</Text>}
            {academic && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: studentAuthored }} onPress={() => setStudentAuthored(!studentAuthored)} className="py-2"><Text>{studentAuthored ? "☑" : "☐"} I will author any assessed code, report, slides and answers myself. I request guidance only.</Text></Pressable>}
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: integrityAcknowledged }} onPress={() => setIntegrityAcknowledged(!integrityAcknowledged)} className="py-2"><Text>{integrityAcknowledged ? "☑" : "☐"} CampusEduX will not complete assessed work or provide submission-ready deliverables for me.</Text></Pressable>
          </SectionCard>
          <SectionCard title="Order summary">
            <SummaryLine label={<Text className="text-gray-500">Project</Text>} value={config.title.trim() || "Untitled"} />
            <SummaryLine
              label={<Text className="text-gray-500">Type · level</Text>}
              value={`${config.projectType ? TYPE_LABEL[config.projectType] : "—"} · ${config.projectLevel ? LEVEL_LABEL[config.projectLevel] : "—"}`}
            />
            <SummaryLine label={<TermLabel term={TERMS.estimate} />} value={rupees(estimate.total)} />
            <View className="border-t border-gray-100 mt-1 pt-1">
              <SummaryLine label={<TermLabel term={TERMS.token} className="text-gray-900 font-bold" />} value={rupees(estimate.token)} strong />
            </View>
            <Text className="text-gray-500 text-xs mb-1.5">Paying now</Text>
            <SummaryLine label={<TermLabel term={TERMS.balance} />} value={rupees(estimate.balanceAfterToken)} />
            <Text className="text-gray-500 text-xs">{BALANCE_TIMING_TEXT}</Text>
          </SectionCard>

          <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "#F0FDF4" }}>
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
              <Text className="text-green-800 text-sm ml-2 flex-1">
                The token amount is verified and charged by our server — it cannot be changed from the
                app. Payment is processed securely by Razorpay.
              </Text>
            </View>
          </View>

          <Text className="text-gray-500 text-xs">
            After a successful payment your request is created with a Request ID and our team is
            notified. If a payment fails, nothing is charged and your configuration is kept so you can
            retry.
          </Text>
        </>
      )}
    </WizardScreen>
  );
}

export default BuilderPaymentScreen;
