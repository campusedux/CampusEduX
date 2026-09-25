import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Switch } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Input, Chip, LoadingState, ErrorState } from "@/components/ui";
import { useJobAlertPreferences, useSaveJobAlertPreferences } from "@/hooks/useJobs";
import type { JobFilters } from "@/types";

const JOB_TYPES: JobFilters["jobType"][] = ["All", "Full Time", "Part Time", "Internship"];

export function JobAlertsScreen() {
  const navigation = useNavigation();
  const { data: prefs, isLoading, isError, refetch } = useJobAlertPreferences();
  const saveMutation = useSaveJobAlertPreferences();

  const [enabled, setEnabled] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [jobType, setJobType] = useState<JobFilters["jobType"]>("All");

  useEffect(() => {
    if (prefs) {
      setEnabled(prefs.enabled);
      setJobRole(prefs.jobRole);
      setLocation(prefs.location);
      setExperience(prefs.experience);
      setSalaryRange(prefs.salaryRange);
      setJobType(prefs.jobType);
    }
  }, [prefs]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ enabled, jobRole, location, experience, salaryRange, jobType });
      notify("Saved", "Your job alert preferences have been saved.");
    } catch (error: any) {
      notify("Couldn't save", error.message ?? "Please try again.");
    }
  };

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading preferences..." /></Screen>;
  if (isError) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load your job alert preferences." onRetry={refetch} /></Screen>;

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Job Alerts</Text>
      </View>

      <View className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4 mb-6">
        <View className="flex-1 mr-3">
          <Text className="font-semibold text-gray-900">Job Alerts</Text>
          <Text className="text-gray-400 text-sm mt-0.5">Get notified about jobs that match your preferences</Text>
        </View>
        <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: "#4F39F6" }} />
      </View>

      <Text className="font-bold text-gray-900 mb-3">Alert Preferences</Text>
      <Input icon="briefcase-outline" placeholder="Job Role" value={jobRole} onChangeText={setJobRole} />
      <Input icon="location-outline" placeholder="Location" value={location} onChangeText={setLocation} />
      <Input icon="time-outline" placeholder="Experience" value={experience} onChangeText={setExperience} />
      <Input icon="cash-outline" placeholder="Salary Range" value={salaryRange} onChangeText={setSalaryRange} />

      <Text className="font-semibold text-gray-900 mb-2 mt-1">Job Type</Text>
      <View className="flex-row flex-wrap mb-6">
        {JOB_TYPES.map((type) => (
          <Chip key={type} label={type} active={jobType === type} onPress={() => setJobType(type)} />
        ))}
      </View>

      <Button label="Save Alert" loading={saveMutation.isPending} onPress={handleSave} className="mb-6" />
    </Screen>
  );
}

export default JobAlertsScreen;
