import React from "react";
import { Platform, View, ScrollView, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  edges?: ("top" | "bottom" | "left" | "right")[];
}

/**
 * Base screen wrapper handling safe-area insets consistently across
 * every screen in the app. Set scroll for content-heavy screens.
 */
export function Screen({ children, scroll, edges = ["top", "bottom"], className, ...rest }: ScreenProps) {
  // For a ScrollView, padding/layout classes belong on the *content container*
  // — putting them on the ScrollView itself (or dropping them, as before) left
  // scrolling screens with no horizontal padding at all.
  if (scroll) {
    return (
      <SafeAreaView edges={edges} className="flex-1 bg-white">
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
    <SafeAreaView edges={edges} className="flex-1 bg-white">
      <View className={`flex-1 ${className ?? ""}`} style={WEB_CONTENT} {...(rest as any)}>
        {children}
      </View>
    </SafeAreaView>
  );
}
