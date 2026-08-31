import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Input, LoadingState, ErrorState } from "@/components/ui";
import { useJobDetail } from "@/hooks/useJobs";
import { useAuthStore } from "@/store/authStore";
import type { JobStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<JobStackParamList, "ApplyJob">;
type Rte = RouteProp<JobStackParamList, "ApplyJob">;

const STEPS = ["Basic Info", "Resume", "Review"];

export function ApplyJobScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: job, isLoading, isError, refetch } = useJobDetail(params.jobId);
  const user = useAuthStore((s) => s.user);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.mobileNumber ?? "");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading..." /></Screen>;
  if (isError || !job) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this job." onRetry={refetch} /></Screen>;

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-1">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>Apply for {job.title}</Text>
      </View>

      <View className="flex-row items-center my-5">
        {STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <View className="items-center">
              <View
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{ backgroundColor: index === 0 ? "#4F39F6" : "#E5E7EB" }}
              >
                <Text className={index === 0 ? "text-white text-xs font-bold" : "text-gray-500 text-xs font-bold"}>{index + 1}</Text>
              </View>
            </View>
            {index < STEPS.length - 1 && <View className="flex-1 h-px bg-gray-200 mx-2" />}
          </React.Fragment>
        ))}
      </View>

      <Text className="font-bold text-gray-900 mb-3">Personal Information</Text>
      <Input icon="person-outline" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
      <Input icon="mail-outline" placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <Input icon="call-outline" placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Input icon="location-outline" placeholder="Location" value={location} onChangeText={setLocation} />
      <Input icon="briefcase-outline" placeholder="Experience (e.g. 2 Years)" value={experience} onChangeText={setExperience} />

      <Button
        label="Continue"
        onPress={() => (navigation as any).navigate("ResumeUpload", { jobId: job.id })}
        className="mt-2 mb-6"
      />
    </Screen>
  );
}

export default ApplyJobScreen;
