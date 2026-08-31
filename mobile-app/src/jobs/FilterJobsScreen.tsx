import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { Screen, Button, Chip } from "@/components/ui";
import { useJobFilterStore } from "@/store/jobFilterStore";
import { DEFAULT_JOB_FILTERS } from "@/types";
import type { JobFilters } from "@/types";

const JOB_TYPES: JobFilters["jobType"][] = ["All", "Full Time", "Part Time", "Internship", "Contract"];
const EXPERIENCE_LEVELS = ["Fresher", "0-1 Years", "1-3 Years", "3-5 Years", "5-10 Years", "10+ Years"];
const SORTS: { label: string; value: JobFilters["sortBy"] }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Latest", value: "latest" },
  { label: "Salary", value: "salary" },
];

export function FilterJobsScreen() {
  const navigation = useNavigation();
  const { filters, setFilters, resetFilters } = useJobFilterStore();
  const [draft, setDraft] = useState<JobFilters>(filters);

  const applyFilters = () => {
    setFilters(draft);
    navigation.goBack();
  };

  const reset = () => {
    setDraft(DEFAULT_JOB_FILTERS);
    resetFilters();
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <Text className="text-lg font-bold text-gray-900">Filter Jobs</Text>
        <Pressable onPress={reset}>
          <Text className="text-primary font-medium">Reset</Text>
        </Pressable>
      </View>

      <Text className="font-semibold text-gray-900 mb-2">Job Type</Text>
      <View className="flex-row flex-wrap mb-4">
        {JOB_TYPES.map((type) => (
          <Chip key={type} label={type} active={draft.jobType === type} onPress={() => setDraft((d) => ({ ...d, jobType: type }))} />
        ))}
      </View>

      <Text className="font-semibold text-gray-900 mb-2">Experience</Text>
      <View className="flex-row flex-wrap mb-4">
        {EXPERIENCE_LEVELS.map((exp) => (
          <Chip
            key={exp}
            label={exp}
            active={draft.experience === exp}
            onPress={() => setDraft((d) => ({ ...d, experience: d.experience === exp ? null : exp }))}
          />
        ))}
      </View>

      <Text className="font-semibold text-gray-900 mb-2">
        Salary Range: ₹{draft.minSalaryLPA} - ₹{draft.maxSalaryLPA === 50 ? "50+" : draft.maxSalaryLPA} LPA
      </Text>
      <Slider
        minimumValue={0}
        maximumValue={50}
        step={1}
        value={draft.maxSalaryLPA}
        minimumTrackTintColor="#4F39F6"
        onValueChange={(value: number) => setDraft((d) => ({ ...d, maxSalaryLPA: value }))}
        style={{ marginBottom: 20 }}
      />

      <Text className="font-semibold text-gray-900 mb-2">Sort By</Text>
      <View className="flex-row flex-wrap mb-8">
        {SORTS.map((s) => (
          <Chip key={s.value} label={s.label} active={draft.sortBy === s.value} onPress={() => setDraft((d) => ({ ...d, sortBy: s.value }))} />
        ))}
      </View>

      <Button label="Apply Filters" onPress={applyFilters} />
    </Screen>
  );
}

export default FilterJobsScreen;
