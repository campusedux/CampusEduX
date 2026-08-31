import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState } from "@/components/ui";
import { useYearOptions } from "@/hooks/useAcademicOptions";
import { useInvalidateAcademicContent } from "@/hooks/useHomeData";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";

export function ChangeYearScreen() {
  const navigation = useNavigation();
  const { user, updateUserFields } = useAuthStore();
  const invalidateContent = useInvalidateAcademicContent();
  const { data: options = [], isLoading } = useYearOptions();
  const [selected, setSelected] = useState<string>(user?.year ?? "");
  const [submitting, setSubmitting] = useState(false);

  const effectiveSelected = selected || options[0]?.label || "";

  const handleSave = async () => {
    if (!user || !effectiveSelected) return;
    setSubmitting(true);
    try {
      await authService.updateAcademicDetails(user.id, { year: effectiveSelected });
      updateUserFields({ year: effectiveSelected });
      invalidateContent();
      navigation.goBack();
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
        <Text className="text-lg font-bold text-gray-900">Change Year</Text>
      </View>

      <Text className="text-gray-500 mb-4">Select Your Year</Text>
      {isLoading ? (
        <LoadingState label="Loading years..." />
      ) : (
        <View>
          {options.map((year) => {
            const isActive = effectiveSelected === year.label;
            return (
              <Pressable
                key={year.id}
                onPress={() => setSelected(year.label)}
                className="flex-row items-center justify-between py-4 border-b border-gray-100"
              >
                <Text className={`text-base ${isActive ? "text-primary font-semibold" : "text-gray-800"}`}>{year.label}</Text>
                <Ionicons name={isActive ? "radio-button-on" : "radio-button-off"} size={22} color={isActive ? "#4F39F6" : "#D1D5DB"} />
              </Pressable>
            );
          })}
        </View>
      )}

      <View className="flex-1" />
      <Button label="Save Changes" loading={submitting} disabled={!effectiveSelected} onPress={handleSave} className="mb-6" />
    </Screen>
  );
}

export default ChangeYearScreen;
