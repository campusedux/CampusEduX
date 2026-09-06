import React, { useState, type ReactNode } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { A4_WIDTH, A4_MIN_HEIGHT } from "@/resume/ResumeDocument";

const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.2;

/**
 * Scales a fixed-794px <ResumeDocument> to fit the screen width (so there is
 * NEVER a horizontal scrollbar at 100%), with +/- zoom and a double-tap
 * reset. Scaled dimensions drive a sized spacer so the ScrollViews know the
 * real content bounds — smooth vertical scroll, horizontal scroll only when
 * zoomed past fit. Mirrors the website's <ResumeSheetScaler>.
 */
export function ResumeSheet({ children, showZoom = true }: { children: ReactNode; showZoom?: boolean }) {
  const [containerW, setContainerW] = useState(0);
  const [sheetH, setSheetH] = useState(A4_MIN_HEIGHT);
  const [zoom, setZoom] = useState(1);

  const base = containerW > 0 ? containerW / A4_WIDTH : 0;
  const s = base * zoom;
  const scaledW = A4_WIDTH * s;
  const scaledH = sheetH * s;

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}>
      {containerW === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#4F39F6" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: "center", paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            horizontal
            scrollEnabled={scaledW > containerW + 1}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Math.max(0, (containerW - scaledW) / 2) }}
          >
            <View style={{ width: scaledW, height: scaledH }}>
              <Pressable onPress={() => setZoom((z) => (z === 1 ? 1.6 : 1))} style={{ position: "absolute", inset: 0 }}>
                <View
                  onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
                  style={{
                    width: A4_WIDTH,
                    position: "absolute",
                    left: -(A4_WIDTH * (1 - s)) / 2,
                    top: -(sheetH * (1 - s)) / 2,
                    transform: [{ scale: s }],
                    shadowColor: "#111827",
                    shadowOpacity: 0.12,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 4,
                    backgroundColor: "#fff",
                  }}
                >
                  {children}
                </View>
              </Pressable>
            </View>
          </ScrollView>
        </ScrollView>
      )}

      {showZoom && (
        <View style={{ position: "absolute", bottom: 14, right: 14, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 22, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 4, elevation: 3 }}>
          <Pressable onPress={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 10) / 10))} hitSlop={8} style={{ padding: 8 }}>
            <Ionicons name="remove" size={18} color="#374151" />
          </Pressable>
          <Text style={{ width: 42, textAlign: "center", fontSize: 12, color: "#6B7280" }}>{Math.round(s * 100)}%</Text>
          <Pressable onPress={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 10) / 10))} hitSlop={8} style={{ padding: 8 }}>
            <Ionicons name="add" size={18} color="#374151" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default ResumeSheet;
