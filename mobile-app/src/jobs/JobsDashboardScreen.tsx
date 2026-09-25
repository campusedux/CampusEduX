import React, { useMemo, useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, RefreshControl, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ErrorState, EmptyState, SectionHeader, DrawerMenuButton, BottomSheet, Skeleton, SkeletonGroup } from "@/components/ui";
import { useAllJobs, useSavedJobs, useJobCategoryCounts, useJobDashboardStats } from "@/hooks/useJobs";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useJobFilterStore } from "@/store/jobFilterStore";
import { academicFromUser, academicEmptyText } from "@/lib/personalization";
import { useAuthStore } from "@/store/authStore";
import { DEFAULT_JOB_FILTERS } from "@/types";
import type { JobFilters, JobStackParamList } from "@/types";
import { buildCategoryRows } from "./jobCategories";
import { J, categoryColumns } from "./components/jobsTheme";
import { CategoryCard } from "./components/CategoryCard";
import { HeroBanner } from "./components/HeroBanner";
import { JobListingItem } from "./components/JobListingCard";
import { JobFiltersSheet, OptionChip, EMPTY_DASH_FILTERS, hasDashFilters, type DashFilters } from "./components/JobFiltersSheet";

type Nav = NativeStackNavigationProp<JobStackParamList, "JobsDashboard">;

const GAP = 12;
const LATEST_COUNT = 6;

