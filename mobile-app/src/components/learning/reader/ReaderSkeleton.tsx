import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/learning/LearningSkeleton";
import { RADII, SPACE } from "@/theme";

/** Reader loading state: title, chips, then paragraph / heading / code placeholders. */
export function ReaderSkeleton() {
  const para = (widths: (`${number}%`)[]) => (
    <View style={{ gap: SPACE[2] }}>
      {widths.map((w, i) => (
        <Skeleton key={i} width={w} height={16} />
      ))}
    </View>
  );
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading topic" style={{ gap: SPACE[5] }}>
      <View style={{ gap: SPACE[3] }}>
        <Skeleton width="85%" height={30} />
        <Skeleton width="60%" height={30} />
      </View>
      <View style={{ flexDirection: "row", gap: SPACE[2] }}>
        <Skeleton width={104} height={30} radius={RADII.pill} />
        <Skeleton width={140} height={30} radius={RADII.pill} />
      </View>
      {para(["100%", "96%", "100%", "62%"])}
      <Skeleton width="55%" height={24} />
      {para(["100%", "92%", "70%"])}
      <Skeleton height={130} radius={RADII.lg} />
      {para(["100%", "88%"])}
    </View>
  );
}
