import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { PressableScale } from "@/components/ui/PressableScale";
import { BackButton } from "@/components/learning/BackButton";
import { RADII, SPACE, TOUCH, useTheme } from "@/theme";

/** Themed spinner + label for the mock-test screens (the shared LoadingState hard-codes light colours). */
export function TestLoading({ label }: { label: string }) {
  const { colors, type } = useTheme();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: SPACE[3] }}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[type.small, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

/** Back button + title row shared by the test screens. */
export function TestHeader({ title, onBack, right, style }: { title?: string; onBack?: () => void; right?: React.ReactNode; style?: object }) {
  const { colors, type } = useTheme();
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: SPACE[3], marginTop: SPACE[2] }, style]}>
      {onBack ? <BackButton onPress={onBack} /> : null}
      {title ? (
        <Text numberOfLines={1} style={[type.title, { color: colors.text, flex: 1 }]}>
          {title}
        </Text>
      ) : null}
      {right}
    </View>
  );
}

/** Themed replacement for the shared Button (primary / outline / text) — same labels, disabled and loading behaviour. */
export function TestButton({
  label,
  variant = "primary",
  onPress,
  disabled,
  loading,
  style,
}: {
  label: string;
  variant?: "primary" | "outline" | "text";
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
}) {
  const { colors, type } = useTheme();
  const isDisabled = disabled || loading;
  const fill = variant === "primary" ? colors.primaryFill : variant === "outline" ? colors.surface : "transparent";
  const fg = variant === "primary" ? colors.textOnPrimary : variant === "outline" ? colors.text : colors.primaryText;
  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        {
          minHeight: 48,
          paddingHorizontal: SPACE[6],
          borderRadius: RADII.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: fill,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.textMuted,
          opacity: isDisabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[type.button, { color: fg }]}>{label}</Text>}
    </PressableScale>
  );
}

/** Small stat tile (value over label) used by Test Result and Performance Analysis. */
export function TestStatCard({ label, value }: { label: string; value: string }) {
  const { colors, type, shadow } = useTheme();
  return (
    <View style={[{ flex: 1, alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: RADII.lg, paddingVertical: SPACE[3], backgroundColor: colors.surface }, shadow("sm")]}>
      <Text style={[type.title, { color: colors.text }]}>{value}</Text>
      <Text style={[type.caption, { color: colors.textSecondary, marginTop: 2, textAlign: "center" }]}>{label}</Text>
    </View>
  );
}

export { TOUCH };
