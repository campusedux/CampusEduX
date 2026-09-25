import React from "react";
import { Platform, View, ScrollView, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { DARK_MODE_SCOPE } from "@/theme/scheme";
import { useSchemeColors } from "@/theme/useSchemeColors";

/**
 * Web only: keep content to a comfortable reading width and centre it, instead
 * of stretching every card across a 1440px browser. Below the max width this is
 * a no-op (width 100%), so mobile-width browsers match native exactly. Native
 * gets an empty object.
 */
const WEB_CONTENT: object = Platform.select({
  web: { width: "100%", maxWidth: 1100, alignSelf: "center" },
  default: {},
}) as object;

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  /** Pull-to-refresh control; only applies with `scroll`. Passed through to the ScrollView. */
  refreshControl?: React.ReactElement;
  edges?: ("top" | "bottom" | "left" | "right")[];
  /** Page ground: white (default, unchanged) or the soft lavender canvas for card-based screens. */
  background?: "white" | "canvas";
  /**
   * Follow the app theme (Light / Dark / System + AMOLED) for the ground colour and status bar.
   * Opt-in per screen so screens that still hard-code light-mode text are not put on a dark ground;
   * defaults to app-wide only when DARK_MODE_SCOPE is "all". In Light mode a themed Screen is pixel-identical
   * to the classic one (same #FFFFFF / #F5F6FB).
   */
  themed?: boolean;
}

/**
 * Base screen wrapper handling safe-area insets consistently across
 * every screen in the app. Set scroll for content-heavy screens.
 */
export function Screen({ children, scroll, edges = ["top", "bottom"], background = "white", themed, className, ...rest }: ScreenProps) {
  const { colors, isDark } = useSchemeColors();
  const applyTheme = themed ?? DARK_MODE_SCOPE === "all";
  // Classic path keeps the exact class-based ground; themed path uses the same colours from the theme tokens.
  const bg = applyTheme ? "" : background === "canvas" ? "bg-canvas" : "bg-white";
  const ground = applyTheme ? { backgroundColor: background === "canvas" ? colors.canvas : colors.bg } : undefined;
  const statusBar = applyTheme ? <StatusBar style={isDark ? "light" : "dark"} /> : null;
  // For a ScrollView, padding/layout classes belong on the *content container*
  // — putting them on the ScrollView itself (or dropping them, as before) left
  // scrolling screens with no horizontal padding at all.
  if (scroll) {
    return (
      <SafeAreaView edges={edges} className={`flex-1 ${bg}`} style={ground}>
        {statusBar}
        <ScrollView
          className="flex-1"
          contentContainerClassName={className}
          contentContainerStyle={[{ flexGrow: 1 }, WEB_CONTENT]}
          keyboardShouldPersistTaps="handled"
          {...(rest as any)}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={edges} className={`flex-1 ${bg}`} style={ground}>
      {statusBar}
      <View className={`flex-1 ${className ?? ""}`} style={WEB_CONTENT} {...(rest as any)}>
        {children}
      </View>
    </SafeAreaView>
  );
}
