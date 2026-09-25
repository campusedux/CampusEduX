import React from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LAYOUT, useTheme } from "@/theme";

/**
 * Themed page shell for every Learning screen (canvas ground + status-bar
 * contrast for the active scheme). Replaces the shared `Screen` inside the
 * Learning section only, because that wrapper is hard-coded white.
 */
export function LearningScreen({ children, edges = ["top", "bottom"] }: { children: React.ReactNode; edges?: Edge[] }) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}

/** Centres content and caps it at the page max width (1180px) with the responsive gutter. */
export function PageContainer({
  children,
  style,
  maxWidth = LAYOUT.pageMaxWidth,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxWidth?: number;
}) {
  const { gutter } = useTheme();
  return <View style={[{ width: "100%", maxWidth, alignSelf: "center", paddingHorizontal: gutter }, style]}>{children}</View>;
}
