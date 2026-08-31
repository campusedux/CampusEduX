import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View className="items-center justify-center py-10">
      <ActivityIndicator color="#4F39F6" />
      <Text className="text-gray-400 mt-2 text-sm">{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="items-center justify-center py-10 px-6">
      <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
      <Text className="text-gray-600 text-center mt-2">{message}</Text>
      {onRetry && (
        <Text className="text-primary font-medium mt-3" onPress={onRetry}>
          Tap to retry
        </Text>
      )}
    </View>
  );
}

export function EmptyState({ icon = "file-tray-outline", title, subtitle }: { icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View className="items-center justify-center py-14 px-6">
      <Ionicons name={icon} size={36} color="#D1D5DB" />
      <Text className="text-gray-700 font-semibold mt-3">{title}</Text>
      {subtitle && <Text className="text-gray-400 text-sm text-center mt-1">{subtitle}</Text>}
    </View>
  );
}
