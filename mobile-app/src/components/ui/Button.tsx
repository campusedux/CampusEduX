import React from "react";
import { Text, ActivityIndicator, Pressable, PressableProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, coloredShadow } from "@/constants/theme";

type IconName = keyof typeof Ionicons.glyphMap;

interface ButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "outline" | "text" | "danger" | "secondary" | "ghost" | "gradient";
  /** md is the original size; sm is a compact 44px button. */
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading icon (e.g. brand logos on the social login buttons). */
  leftIcon?: IconName;
  rightIcon?: IconName;
  iconColor?: string;
  /** Stretch to the full width of the parent. */
  fullWidth?: boolean;
  /** Gradient stops for variant="gradient" (light → dark, dark enough for white text). */
  gradientColors?: readonly [string, string];
}

const DEFAULT_GRADIENT: readonly [string, string] = ["#4F39F6", "#3730A3"];

const SIZE = {
  sm: { box: "py-2.5 px-4 min-h-[44px]", text: "text-sm", icon: 16 },
  md: { box: "py-4 px-6 min-h-[48px]", text: "text-base", icon: 18 },
  lg: { box: "py-[18px] px-8 min-h-[56px]", text: "text-lg", icon: 20 },
} as const;

/**
 * Primary CTA button used across the app (e.g. "Login", "Continue", "Register").
 * variant="outline" is used for secondary actions like social logins.
 * variant="danger" is used for destructive actions like Logout/Delete Account.
 * New: "secondary" (soft brand tint), "ghost" (quiet, neutral) and "gradient"
 * (hero CTAs, coloured shadow). Press feedback is an opacity dip (`active:`); this is
 * a plain Pressable on purpose so existing screens/tests that match Pressables are unaffected.
 */
export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  leftIcon,
  rightIcon,
  iconColor,
  fullWidth,
  gradientColors = DEFAULT_GRADIENT,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const dim = isDisabled ? "opacity-60" : "";
  const sz = SIZE[size];

  const base = `flex-row items-center justify-center rounded-xl ${sz.box} ${fullWidth ? "self-stretch" : ""}`;
  const styles = {
    primary: `bg-primary ${dim}`,
    outline: "border border-gray-300 bg-white",
    text: "bg-transparent",
    danger: `bg-danger ${dim}`,
    secondary: `bg-primary-50 ${dim}`,
    ghost: "bg-transparent",
    gradient: `overflow-hidden ${dim}`,
  }[variant];

  const textColor = {
    primary: "text-white",
    outline: "text-gray-800",
    text: "text-primary",
    danger: "text-white",
    secondary: "text-primary",
    ghost: "text-gray-700",
    gradient: "text-white",
  }[variant];

  const onDark = variant === "primary" || variant === "danger" || variant === "gradient";
  const defaultIconColor =
    iconColor ??
    (onDark ? COLORS.white : variant === "secondary" || variant === "text" ? COLORS.primary : "#374151");

  const content = loading ? (
    <ActivityIndicator color={onDark ? "#fff" : COLORS.primary} />
  ) : (
    <View className="flex-row items-center justify-center">
      {leftIcon ? <Ionicons name={leftIcon} size={sz.icon} color={defaultIconColor} style={{ marginRight: 8 }} /> : null}
      <Text className={`${textColor} font-semibold ${sz.text}`}>{label}</Text>
      {rightIcon ? <Ionicons name={rightIcon} size={sz.icon} color={defaultIconColor} style={{ marginLeft: 8 }} /> : null}
    </View>
  );

  const gradientShadow = variant === "gradient" && !isDisabled ? coloredShadow(gradientColors[1], "sm") : null;

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      className={`${base} ${styles} active:opacity-90 ${className ?? ""}`}
      style={gradientShadow ?? undefined}
      {...rest}
    >
      {variant === "gradient" ? (
        <LinearGradient
          colors={[gradientColors[0], gradientColors[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {content}
    </Pressable>
  );
}

export default Button;
