import React from "react";
import { Animated, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PressableScale } from "@/components/ui";
import { GradientIcon, withAlpha } from "./HomeCategoryTile";
import { useEnterAnimation } from "./useEnterAnimation";

const LANGUAGES = ["Java", "Python", "C", "C++", "JS"];
const GREEN = "#22C55E";

/** Thin rounded "code line" decoration. */
function CodeLine({ color, width, top }: { color: string; width: number; top: number }) {
  return <View style={{ position: "absolute", right: 72, top, width, height: 4, borderRadius: 2, backgroundColor: color }} />;
}

/** Full-width dark "code editor" featured card. `problemCount` is only shown when it is real (> 0). */
export function CodingPracticeCard({ problemCount, onPress }: { problemCount: number | null; onPress: () => void }) {
  const enterStyle = useEnterAnimation(0);
  return (
    <Animated.View style={[{ marginBottom: 12 }, enterStyle]}>
      <PressableScale onPress={onPress} accessibilityLabel="Coding Practice" style={{ borderRadius: 20, overflow: "hidden" }}>
        <LinearGradient colors={["#0F172A", "#1E293B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ minHeight: 150, padding: 16, justifyContent: "space-between" }}>
          <View pointerEvents="none" style={{ position: "absolute", right: -18, top: 14, opacity: 0.08 }}>
            <Ionicons name="code-slash" size={130} color="#FFFFFF" />
          </View>
          <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
            <CodeLine color="rgba(34,197,94,0.35)" width={44} top={22} />
            <CodeLine color="rgba(96,165,250,0.35)" width={30} top={34} />
            <CodeLine color="rgba(168,85,247,0.35)" width={52} top={46} />
            <CodeLine color="rgba(34,197,94,0.25)" width={24} top={58} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="code-slash" size={24} color={GREEN} />
            </View>
            <View style={{ flex: 1, marginLeft: 12, marginRight: 52 }}>
              <Text numberOfLines={1} style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>Coding Practice</Text>
              <Text numberOfLines={1} style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>
                Solve problems & run code
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 14 }}>
            <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", marginRight: 12 }}>
              {LANGUAGES.map((l) => (
                <View key={l} style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, marginRight: 6, marginBottom: 4 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 11 }}>{l}</Text>
                </View>
              ))}
              {problemCount ? (
                <View style={{ paddingVertical: 4, marginBottom: 4, justifyContent: "center" }}>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" }}>{problemCount} problems</Text>
                </View>
              ) : null}
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: GREEN, alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

/** Soft-tinted half-width card (Mock Tests / Interview Questions). */
export function PracticeMiniCard({
  title,
  subtitle,
  icon,
  color,
  colors,
  index,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  colors: [string, string];
  index: number;
  onPress: () => void;
}) {
  const enterStyle = useEnterAnimation(index);
  return (
    <Animated.View style={[{ flex: 1 }, enterStyle]}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={title}
        style={{
          minHeight: 120,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: withAlpha(color, 0.15),
          backgroundColor: withAlpha(color, 0.07),
          padding: 12,
          justifyContent: "space-between",
        }}
      >
        <GradientIcon icon={icon} colors={colors} />
        <View style={{ marginTop: 8, paddingRight: 22 }}>
          <Text numberOfLines={1} style={{ color: "#111827", fontSize: 14, fontWeight: "700" }}>{title}</Text>
          <Text numberOfLines={1} style={{ color: "#4B5563", fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
        </View>
        <View pointerEvents="none" style={{ position: "absolute", right: 12, bottom: 12 }}>
          <Ionicons name="arrow-forward" size={16} color={color} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}
