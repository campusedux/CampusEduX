import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/ui/PressableScale";
import { MOTION, RADII, SPACE, useTheme } from "@/theme";

export interface NavTarget {
  title: string;
  slug: string;
  /** Set when the neighbour is in a different chapter. */
  chapterName?: string;
}

function NavCard({ dir, target, onOpen }: { dir: "prev" | "next"; target: NavTarget; onOpen: (t: NavTarget) => void }) {
  const { colors, type, shadow } = useTheme();
  const next = dir === "next";
  return (
    <PressableScale
      onPress={() => onOpen(target)}
      activeScale={MOTION.pressedScale}
      accessibilityLabel={`${next ? "Next" : "Previous"} topic: ${target.title}${target.chapterName ? `, in ${target.chapterName}` : ""}`}
      style={[
        { flex: 1, minHeight: 76, padding: SPACE[4], borderRadius: RADII.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: SPACE[3] },
        shadow("sm"),
      ]}
    >
      {!next ? <Ionicons name="chevron-back" size={20} color={colors.textMuted} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[type.overline, { color: colors.textMuted, textAlign: next ? "right" : "left" }]}>{next ? "Next" : "Previous"}</Text>
        <Text numberOfLines={2} style={[type.title, { color: colors.text, marginTop: 2, textAlign: next ? "right" : "left" }]}>
          {target.title}
        </Text>
        {target.chapterName ? (
          <Text numberOfLines={1} style={[type.caption, { color: colors.textSecondary, marginTop: 2, textAlign: next ? "right" : "left" }]}>
            {next ? "Next chapter · " : "Previous chapter · "}
            {target.chapterName}
          </Text>
        ) : null}
      </View>
      {next ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null}
    </PressableScale>
  );
}

/** Previous / Next topic cards (course order — the topic RPC already crosses chapter boundaries). Side by side on wider screens, stacked on phones. */
export function TopicNavFooter({ prev, next, onOpen }: { prev: NavTarget | null; next: NavTarget | null; onOpen: (t: NavTarget) => void }) {
  const { width } = useTheme();
  if (!prev && !next) return null;
  const row = width >= 600;
  return (
    <View style={{ flexDirection: row ? "row" : "column", gap: SPACE[3] }}>
      {prev ? <NavCard dir="prev" target={prev} onOpen={onOpen} /> : row ? <View style={{ flex: 1 }} /> : null}
      {next ? <NavCard dir="next" target={next} onOpen={onOpen} /> : row ? <View style={{ flex: 1 }} /> : null}
    </View>
  );
}
