import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BrandLogo } from "./BrandLogo";

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Bottom spacing below the block. Login uses more room before its form. */
  className?: string;
  /** Show the CampusEduX logo above the title (Login and Register only). */
  showLogo?: boolean;
}

/**
 * Back chevron + title + subtitle block shared by every Module 1 auth screen
 * (Login, Register, Forgot Password, Select Course/Branch/Year, ...).
 * Matches the mockup: 24px back arrow, 22px bold title, 15px grey subtitle.
 */
export function AuthHeader({ title, subtitle, onBack, className = "mb-6", showLogo = false }: AuthHeaderProps) {
  return (
    <View className={className}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} className="mt-2 mb-4 w-9 h-9 -ml-1 items-start justify-center">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
      ) : (
        <View className="mt-2 mb-4 h-9" />
      )}
      {showLogo ? <BrandLogo variant="horizontal" height={36} style={{ marginBottom: 20 }} /> : null}
      <Text className="text-[22px] font-bold text-gray-900 mb-1">{title}</Text>
      {subtitle ? <Text className="text-[15px] text-gray-500">{subtitle}</Text> : null}
    </View>
  );
}

export default AuthHeader;
