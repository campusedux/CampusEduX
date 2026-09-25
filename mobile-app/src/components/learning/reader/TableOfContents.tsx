import React, { useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MOTION, RADII, SPACE, useTheme, type AccentTokens } from "@/theme";
import { useSettingsStore } from "@/store/settingsStore";
import type { TocItem } from "@/learning/reader/readerModel";

function Items({ items, accent, onSelect }: { items: TocItem[]; accent: AccentTokens; onSelect: (id: string) => void }) {
  const { colors, type } = useTheme();
  return (
    <>
      {items.map((it) => (
        <Pressable
          key={it.id}
          onPress={() => onSelect(it.id)}
          accessibilityRole="link"
          accessibilityLabel={`Jump to ${it.text}`}
          style={({ pressed }) => ({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: SPACE[2],
            paddingVertical: SPACE[2],
            paddingLeft: SPACE[3] + (it.depth === 1 ? SPACE[4] : 0),
            paddingRight: SPACE[2],
            borderRadius: RADII.sm,
            backgroundColor: pressed ? colors.surfacePressed : "transparent",
          })}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: it.depth === 0 ? accent.base : "transparent", borderWidth: it.depth === 0 ? 0 : 1.5, borderColor: accent.base }} />
          <Text numberOfLines={2} style={[type.small, { flex: 1, color: it.depth === 0 ? colors.text : colors.textSecondary, fontSize: 14, lineHeight: 20 }]}>
            {it.text}
          </Text>
        </Pressable>
      ))}
    </>
  );
}

/**
 * "In this topic" outline. Phone: a collapsible card (collapsed by default).
 * Wide (≥ 1024px): rendered as a sticky sidebar by the screen (`variant="sidebar"`).
 * Tapping an item scrolls the article to that heading.
 */
export function TableOfContents({ items, accent, variant, onSelect }: { items: TocItem[]; accent: AccentTokens; variant: "collapsible" | "sidebar"; onSelect: (id: string) => void }) {
  const { colors, type } = useTheme();
  const reduce = useSettingsStore((s) => s.preferences.reduceAnimations);
  const [open, setOpen] = useState(false);

  if (variant === "sidebar") {
    return (
      <View style={{ flex: 1 }}>
        <Text style={[type.overline, { color: colors.textMuted, marginBottom: SPACE[2], paddingLeft: SPACE[3] }]}>In this topic</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Items items={items} accent={accent} onSelect={onSelect} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ borderRadius: RADII.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" }}>
      <Pressable
        onPress={() => {
          if (!reduce) LayoutAnimation.configureNext(LayoutAnimation.create(MOTION.accordion, "easeInEaseOut", "opacity"));
          setOpen((v) => !v);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`In this topic, ${items.length} sections`}
        style={({ pressed }) => ({ minHeight: 52, flexDirection: "row", alignItems: "center", gap: SPACE[3], paddingHorizontal: SPACE[4], backgroundColor: pressed ? colors.surfacePressed : "transparent" })}
      >
        <Ionicons name="list-outline" size={20} color={accent.text} />
        <Text style={[type.title, { flex: 1, color: colors.text }]}>In this topic</Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>{items.length}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: SPACE[2], paddingBottom: SPACE[2], borderTopWidth: 1, borderTopColor: colors.borderSoft }}>
          <Items
            items={items}
            accent={accent}
            onSelect={(id) => {
              setOpen(false);
              onSelect(id);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
