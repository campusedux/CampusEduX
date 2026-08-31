import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";
import type { UseQueryResult } from "@tanstack/react-query";

interface ListBanner {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Background color; defaults to the brand purple. */
  color?: string;
}

interface ProjectListTemplateProps {
  title: string;
  query: UseQueryResult<Project[], Error>;
  emptyLabel: string;
  /** Coloured hero banner above the list (Premium / Best Sellers / New Arrivals). */
  banner?: ListBanner;
  /** Show 1..n position badges on each card (Trending Projects). */
  ranked?: boolean;
  /** Pill shown on every card, e.g. "NEW" or "PREMIUM". */
  itemTag?: string;
}

/**
 * Shared "view all" list layout reused by Trending / Premium / Best Sellers
 * / New Arrivals (Home module screens 5-8) — identical structure, only the
 * data source, banner and badges differ.
 */
export function ProjectListTemplate({ title, query, emptyLabel, banner, ranked, itemTag }: ProjectListTemplateProps) {
  const navigation = useNavigation();
  const { data, isLoading, isError, refetch } = query;

  return (
    <Screen className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">{title}</Text>
        </View>
        <Pressable>
          <Text className="text-primary text-sm font-medium">View All</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState label={`Loading ${title.toLowerCase()}...`} />
      ) : isError ? (
        <ErrorState message={`Couldn't load ${title.toLowerCase()}.`} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title={emptyLabel} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            banner ? (
              <View
                className="flex-row items-center rounded-2xl p-4 mb-4"
                style={{ backgroundColor: banner.color ?? "#4F39F6" }}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-white font-bold text-base mb-1">{banner.title}</Text>
                  <Text className="text-white/80 text-xs">{banner.subtitle}</Text>
                </View>
                <View
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                >
                  <Ionicons name={banner.icon} size={24} color="#FFFFFF" />
                </View>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <ProjectCard
              project={item}
              rank={ranked ? index + 1 : undefined}
              tag={itemTag}
              onPress={(p) =>
                (navigation.getParent() as any)?.navigate("Projects", { screen: "ProjectDetails", params: { projectId: p.id } })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

export default ProjectListTemplate;
