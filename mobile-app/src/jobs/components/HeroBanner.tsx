import React from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { heroStatPills } from "../jobCategories";
import type { JobDashboardStats } from "@/types";

export function HeroBanner({ stats, onBrowse }: { stats: JobDashboardStats | undefined; onBrowse: () => void }) {
  const { width } = useWindowDimensions();
  const pills = heroStatPills(stats);
  return (
    <LinearGradient
      colors={["#4F46E5", "#7C3AED"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, padding: 24, overflow: "hidden", minHeight: 170 }}
    >
      <View pointerEvents="none" style={{ position: "absolute", right: -40, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.10)" }} />
      <View pointerEvents="none" style={{ position: "absolute", right: 60, bottom: -70, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.07)" }} />
      <View pointerEvents="none" style={{ position: "absolute", left: -30, bottom: -40, width: 100, height: 100, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.06)", transform: [{ rotate: "20deg" }] }} />
      {width >= 768 ? (
        <View pointerEvents="none" style={{ position: "absolute", right: 36, top: 0, bottom: 0, justifyContent: "center" }}>
          <Ionicons name="briefcase" size={104} color="rgba(255,255,255,0.18)" />
        </View>
      ) : null}

      <Text style={{ fontSize: 24, fontWeight: "700", color: "#FFFFFF" }}>Find your dream job</Text>
      <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 6, maxWidth: 460 }}>
        Verified openings from real companies, updated regularly
      </Text>

      {pills.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {pills.map((p) => (
            <View key={p} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={onBrowse}
        accessibilityRole="button"
        accessibilityLabel="Browse Jobs"
        style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 16 }}
      >
        <Text style={{ color: "#4F46E5", fontWeight: "700", fontSize: 14 }}>Browse Jobs</Text>
        <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
      </Pressable>
    </LinearGradient>
  );
}
