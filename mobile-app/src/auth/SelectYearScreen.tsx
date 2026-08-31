import React, { useState } from "react";
import { View } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen, Button, AuthHeader, SelectableCard, LoadingState } from "@/components/ui";
import { useYearOptions } from "@/hooks/useAcademicOptions";
import { useInvalidateAcademicContent } from "@/hooks/useHomeData";
import { authService } from "@/services/auth.service";
import { secureStorage, STORAGE_KEYS, setCachedProfile } from "@/lib/storage";
import { useAuthStore } from "@/store/authStore";
import { goBackSafely } from "@/navigation/safeNavigation";
import type { ProfileSetupStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProfileSetupStackParamList, "SelectYear">;

export function SelectYearScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const invalidateContent = useInvalidateAcademicContent();
  const { data: options = [], isLoading } = useYearOptions();
  const [selected, setSelected] = useState<string>(user?.year ?? "");
  const [submitting, setSubmitting] = useState(false);

  const effectiveSelected = selected || options[0]?.label || "";

  const onSave = async () => {
    if (!user || !effectiveSelected) return;
    setSubmitting(true);
    try {
      // Re-send course + branch too: if an earlier step's write failed, this
      // guarantees all three land on the profile row in one shot.
      await authService.updateAcademicDetails(user.id, {
        course: user.course ?? undefined,
        branch: user.branch ?? undefined,
        year: effectiveSelected,
      });
      await secureStorage.setItem(STORAGE_KEYS.PROFILE_SETUP_COMPLETE, "true");
      await setCachedProfile({ ...user, year: effectiveSelected });
      invalidateContent();
      navigation.navigate("Welcome", { year: effectiveSelected });
    } catch (error: any) {
      notify("Could not save", error?.message ?? "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen className="px-6">
      <AuthHeader title="Select Your Year" subtitle="Choose your current year" onBack={() => goBackSafely(navigation, "SelectBranch")} />

      {isLoading ? (
        <LoadingState label="Loading years..." />
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {options.map((year) => (
            <SelectableCard
              key={year.id}
              icon="calendar-outline"
              label={year.label}
              height={90}
              selected={effectiveSelected === year.label}
              onPress={() => setSelected(year.label)}
            />
          ))}
        </View>
      )}

      <View className="flex-1" />
      <Button label="Continue" loading={submitting} disabled={!effectiveSelected} onPress={onSave} className="mb-6" />
    </Screen>
  );
}

export default SelectYearScreen;
