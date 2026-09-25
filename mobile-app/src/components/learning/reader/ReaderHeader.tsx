import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RADII, SPACE, useTheme, type AccentTokens } from "@/theme";

/** Topic title (H1), summary and meta chips (real reading time, chapter). */
export function ReaderHeader({
  title,
  summary,
  minutes,
  chapterName,
  accent,
}: {
  title: string;
  summary?: string | null;
  /** From the real word count; omit for locked topics. */
  minutes?: number | null;
  chapterName?: string;
  accent: AccentTokens;
}) {
  const { colors, type } = useTheme();
  return (
    <View>
      <Text accessibilityRole="header" style={[type.h1, { color: colors.text }]}>
        {title}
      </Text>
      {summary ? <Text style={[type.body, { color: colors.textSecondary, marginTop: SPACE[3] }]}>{summary}</Text> : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE[2], marginTop: SPACE[4] }}>
        {minutes ? (
          <View
            accessible
            accessibilityLabel={`${minutes} minute read`}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: SPACE[3], paddingVertical: 6, borderRadius: RADII.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[type.label, { color: colors.textSecondary, fontSize: 13 }]}>{minutes} min read</Text>
          </View>
        ) : null}
        {chapterName ? (
          <View style={{ flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: SPACE[3], paddingVertical: 6, borderRadius: RADII.pill, backgroundColor: accent.soft }}>
            <Ionicons name="albums-outline" size={14} color={accent.text} />
            <Text numberOfLines={1} style={[type.label, { color: accent.text, fontSize: 13, flexShrink: 1 }]}>
              {chapterName}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
