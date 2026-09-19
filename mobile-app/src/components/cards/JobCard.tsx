import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale, Badge } from "@/components/ui";
import { CARD_SHADOW } from "@/constants/theme";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
  isSaved?: boolean;
  onToggleSave?: (job: Job) => void;
}

/**
 * Full-width job card: company logo (with fallback), title, company, a
 * job-type pill, location + posted time, and the stipend/salary line.
 */
export function JobCard({ job, onPress, isSaved, onToggleSave }: JobCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  return (
    <PressableScale
      onPress={() => onPress(job)}
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
      style={CARD_SHADOW}
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-xl items-center justify-center mr-3 overflow-hidden" style={{ backgroundColor: "#EEF0FF" }}>
          {job.companyLogoUrl && !logoFailed ? (
            <Image source={{ uri: job.companyLogoUrl }} className="w-full h-full" resizeMode="cover" onError={() => setLogoFailed(true)} />
          ) : (
            <Ionicons name="business-outline" size={22} color="#4F39F6" />
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="font-bold text-gray-900 flex-1 pr-2" numberOfLines={1}>
              {job.title}
            </Text>
            {onToggleSave && (
              <Pressable onPress={() => onToggleSave(job)} hitSlop={14} accessibilityRole="button" accessibilityLabel={isSaved ? "Remove saved job" : "Save job"}>
                <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? "#4F39F6" : "#6B7280"} />
              </Pressable>
            )}
          </View>
          {job.companyName ? (
            <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
              {job.companyName}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center flex-wrap mt-3" style={{ gap: 8 }}>
        {job.jobType ? <Badge label={job.jobType} tone="primary" /> : null}
        {job.location ? (
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
              {job.location}
            </Text>
          </View>
        ) : null}
        {job.isNew && (
          <Badge label="NEW" tone="success" />
        )}
      </View>

      <View className="flex-row items-center justify-between mt-2.5">
        {job.salaryRange ? <Text className="text-primary font-semibold text-sm">{job.salaryRange}</Text> : <View />}
        {job.postedAt ? <Text className="text-gray-500 text-xs">{job.postedAt}</Text> : null}
      </View>
    </PressableScale>
  );
}

export default JobCard;
