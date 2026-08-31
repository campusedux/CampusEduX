import React, { useState } from "react";
import { View } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Button, AuthHeader, SelectableCard, LoadingState } from "@/components/ui";
import { useCourseOptions, courseIdForLabel } from "@/hooks/useAcademicOptions";
import { academicService } from "@/services/academic.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import type { ProfileSetupStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProfileSetupStackParamList, "SelectCourse">;

export function SelectCourseScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUserFields } = useAuthStore();
  const { data: options = [], isLoading } = useCourseOptions();
  const [selected, setSelected] = useState<string>(user?.course ?? "");
  const [submitting, setSubmitting] = useState(false);

  const effectiveSelected = selected || options[0]?.label || "";

  const onContinue = async () => {
    if (!user || !effectiveSelected) return;
    setSubmitting(true);
    try {
      // If the student already picked a branch, drop it when it doesn't belong
      // to the newly chosen course — they'll pick a valid one next (§37).
      const newCourseId = courseIdForLabel(options, effectiveSelected);
      let clearBranch = false;
      if (user.branch && newCourseId) {
        const branches = await academicService.getBranches(newCourseId);
        clearBranch = !branches.some(
          (b) => b.label.trim().toLowerCase() === user.branch!.trim().toLowerCase()
        );
      }
      await authService.updateAcademicDetails(user.id, {
        course: effectiveSelected,
        ...(clearBranch ? { branch: null } : {}),
      });
      updateUserFields({ course: effectiveSelected, ...(clearBranch ? { branch: null } : {}) });
      navigation.navigate("SelectBranch");
    } catch (error: any) {
      notify("Could not save", error?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen className="px-6">
      <AuthHeader title="Select Your Course" subtitle="Choose your course to continue" />

      {isLoading ? (
        <LoadingState label="Loading courses..." />
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {options.map((course) => (
            <SelectableCard
              key={course.id}
              icon={(course.icon ?? "school-outline") as any}
              label={course.label}
              selected={effectiveSelected === course.label}
              onPress={() => setSelected(course.label)}
            />
          ))}
        </View>
      )}

      <View className="flex-1" />
      <Button label="Continue" loading={submitting} disabled={!effectiveSelected} onPress={onContinue} className="mb-6" />
    </Screen>
  );
}

export default SelectCourseScreen;
