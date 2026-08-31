import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface RatingStarsProps {
  rating: number;
  size?: number;
  onChange?: (rating: number) => void;
}

/**
 * Read-only star display when onChange is omitted; interactive 1-5 tap
 * input (Reviews "Write a Review") when provided.
 */
export function RatingStars({ rating, size = 16, onChange }: RatingStarsProps) {
  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= Math.round(rating);
        const Star = (
          <Ionicons key={value} name={filled ? "star" : "star-outline"} size={size} color="#F59E0B" />
        );
        return onChange ? (
          <Pressable key={value} onPress={() => onChange(value)}>
            {Star}
          </Pressable>
        ) : (
          Star
        );
      })}
    </View>
  );
}
