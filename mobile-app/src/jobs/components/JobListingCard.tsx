import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useToggleSavedJob } from "@/hooks/useJobs";
import { openApplyUrl } from "@/lib/openApplyUrl";
import type { Job } from "@/types";
import { companyInitials } from "../jobCategories";
import { J, SOFT_SHADOW } from "./jobsTheme";

const AVATAR_COLORS = ["#4F46E5", "#0891B2", "#DB2777", "#D97706", "#16A34A", "#7C3AED", "#EA580C", "#0D9488"];

function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function Badge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: bg }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: fg }}>{label}</Text>
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 12, marginTop: 4 }}>
      <Ionicons name={icon} size={13} color="#94A3B8" />
      <Text numberOfLines={1} style={{ fontSize: 12, color: J.secondary, marginLeft: 4 }}>
        {text}
      </Text>
    </View>
  );
}

interface CardProps {
  job: Job;
  isSaved: boolean;
  width?: number | string;
  onPress: (job: Job) => void;
  onToggleSave: (job: Job) => void;
  onApply: (job: Job) => void;
}

export function JobListingCard({ job, isSaved, width, onPress, onToggleSave, onApply }: CardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const name = job.companyName || "Company";
  return (
    <Pressable
      onPress={() => onPress(job)}
      accessibilityRole="button"
      accessibilityLabel={`${job.title}${job.companyName ? ` at ${job.companyName}` : ""}`}
      style={(state: any) => [
        {
          width: width as any,
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: state.hovered || state.pressed ? J.hoverBorder : J.borderSoft,
          padding: 14,
        },
        SOFT_SHADOW,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            marginRight: 12,
            backgroundColor: job.companyLogoUrl && !logoFailed ? "#F8FAFC" : avatarColor(name),
          }}
        >
          {job.companyLogoUrl && !logoFailed ? (
            <Image source={{ uri: job.companyLogoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" onError={() => setLogoFailed(true)} />
          ) : (
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>{companyInitials(name)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: "700", color: J.text }}>
            {job.title}
          </Text>
          {job.companyName ? (
            <Text numberOfLines={1} style={{ fontSize: 13, color: J.secondary, marginTop: 2 }}>
              {job.companyName}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => onToggleSave(job)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Remove saved job" : "Save job"}
          style={{ marginLeft: 8 }}
        >
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? J.primary : "#94A3B8"} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
        {job.location ? <Meta icon="location-outline" text={job.location} /> : null}
        {job.workMode ? <Meta icon="laptop-outline" text={job.workMode} /> : null}
        {job.salaryRange ? <Meta icon="cash-outline" text={job.salaryRange} /> : null}
        {job.postedAt ? <Meta icon="time-outline" text={job.postedAt} /> : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1, marginRight: 8 }}>
          {job.experienceLevel ? (
            <Badge
              label={job.experienceLevel}
              bg={job.experienceLevel === "Fresher" ? J.fresher.bg : J.experienced.bg}
              fg={job.experienceLevel === "Fresher" ? J.fresher.fg : J.experienced.fg}
            />
          ) : null}
          {job.jobType ? <Badge label={job.jobType} bg={J.neutral.bg} fg={J.neutral.fg} /> : null}
        </View>
        <Pressable
          onPress={() => onApply(job)}
          accessibilityRole="button"
          accessibilityLabel={`Apply for ${job.title}`}
          style={{ backgroundColor: J.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>Apply</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/**
 * Wires JobListingCard to saved-job toggling and navigation. Apply follows the
 * same rule as JobDetailsScreen: external `apply_url` opens in the browser,
 * otherwise the in-app ApplyJob flow.
 */
export function JobListingItem({ job, isSaved, width }: { job: Job; isSaved: boolean; width?: number | string }) {
  const navigation = useNavigation<any>();
  const toggleSaved = useToggleSavedJob(job.id);
  return (
    <JobListingCard
      job={job}
      isSaved={isSaved}
      width={width}
      onPress={(j) => navigation.navigate("JobDetails", { jobId: j.id })}
      onToggleSave={() => toggleSaved.mutate(isSaved)}
      onApply={(j) => (j.applyUrl ? openApplyUrl(j.applyUrl) : navigation.navigate("ApplyJob", { jobId: j.id }))}
    />
  );
}
