import React, { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  ACCENT_SWATCHES,
  DESIGN_FONT_LABELS,
  DESIGN_HEADING_LABELS,
  DESIGN_MARGIN_LABELS,
  DESIGN_SIZE_LABELS,
  DESIGN_SPACING_LABELS,
  isEmptyDesign,
  type DesignFontFamily,
  type DesignHeading,
  type DesignMargin,
  type DesignSize,
  type DesignSpacing,
} from "@/services/resumeDesign";
import type { ResumeDesign } from "@/types";

function OptionRow<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(active ? undefined : opt)}
              style={{
                paddingHorizontal: 12,
                height: 34,
                justifyContent: "center",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: active ? "#4F39F6" : "#E5E7EB",
                backgroundColor: active ? "#4F39F6" : "#fff",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : "#6B7280" }}>{labels[opt]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Bottom-sheet design editor — accent / font / size / spacing / margins / heading + reset. */
export function DesignSheet({
  visible,
  design,
  onChange,
  onClose,
}: {
  visible: boolean;
  design: ResumeDesign;
  onChange: (next: ResumeDesign) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<ResumeDesign>(design);

  React.useEffect(() => {
    if (visible) setLocal(design);
  }, [visible, design]);

  const set = <K extends keyof ResumeDesign>(key: K, value: ResumeDesign[K] | undefined) => {
    const next = { ...local };
    if (value == null) delete next[key];
    else next[key] = value;
    setLocal(next);
    onChange(next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} onPress={onClose} />
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "82%" }}>
        <View style={{ alignItems: "center", paddingTop: 10 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB" }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Design</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Accent colour</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            {ACCENT_SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => set("accentColor", local.accentColor === c ? undefined : c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: c,
                  borderWidth: local.accentColor === c ? 3 : 1,
                  borderColor: local.accentColor === c ? "#111827" : "#fff",
                }}
              />
            ))}
          </View>

          <OptionRow<DesignFontFamily> label="Font" value={local.fontFamily} options={["sans", "serif", "slab"]} labels={DESIGN_FONT_LABELS} onChange={(v) => set("fontFamily", v)} />
          <OptionRow<DesignSize> label="Font size" value={local.size} options={["s", "m", "l"]} labels={DESIGN_SIZE_LABELS} onChange={(v) => set("size", v)} />
          <OptionRow<DesignSpacing> label="Spacing" value={local.spacing} options={["compact", "normal", "relaxed"]} labels={DESIGN_SPACING_LABELS} onChange={(v) => set("spacing", v)} />
          <OptionRow<DesignMargin> label="Margins" value={local.margin} options={["narrow", "normal", "wide"]} labels={DESIGN_MARGIN_LABELS} onChange={(v) => set("margin", v)} />
          <OptionRow<DesignHeading>
            label="Heading style"
            value={local.headingStyle}
            options={["template", "rule", "full-underline", "plain-caps", "bar"]}
            labels={DESIGN_HEADING_LABELS}
            onChange={(v) => set("headingStyle", v)}
          />

          <Text style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>
            Font size and margins are clamped so the résumé always stays ATS-readable.
          </Text>

          <Pressable
            onPress={() => {
              setLocal({});
              onChange({});
            }}
            disabled={isEmptyDesign(local)}
            style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, height: 36, opacity: isEmptyDesign(local) ? 0.4 : 1 }}
          >
            <Ionicons name="refresh" size={14} color="#6B7280" />
            <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: "700", color: "#6B7280" }}>Reset design</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default DesignSheet;
