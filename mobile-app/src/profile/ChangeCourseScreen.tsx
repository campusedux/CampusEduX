import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState } from "@/components/ui";
import { useCourseOptions, courseIdForLabel } from "@/hooks/useAcademicOptions";
import { useInvalidateAcademicContent } from "@/hooks/useHomeData";
import { academicService } from "@/services/academic.service";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";
import type { ProfileStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "ChangeCourse">;

export function ChangeCourseScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUserFields } = useAuthStore();
  const invalidateContent = useInvalidateAcademicContent();
  const { data: options = [], isLoading } = useCourseOptions();
  const [selected, setSelected] = useState<string>(user?.course ?? "");
  const [submitting, setSubmitting] = useState(false);

  const effectiveSelected = selected || options[0]?.label || "";

  const handleSave = async () => {
    if (!user || !effectiveSelected) return;
    setSubmitting(true);
    try {
      // Drop the branch if it doesn't belong to the newly chosen course, then
      // send the student to pick a valid one (§37, §63).
      const newCourseId = courseIdForLabel(options, effectiveSelected);
      let clearBranch = false;
      if (user.branch && newCourseId) {
        const branches = await academicService.getBranches(newCourseId);
        clearBranch = !branches.some(
          (b) => b.label.trim().toLowerCase() === user.branch!.trim().toLowerCase()
        );
      }
      // The DB is always the source of truth, so branch is nulled there right
      // away — if the student abandons this flow before picking a new one,
      // the account is genuinely incomplete on their next login. But it is
      // deliberately NOT nulled in the auth store here: updateUserFields
      // recomputes hasCompletedProfileSetup on every call, and dropping it to
      // false mid-edit makes RootNavigator swap the whole app out of Settings
      // into the first-time ProfileSetup wizard instead of letting this
      // screen hand off to ChangeBranch below. ChangeBranchScreen already
      // discards a stale branch that doesn't belong to the new course (its
      // own validity check), so keeping the old value in the store here is
      // safe — it never reaches the UI.
      await authService.updateAcademicDetails(user.id, {
        course: effectiveSelected,
        ...(clearBranch ? { branch: null } : {}),
      });
      updateUserFields({ course: effectiveSelected });
      invalidateContent();
      if (clearBranch) {
        notify("Pick a branch", `Choose a branch for ${effectiveSelected}.`);
        navigation.navigate("ChangeBranch");
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      notify("Couldn't save", error.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Change Course</Text>
      </View>

      <Text className="text-gray-500 mb-4">Select Your Course</Text>
      {isLoading ? (
        <LoadingState label="Loading courses..." />
      ) : (
        <View>
          {options.map((course) => {
            const isActive = effectiveSelected === course.label;
            return (
              <Pressable
                key={course.id}
                onPress={() => setSelected(course.label)}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <Text className={`text-base ${isActive ? "text-primary font-semibold" : "text-gray-800"}`}>{course.label}</Text>
                <Ionicons name={isActive ? "radio-button-on" : "radio-button-off"} size={22} color={isActive ? "#4F39F6" : "#D1D5DB"} />
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="flex-1" />
      <Button label="Continue" loading={submitting} disabled={!effectiveSelected} onPress={handleSave} className="mb-6" />
    </Screen>
  );
}

export default ChangeCourseScreen;
