import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { BackButton } from "@/components/learning/BackButton";
import { LAYOUT, RADII, SPACE, TOUCH, useTheme } from "@/theme";

/** Back · breadcrumb (Course › Chapter) · Aa · bookmark. */
export function ReaderTopBar({
  courseName,
  chapterName,
  onBack,
  showFontControl,
  fontMenuOpen,
  onToggleFontMenu,
  canBookmark,
  bookmarked,
  onToggleBookmark,
  accentColor,
}: {
  courseName: string;
  chapterName?: string;
  onBack: () => void;
  showFontControl: boolean;
  fontMenuOpen: boolean;
  onToggleFontMenu: () => void;
  canBookmark: boolean;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  accentColor: string;
}) {
  const { colors, type, gutter } = useTheme();
  const iconBtn = { width: TOUCH.min, height: TOUCH.min, alignItems: "center" as const, justifyContent: "center" as const, borderRadius: RADII.md };
  return (
    <View style={{ backgroundColor: colors.canvas }}>
      <View style={{ width: "100%", maxWidth: LAYOUT.pageMaxWidth, alignSelf: "center", paddingHorizontal: gutter, paddingVertical: SPACE[2], flexDirection: "row", alignItems: "center", gap: SPACE[2] }}>
        <BackButton onPress={onBack} />
        <View style={{ flex: 1, minWidth: 0 }} accessible accessibilityLabel={`${courseName}${chapterName ? `, ${chapterName}` : ""}`}>
          <Text numberOfLines={1} style={[type.caption, { color: colors.textMuted }]}>
            {courseName}
          </Text>
          {chapterName ? (
            <Text numberOfLines={1} style={[type.label, { color: colors.text }]}>
              {chapterName}
            </Text>
          ) : null}
        </View>
        {showFontControl ? (
          <PressableScale
            onPress={onToggleFontMenu}
            activeScale={0.92}
            accessibilityLabel="Text size"
            accessibilityState={{ expanded: fontMenuOpen }}
            style={[iconBtn, { backgroundColor: fontMenuOpen ? colors.primarySoft : "transparent" }]}
          >
            <Text style={{ fontFamily: type.h1.fontFamily, fontSize: 17, color: fontMenuOpen ? colors.primaryText : colors.text }}>
              A<Text style={{ fontSize: 12 }}>a</Text>
            </Text>
          </PressableScale>
        ) : null}
        {canBookmark ? (
          <PressableScale
            onPress={onToggleBookmark}
            activeScale={0.9}
            accessibilityLabel={bookmarked ? "Remove bookmark" : "Bookmark this topic"}
            accessibilityState={{ selected: bookmarked }}
            style={iconBtn}
          >
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={bookmarked ? accentColor : colors.text} />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}
