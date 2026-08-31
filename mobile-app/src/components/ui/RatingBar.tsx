import React from "react";
import { View, Text } from "react-native";

interface RatingBarProps {
  star: number;
  count: number;
  total: number;
}

export function RatingBar({ star, count, total }: RatingBarProps) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <View className="flex-row items-center mb-1.5">
      <Text className="text-gray-500 text-xs w-4">{star}</Text>
      <View className="flex-1 h-2 bg-gray-100 rounded-full mx-2 overflow-hidden">
        <View className="h-2 bg-yellow-400 rounded-full" style={{ width: `${percent}%` }} />
      </View>
      <Text className="text-gray-400 text-xs w-6 text-right">{count}</Text>
    </View>
  );
}
