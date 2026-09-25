import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui";
import { CARD_SHADOW } from "@/constants/theme";
import type { Project } from "@/types";
import { formatINR } from "@/lib/homeFormat";

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
  /**
   * `featured` (default) — full-width card with a large image on top, used in
   * every project list (one per row). `compact` — small icon-left horizontal
   * row for tight spaces.
   */
  variant?: "featured" | "compact" | "row" | "grid";
  isWishlisted?: boolean;
  onToggleWishlist?: (project: Project) => void;
  /** 1-based position badge shown on the thumbnail (Trending Projects list). */
  rank?: number;
  /** Small pill next to the title, e.g. "NEW". */
  tag?: string;
}

/**
 * Project card used across Home and the Projects module. The default
 * `featured` layout shows the project image prominently and always occupies
 * the full row width — no 2-column grid (spec §9).
 */
export function ProjectCard({
  project,
  onPress,
  variant = "featured",
  isWishlisted,
  onToggleWishlist,
  rank,
  tag,
}: ProjectCardProps) {
  // `row`/`grid` are kept as aliases so older call sites don't break.
  const [imageFailed, setImageFailed] = useState(false);
  const thumb = project.thumbnailUrl && !imageFailed ? project.thumbnailUrl : null;
  const price = formatINR(project.price);
  const isCompact = variant === "compact" || variant === "row";
  // Real Supabase rows can have a null/undefined rating (no reviews yet): show the star row only for a valid rating with reviews.
  const hasRating = typeof project.rating === "number" && Number.isFinite(project.rating) && (project.reviewCount ?? 0) > 0;

  const techLine = (project.techStack ?? []).slice(0, 3).join(" • ") || project.categoryName || "";
  const premiumBadge = project.isPremium ? "PREMIUM" : project.isBestSeller ? "BESTSELLER" : tag;

  if (isCompact) {
    return (
      <PressableScale
        onPress={() => onPress(project)}
        className="bg-white rounded-2xl border border-gray-100 flex-row items-center p-3 mb-3"
        style={CARD_SHADOW}
      >
        <View
          className="items-center justify-center rounded-xl mr-3 overflow-hidden"
          style={{ width: 56, height: 56, backgroundColor: "#EEF0FF" }}
        >
          {thumb ? (
            <Image source={{ uri: thumb }} className="w-full h-full" resizeMode="cover" onError={() => setImageFailed(true)} />
          ) : (
            <Ionicons name={project.isPremium ? "diamond-outline" : "cube-outline"} size={24} color="#4F39F6" />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {project.title}
          </Text>
          {techLine ? (
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {techLine}
            </Text>
          ) : null}
          <View className="flex-row items-center justify-between mt-1.5">
            {hasRating ? (
              <View className="flex-row items-center">
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text className="text-xs text-gray-500 ml-1">
                  {project.rating.toFixed(1)} ({project.reviewCount})
                </Text>
              </View>
            ) : (
              <View />
            )}
            {price ? <Text className="font-bold text-primary">{price}</Text> : null}
          </View>
        </View>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={() => onPress(project)}
      className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden"
      style={CARD_SHADOW}
    >
      <View className="w-full items-center justify-center" style={{ height: 168, backgroundColor: "#EEF0FF" }}>
        {thumb ? (
          <Image source={{ uri: thumb }} className="w-full h-full" resizeMode="cover" onError={() => setImageFailed(true)} />
        ) : (
          <Ionicons name={project.isPremium ? "diamond-outline" : "cube-outline"} size={44} color="#4F39F6" />
        )}

        {typeof rank === "number" && (
          <View
            className="absolute top-3 left-3 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
            style={{ backgroundColor: "#4F39F6" }}
          >
            <Text className="text-white text-xs font-bold">{rank}</Text>
          </View>
        )}

        {premiumBadge ? (
          <View className="absolute top-3 right-3 rounded-full px-2.5 py-1" style={{ backgroundColor: "rgba(17,24,39,0.82)" }}>
            <Text className="text-white text-[10px] font-bold tracking-wide">{premiumBadge}</Text>
          </View>
        ) : null}

        {onToggleWishlist && (
          <Pressable
            onPress={() => onToggleWishlist(project)}
            hitSlop={8}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
          >
            <Ionicons name={isWishlisted ? "heart" : "heart-outline"} size={18} color={isWishlisted ? "#DC2626" : "#6B7280"} />
          </Pressable>
        )}
      </View>

      <View className="p-4">
        <Text className="font-bold text-gray-900 text-base" numberOfLines={1}>
          {project.title}
        </Text>
        {techLine ? (
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
            {techLine}
          </Text>
        ) : null}

        <View className="flex-row items-center justify-between mt-3">
          {hasRating ? (
            <View className="flex-row items-center">
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text className="text-xs text-gray-500 ml-1">
                {project.rating.toFixed(1)} ({project.reviewCount})
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View className="flex-row items-center">
            {price ? <Text className="font-bold text-primary text-base mr-2">{price}</Text> : null}
            <View className="flex-row items-center rounded-lg px-2.5 py-1" style={{ backgroundColor: "#EEF0FF" }}>
              <Text className="text-primary text-xs font-semibold mr-0.5">View</Text>
              <Ionicons name="arrow-forward" size={12} color="#4F39F6" />
            </View>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

export default ProjectCard;
