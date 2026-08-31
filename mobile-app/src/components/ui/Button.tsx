import React from "react";
import { Pressable, Text, ActivityIndicator, PressableProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "outline" | "text" | "danger";
  loading?: boolean;
  disabled?: boolean;
  /** Optional leading icon (e.g. brand logos on the social login buttons). */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

/**
 * Primary CTA button used across the app (e.g. "Login", "Continue", "Register").
 * variant="outline" is used for secondary actions like social logins.
 * variant="danger" is used for destructive actions like Logout/Delete Account.
 */
export function Button({
  label,
  variant = "primary",
  loading,
  disabled,
  leftIcon,
  iconColor,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const base = "flex-row items-center justify-center rounded-xl py-4 px-6";
  const styles = {
    primary: `bg-primary ${isDisabled ? "opacity-60" : ""}`,
    outline: "border border-gray-300 bg-white",
    text: "bg-transparent",
    danger: `bg-danger ${isDisabled ? "opacity-60" : ""}`,
  }[variant];

  const textStyles = {
    primary: "text-white font-semibold text-base",
    outline: "text-gray-800 font-semibold text-base",
    text: "text-primary font-semibold text-base",
    danger: "text-white font-semibold text-base",
  }[variant];

  const defaultIconColor =
    iconColor ?? (variant === "outline" || variant === "text" ? "#374151" : "#FFFFFF");

  return (
    <Pressable disabled={isDisabled} className={`${base} ${styles} ${className ?? ""}`} {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === "outline" || variant === "text" ? "#4F39F6" : "#fff"} />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? (
            <Ionicons name={leftIcon} size={18} color={defaultIconColor} style={{ marginRight: 8 }} />
          ) : null}
          <Text className={textStyles}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default Button;
