import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState, RatingStars } from "@/components/ui";
import { useRecruiterForJob } from "@/hooks/useJobs";
import type { JobStackParamList } from "@/types";

type Rte = RouteProp<JobStackParamList, "RecruiterDetails">;

export function RecruiterDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: recruiter, isLoading, isError, refetch } = useRecruiterForJob(params.jobId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading recruiter..." /></Screen>;
  if (isError || !recruiter) return <Screen className="items-center justify-center px-6"><ErrorState message="Recruiter details aren't available for this job." onRetry={refetch} /></Screen>;

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-6">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Recruiter Details</Text>
      </View>

      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-3" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name="person" size={36} color="#4F39F6" />
        </View>
        <Text className="font-bold text-gray-900 text-lg">{recruiter.name}</Text>
        <Text className="text-gray-500 text-sm">{recruiter.title} at {recruiter.companyName}</Text>
        <View className="flex-row items-center mt-1.5">
          <RatingStars rating={recruiter.rating} size={13} />
          <Text className="text-gray-400 text-xs ml-1">({recruiter.reviewCount} Reviews)</Text>
        </View>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Contact Information</Text>
      <ContactRow icon="mail-outline" value={recruiter.email} onPress={() => Linking.openURL(`mailto:${recruiter.email}`)} />
      <ContactRow icon="call-outline" value={recruiter.phone} onPress={() => Linking.openURL(`tel:${recruiter.phone}`)} />
      <ContactRow icon="location-outline" value={recruiter.location} />

      <Text className="font-bold text-gray-900 mt-5 mb-2">About</Text>
      <Text className="text-gray-500 text-sm leading-5 mb-8">{recruiter.about || `${recruiter.name} helps connect great candidates with ${recruiter.companyName}.`}</Text>

      <Button
        label="Email Recruiter"
        leftIcon="mail-outline"
        onPress={() =>
          Linking.openURL(
            `mailto:${recruiter.email}?subject=${encodeURIComponent(
              `Enquiry about a role at ${recruiter.companyName}`
            )}`
          )
        }
      />
    </Screen>
  );
}

function ContactRow({ icon, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; value: string; onPress?: () => void }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} className="flex-row items-center mb-3">
      <Ionicons name={icon} size={18} color="#4F39F6" />
      <Text className={`ml-3 ${onPress ? "text-primary font-medium" : "text-gray-700"}`}>{value}</Text>
    </Wrapper>
  );
}

export default RecruiterDetailsScreen;
