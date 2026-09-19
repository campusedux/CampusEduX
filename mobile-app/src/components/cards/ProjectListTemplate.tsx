import React from "react";
import { View, Text, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, Card, SkeletonList, ErrorState, EmptyState } from "@/components/ui";
import type { AccentName } from "@/constants/theme";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";
import type { UseQueryResult } from "@tanstack/react-query";

interface ListBanner {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Gradient accent of the hero banner; defaults to indigo (brand). */
  accent?: AccentName;
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
  const accent = banner?.accent ?? "indigo";
  const count = data?.length ?? 0;

  return (
    <Screen className="px-6">
      <ScreenHeader
        title={title}
        subtitle={count > 0 ? `${count} project${count === 1 ? "" : "s"}` : undefined}
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <SkeletonList count={4} hero={!!banner} />
      ) : isError ? (
        <ErrorState message={`Couldn't load ${title.toLowerCase()}.`} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={banner?.icon ?? "cube-outline"} accent={accent} title={emptyLabel} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            banner ? (
              <View style={{ marginBottom: 16 }}>
                <Card variant="gradient" accent={accent} padding={18}>
                  <View className="flex-row items-center">
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-bold text-lg mb-1" numberOfLines={2}>
                        {banner.title}
                      </Text>
                      <Text className="text-white/90 text-sm" numberOfLines={3}>
                        {banner.subtitle}
                      </Text>
                    </View>
                    <View className="w-14 h-14 rounded-2xl items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                      <Ionicons name={banner.icon} size={28} color="#FFFFFF" />
                    </View>
                  </View>
                </Card>
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
