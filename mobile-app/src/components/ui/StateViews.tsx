import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AccentName, COLORS, STATUS, accentTint } from "@/constants/theme";
import { Button } from "./Button";
import { SkeletonList } from "./SkeletonLoader";

/**
 * Default is the classic spinner + label (unchanged). Pass variant="skeleton"
 * for shimmering placeholders shaped like a list — preferred on list screens.
 */
export function LoadingState({
  label = "Loading...",
  variant = "spinner",
  count,
  skeletonVariant,
}: {
  label?: string;
  variant?: "spinner" | "skeleton";
  /** Skeleton only: number of placeholder items. */
  count?: number;
  skeletonVariant?: "card" | "row";
}) {
  if (variant === "skeleton") return <SkeletonList count={count} variant={skeletonVariant} />;
  return (
    <View className="items-center justify-center py-10">
      <ActivityIndicator color={COLORS.primary} />
      <Text className="text-gray-500 mt-2 text-sm">{label}</Text>
    </View>
  );
}

/** Soft circular icon badge shared by the empty / error views. */
function StateIcon({ icon, color, soft, border }: { icon: keyof typeof Ionicons.glyphMap; color: string; soft: string; border: string }) {
  return (
    <View
      style={{
        width: 84,
        height: 84,
        borderRadius: 42,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: soft,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Ionicons name={icon} size={38} color={color} />
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
  title,
  retryLabel = "Tap to retry",
}: {
  message: string;
  onRetry?: () => void;
  /** Optional bold heading above the message. */
  title?: string;
  retryLabel?: string;
}) {
  return (
    <View className="items-center justify-center py-10 px-6">
      <StateIcon icon="alert-circle-outline" color={STATUS.danger.base} soft={STATUS.danger.soft} border="#FECACA" />
      {title ? <Text className="text-gray-900 font-bold text-lg text-center mt-4">{title}</Text> : null}
      <Text className={`text-gray-600 text-center ${title ? "mt-1" : "mt-4"}`}>{message}</Text>
      {onRetry && (
        // A Text (not a nested Pressable) so the retry target stays a single node; styled as a 44px button.
        <Text
          onPress={onRetry}
          accessibilityRole="button"
          style={{
            marginTop: 16,
            minHeight: 44,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            overflow: "hidden",
            textAlign: "center",
            fontWeight: "600",
            color: COLORS.primary,
            backgroundColor: COLORS.primaryLight,
          }}
        >
          {retryLabel}
        </Text>
      )}
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  subtitle,
  accent = "indigo",
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** Tint of the icon badge. */
  accent?: AccentName;
  /** Optional call-to-action button (rendered only when both are given). */
  actionLabel?: string;
  onAction?: () => void;
}) {
  const t = accentTint(accent);
  return (
    <View className="items-center justify-center py-14 px-6">
      <StateIcon icon={icon} color={t.base} soft={t.soft} border={t.border} />
      <Text className="text-gray-900 font-semibold text-base text-center mt-4">{title}</Text>
      {subtitle && <Text className="text-gray-500 text-sm text-center mt-1">{subtitle}</Text>}
      {actionLabel && onAction ? (
        <View className="mt-5">
          <Button label={actionLabel} onPress={onAction} size="sm" variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
