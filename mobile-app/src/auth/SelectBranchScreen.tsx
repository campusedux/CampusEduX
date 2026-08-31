import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, AuthHeader, LoadingState } from "@/components/ui";
import { useBranchOptions, useCourseOptions, courseIdForLabel } from "@/hooks/useAcademicOptions";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import { goBackSafely } from "@/navigation/safeNavigation";
import type { ProfileSetupStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProfileSetupStackParamList, "SelectBranch">;

export function SelectBranchScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUserFields } = useAuthStore();
  const { data: courseOptions = [] } = useCourseOptions();
  const courseId = courseIdForLabel(courseOptions, user?.course);
  const { data: options = [], isLoading } = useBranchOptions(courseId);
  const [selected, setSelected] = useState<string>(user?.branch ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Drop a pre-filled branch that doesn't belong to the chosen course (§36).
  useEffect(() => {
    if (isLoading || !selected) return;
    const valid = options.some((o) => o.label.trim().toLowerCase() === selected.trim().toLowerCase());
    if (!valid) setSelected("");
  }, [isLoading, options, selected]);

  const effectiveSelected = selected || options[0]?.label || "";

  const onContinue = async () => {
    if (!user || !effectiveSelected) return;
    setSubmitting(true);
    try {
      await authService.updateAcademicDetails(user.id, { branch: effectiveSelected });
      updateUserFields({ branch: effectiveSelected });
      navigation.navigate("SelectYear");
    } catch (error: any) {
      notify("Could not save", error?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen className="px-6">
      <AuthHeader title="Select Your Branch" subtitle="Choose your branch" onBack={() => goBackSafely(navigation, "SelectCourse")} />

      {isLoading ? (
        <LoadingState label="Loading branches..." />
      ) : (
        <View>
          {options.map((branch) => {
            const isActive = effectiveSelected === branch.label;
            return (
              <Pressable
                key={branch.id}
                onPress={() => setSelected(branch.label)}
                className="flex-row items-center py-4 border-b border-gray-100"
              >
                <Ionicons
                  name={isActive ? "radio-button-on" : "radio-button-off"}
                  size={22}
                  color={isActive ? "#4F39F6" : "#D1D5DB"}
                  style={{ marginRight: 14 }}
                />
                <Text className={`flex-1 text-base ${isActive ? "text-primary font-semibold" : "text-gray-800"}`}>
                  {branch.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="flex-1" />
      <Button label="Continue" loading={submitting} disabled={!effectiveSelected} onPress={onContinue} className="mb-6" />
    </Screen>
  );
}

export default SelectBranchScreen;
