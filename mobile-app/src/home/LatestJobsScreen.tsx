import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { useLatestJobs } from "@/hooks/useHomeData";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "LatestJobs">;

export function LatestJobsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useLatestJobs();

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Latest Jobs</Text>
        </View>
        <Pressable>
          <Text className="text-primary text-sm font-medium">View All</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState label="Loading jobs..." />
      ) : isError ? (
        <ErrorState message="Couldn't load jobs." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="briefcase-outline" title="No jobs available right now" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="flex-row items-center rounded-2xl p-4 mb-4" style={{ backgroundColor: "#4F39F6" }}>
              <View className="flex-1 pr-3">
                <Text className="text-white font-bold text-base mb-1">Find Your Dream Job</Text>
                <Text className="text-white/80 text-xs">Apply to top companies</Text>
              </View>
              <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
                <Ionicons name="briefcase-outline" size={24} color="#FFFFFF" />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={(job) => (navigation.getParent() as any)?.navigate("Jobs", { screen: "JobDetails", params: { jobId: job.id } })}
            />
          )}
        />
      )}
    </Screen>
  );
}

export default LatestJobsScreen;
