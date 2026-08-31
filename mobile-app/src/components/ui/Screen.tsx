import React from "react";
import { View, ScrollView, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
          contentContainerStyle={{ flexGrow: 1 }}
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
      <View className={`flex-1 ${className ?? ""}`} {...(rest as any)}>
        {children}
      </View>
    </SafeAreaView>
  );
}
