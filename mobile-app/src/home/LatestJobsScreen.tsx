import React from "react";
import { View, Text, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, Card, SkeletonList, ErrorState, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/cards";
import { useLatestJobs } from "@/hooks/useHomeData";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "LatestJobs">;

export function LatestJobsScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useLatestJobs();
  const count = data?.length ?? 0;

  return (
    <Screen className="px-6">
      <ScreenHeader
        title="Latest Jobs"
        subtitle={count > 0 ? `${count} opening${count === 1 ? "" : "s"}` : undefined}
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <SkeletonList count={4} hero />
      ) : isError ? (
        <ErrorState message="Couldn't load jobs." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="briefcase-outline" accent="blue" title="No jobs available right now" subtitle="New openings will show up here." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 16 }}>
              <Card variant="gradient" accent="blue" padding={18}>
                <View className="flex-row items-center">
                  <View className="flex-1 pr-3">
                    <Text className="text-white font-bold text-lg mb-1">Find Your Dream Job</Text>
                    <Text className="text-white/90 text-sm">Apply to top companies</Text>
                  </View>
                  <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Ionicons name="briefcase-outline" size={28} color="#FFFFFF" />
                  </View>
                </View>
              </Card>
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
