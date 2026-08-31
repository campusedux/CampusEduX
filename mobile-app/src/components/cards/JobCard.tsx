import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui";
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
  return (
    <PressableScale
      onPress={() => onPress(job)}
      className="bg-white rounded-2xl border border-gray-100 p-4 mb-3"
      style={CARD_SHADOW}
    >
      <View className="flex-row items-start">
        <View className="w-12 h-12 rounded-xl items-center justify-center mr-3 overflow-hidden" style={{ backgroundColor: "#EEF0FF" }}>
          {job.companyLogoUrl ? (
            <Image source={{ uri: job.companyLogoUrl }} className="w-full h-full" resizeMode="cover" />
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
              <Pressable onPress={() => onToggleSave(job)} hitSlop={8}>
                <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={18} color={isSaved ? "#4F39F6" : "#9CA3AF"} />
              </Pressable>
            )}
          </View>
          <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
            {job.companyName}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center flex-wrap mt-3" style={{ gap: 8 }}>
        <View className="rounded-lg px-2.5 py-1" style={{ backgroundColor: "#EEF0FF" }}>
          <Text className="text-primary text-[11px] font-semibold">{job.jobType}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
            {job.location}
          </Text>
        </View>
        {job.isNew && (
          <View className="rounded-lg px-2 py-1" style={{ backgroundColor: "#DCFCE7" }}>
            <Text className="text-[11px] font-semibold" style={{ color: "#15803D" }}>
              NEW
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between mt-2.5">
        <Text className="text-primary font-semibold text-sm">{job.salaryRange}</Text>
        <Text className="text-gray-400 text-xs">{job.postedAt}</Text>
      </View>
    </PressableScale>
  );
}

export default JobCard;