export function JobsDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { width: windowWidth } = useWindowDimensions();
  const [contentWidth, setContentWidth] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [dash, setDash] = useState<DashFilters>(EMPTY_DASH_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const setStoreFilters = useJobFilterStore((s) => s.setFilters);
  const academic = academicFromUser(useAuthStore((s) => s.user));

  const query = useDebouncedValue(searchText.trim(), 300);
  const filters = useMemo<JobFilters>(
    () => ({
      ...DEFAULT_JOB_FILTERS,
      sortBy: "latest",
      query,
      jobType: dash.jobType ?? "All",
      location: dash.location || null,
      experienceLevel: dash.experienceLevel,
      workMode: dash.workMode,
    }),
    [query, dash]
  );

  const categories = useJobCategoryCounts();
  const stats = useJobDashboardStats();
  const latest = useAllJobs(filters);
  const { data: saved } = useSavedJobs();
  const savedIds = new Set((saved ?? []).map((j) => j.id));

  const rows = useMemo(() => buildCategoryRows(categories.data), [categories.data]);
  const jobs = latest.data?.pages.flatMap((p) => p.jobs) ?? [];
  const filtered = hasDashFilters(dash) || query.length > 0;
  const refreshing = categories.isRefetching || stats.isRefetching || latest.isRefetching;

  const cols = categoryColumns(windowWidth);
  const gridWidth = contentWidth > 0 ? contentWidth : Math.min(windowWidth, J.maxWidth) - 32;
  const cardWidth = Math.floor((gridWidth - GAP * (cols - 1)) / cols);
  const jobCols = windowWidth >= 900 ? 2 : 1;
  const jobWidth = Math.floor((gridWidth - GAP * (jobCols - 1)) / jobCols);

  const refresh = () => {
    categories.refetch();
    stats.refetch();
    latest.refetch();
  };

  /** Opens the full list with exactly the given filters (store is the hand-off to SearchJobs). */
  const openList = (next: JobFilters, initialQuery?: string) => {
    setStoreFilters(next);
    (navigation as any).navigate("SearchJobs", initialQuery ? { initialQuery } : undefined);
  };
  const openCategory = (category: string) => {
    setCategoriesOpen(false);
    openList({ ...DEFAULT_JOB_FILTERS, sortBy: "latest", category });
  };
  const openAllJobs = () => openList({ ...filters, query: undefined }, query || undefined);

  const chipActive = {
    all: !hasDashFilters(dash),
    fresher: dash.experienceLevel === "Fresher",
    experienced: dash.experienceLevel === "Experienced",
    remote: dash.workMode === "Remote",
    internship: dash.jobType === "Internship",
    fulltime: dash.jobType === "Full Time",
  };
  const chips: { key: keyof typeof chipActive; label: string; onPress: () => void }[] = [
    { key: "all", label: "All", onPress: () => setDash(EMPTY_DASH_FILTERS) },
    { key: "fresher", label: "Fresher", onPress: () => setDash((d) => ({ ...d, experienceLevel: d.experienceLevel === "Fresher" ? null : "Fresher" })) },
    { key: "experienced", label: "Experienced", onPress: () => setDash((d) => ({ ...d, experienceLevel: d.experienceLevel === "Experienced" ? null : "Experienced" })) },
    { key: "remote", label: "Remote", onPress: () => setDash((d) => ({ ...d, workMode: d.workMode === "Remote" ? null : "Remote" })) },
    { key: "internship", label: "Internship", onPress: () => setDash((d) => ({ ...d, jobType: d.jobType === "Internship" ? null : "Internship" })) },
    { key: "fulltime", label: "Full-time", onPress: () => setDash((d) => ({ ...d, jobType: d.jobType === "Full Time" ? null : "Full Time" })) },
  ];

  return (
    <Screen scroll className="px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={J.primary} />}>
      <View
        style={{ width: "100%", maxWidth: J.maxWidth, alignSelf: "center" }}
        onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
      >
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <DrawerMenuButton />
            <Text style={{ fontSize: 22, fontWeight: "700", color: J.text }}>Jobs</Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 16 }}>
            <Pressable onPress={() => (navigation as any).navigate("JobAlerts")} accessibilityRole="button" accessibilityLabel="Job alerts" hitSlop={8}>
              <Ionicons name="notifications-outline" size={24} color={J.text} />
            </Pressable>
            <Pressable onPress={() => (navigation as any).navigate("SavedJobs")} accessibilityRole="button" accessibilityLabel="Saved jobs" hitSlop={8}>
              <Ionicons name="bookmark-outline" size={24} color={J.text} />
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View
            style={{ flex: 1, flexDirection: "row", alignItems: "center", height: 48, borderRadius: 14, borderWidth: 1, borderColor: J.border, backgroundColor: J.inputBg, paddingHorizontal: 14 }}
          >
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={{ flex: 1, marginLeft: 8, color: J.text, height: "100%", outlineStyle: "none" } as any}
              placeholder="Search job title, company or skills"
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={openAllJobs}
              returnKeyType="search"
            />
            {searchText.length > 0 ? (
              <Pressable onPress={() => setSearchText("")} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            style={{ width: 48, height: 48, borderRadius: 14, borderWidth: 1, borderColor: hasDashFilters(dash) ? J.primary : J.border, backgroundColor: hasDashFilters(dash) ? J.primaryTint : J.inputBg, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="options-outline" size={20} color={hasDashFilters(dash) ? J.primary : J.text} />
          </Pressable>
        </View>

        <HeroBanner stats={stats.data} onBrowse={() => openList({ ...DEFAULT_JOB_FILTERS, sortBy: "latest" })} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, marginBottom: 24 }} contentContainerStyle={{ gap: 8 }}>
          {chips.map((c) => (
            <OptionChip key={c.key} label={c.label} active={chipActive[c.key]} onPress={c.onPress} />
          ))}
        </ScrollView>

        <SectionHeader title="Top Categories" onViewAll={categories.data || categories.isError ? () => setCategoriesOpen(true) : undefined} />
        {categories.isLoading ? (
          <SkeletonGroup>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP, marginBottom: 24 }}>
              {Array.from({ length: cols * 2 }, (_, i) => (
                <Skeleton key={i} width={cardWidth} height={70} radius={14} />
              ))}
            </View>
          </SkeletonGroup>
        ) : categories.isError ? (
          <ErrorState message="Couldn't load categories." onRetry={() => categories.refetch()} />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP, marginBottom: 24 }}>
            {rows.slice(0, 8).map((row) => (
              <CategoryCard key={row.category} row={row} width={cardWidth} onPress={openCategory} />
            ))}
          </View>
        )}

        <SectionHeader title={filtered ? "Matching Jobs" : "Latest Jobs"} onViewAll={openAllJobs} />
        {latest.isLoading ? (
          <SkeletonGroup>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
              {Array.from({ length: jobCols * 2 }, (_, i) => (
                <Skeleton key={i} width={jobWidth} height={150} radius={14} />
              ))}
            </View>
          </SkeletonGroup>
        ) : latest.isError ? (
          <ErrorState message="Couldn't load jobs." onRetry={() => latest.refetch()} />
        ) : jobs.length === 0 ? (
          filtered ? (
            <EmptyState
              icon="search-outline"
              title="No jobs match your filters"
              subtitle="Try removing a filter or searching something else."
              actionLabel="Clear filters"
              onAction={() => {
                setDash(EMPTY_DASH_FILTERS);
                setSearchText("");
              }}
            />
          ) : (
            <EmptyState icon="briefcase-outline" title="No jobs found yet" subtitle={academicEmptyText(academic, "jobs")} />
          )
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
            {jobs.slice(0, LATEST_COUNT).map((job) => (
              <JobListingItem key={job.id} job={job} isSaved={savedIds.has(job.id)} width={jobWidth} />
            ))}
          </View>
        )}

        <View className="h-8" />
      </View>

      <JobFiltersSheet visible={filterOpen} value={dash} onClose={() => setFilterOpen(false)} onApply={setDash} />

      <BottomSheet visible={categoriesOpen} onClose={() => setCategoriesOpen(false)} title="All categories" scroll>
        <View style={{ gap: 10, paddingBottom: 8 }}>
          {rows.map((row) => (
            <CategoryCard key={row.category} row={row} onPress={openCategory} />
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

export default JobsDashboardScreen;
