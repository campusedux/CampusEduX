import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { useBuilderEstimate } from "../useBuilderEstimate";
import { LEVEL_LABEL, TYPE_LABEL } from "./builderCopy";
import { rupees } from "./format";
import { CUSTOM_PLATFORM_LABELS, type CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList>;

/** Jump to a step without stacking a duplicate screen. */
export function useGoToStep() {
  const navigation = useNavigation<Nav>();
  return (route: keyof CustomProjectsStackParamList) => navigation.popTo(route as "BuilderType");
}

function SummaryRow({ label, value, onEdit, editLabel = "Edit" }: { label: string; value: string; onEdit: () => void; editLabel?: string }) {
  return (
    <View className="flex-row items-start py-2 border-b border-gray-100">
      <View className="flex-1 pr-2">
        <Text className="text-gray-500 text-xs">{label}</Text>
        <Text className="text-gray-900 font-medium mt-0.5" numberOfLines={2}>
          {value}
        </Text>
      </View>
      <Pressable
        onPress={onEdit}
        accessibilityRole="link"
        accessibilityLabel={`${editLabel} ${label}`}
        hitSlop={8}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Text className="text-primary text-sm font-semibold">{editLabel}</Text>
      </Pressable>
    </View>
  );
}

function SummaryBody() {
  const goTo = useGoToStep();
  const { config, estimate, isLoading } = useBuilderEstimate();
  const { projectType, projectLevel, platform } = config;

  return (
    <View>
      <SummaryRow label="Project type" value={projectType ? TYPE_LABEL[projectType] : "Not chosen yet"} onEdit={() => goTo("BuilderType")} />
      <SummaryRow label="Level" value={projectLevel ? LEVEL_LABEL[projectLevel] : "Not chosen yet"} onEdit={() => goTo("BuilderLevel")} />
      <SummaryRow label="Platform" value={platform ? CUSTOM_PLATFORM_LABELS[platform] : "Not chosen yet"} onEdit={() => goTo("BuilderPlatform")} />
      <SummaryRow label="Title" value={config.title.trim() || "Not added yet"} onEdit={() => goTo("BuilderDetails")} />
      {isLoading ? (
        <View className="py-3">
          <Skeleton height={14} />
          <View className="h-2" />
          <Skeleton height={14} width="70%" />
        </View>
      ) : (
        <>
          <SummaryRow
            label="Included features"
            value={`${estimate.includedFeatures.length} · free`}
            onEdit={() => goTo("BuilderFeatures")}
            editLabel="View"
          />
          <SummaryRow
            label="Add-on features"
            value={estimate.addOns.length ? `${estimate.addOns.length} · +${rupees(estimate.addOnsTotal)}` : "None selected"}
            onEdit={() => goTo("BuilderFeatures")}
          />
        </>
      )}
      <SummaryRow
        label="Uploads"
        value={`${config.projectImagePath ? "Image · " : ""}${config.referenceFiles.length} reference file${config.referenceFiles.length === 1 ? "" : "s"}`}
        onEdit={() => goTo("BuilderUploads")}
      />
      <View className="flex-row items-center justify-between pt-3">
        <Text className="text-gray-900 font-bold">Estimated price</Text>
        <Text className="text-gray-900 font-bold text-lg">{isLoading ? "…" : rupees(estimate.total)}</Text>
      </View>
    </View>
  );
}

/** "Your project so far": a sticky column on wide screens, a collapsible card on mobile. */
export function ProjectSummaryPanel({ variant }: { variant: "panel" | "card" }) {
  const [open, setOpen] = useState(false);
  const { estimate, isLoading } = useBuilderEstimate();

  if (variant === "panel") {
    return (
      <View className="rounded-2xl border border-gray-100 bg-white p-4">
        <Text className="font-bold text-gray-900 mb-1">Your project so far</Text>
        <SummaryBody />
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-gray-100 bg-white mb-4">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Your project so far"
        className="flex-row items-center px-4"
        style={{ minHeight: 48 }}
      >
        <Ionicons name="reader-outline" size={18} color="#4F39F6" />
        <Text className="font-semibold text-gray-900 ml-2 flex-1">Your project so far</Text>
        <Text className="text-gray-700 font-semibold mr-2">{isLoading ? "…" : rupees(estimate.total)}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
      </Pressable>
      {open ? (
        <View className="px-4 pb-3">
          <SummaryBody />
        </View>
      ) : null}
    </View>
  );
}
