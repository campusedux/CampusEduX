import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { BottomSheet } from "@/components/ui";
import type { ExperienceLevel, Job, WorkMode } from "@/types";
import { J } from "./jobsTheme";

export interface DashFilters {
  experienceLevel: ExperienceLevel | null;
  workMode: WorkMode | null;
  jobType: Job["jobType"] | null;
  location: string;
}

export const EMPTY_DASH_FILTERS: DashFilters = { experienceLevel: null, workMode: null, jobType: null, location: "" };

export function hasDashFilters(f: DashFilters): boolean {
  return !!(f.experienceLevel || f.workMode || f.jobType || f.location.trim());
}

export function OptionChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? J.primary : J.border,
        backgroundColor: active ? J.primary : "#FFFFFF",
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#FFFFFF" : J.text }}>{label}</Text>
    </Pressable>
  );
}

function Group<T extends string>({ title, options, value, onChange }: { title: string; options: readonly { label: string; value: T }[]; value: T | null; onChange: (v: T | null) => void }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: J.text, marginBottom: 8 }}>{title}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <OptionChip key={o.value} label={o.label} active={value === o.value} onPress={() => onChange(value === o.value ? null : o.value)} />
        ))}
      </View>
    </View>
  );
}

interface Props {
  visible: boolean;
  value: DashFilters;
  onClose: () => void;
  onApply: (f: DashFilters) => void;
}

export function JobFiltersSheet({ visible, value, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<DashFilters>(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter jobs" scroll>
      <Group
        title="Experience"
        options={[{ label: "Fresher", value: "Fresher" }, { label: "Experienced", value: "Experienced" }] as const}
        value={draft.experienceLevel}
        onChange={(experienceLevel) => setDraft((d) => ({ ...d, experienceLevel }))}
      />
      <Group
        title="Work mode"
        options={[{ label: "Remote", value: "Remote" }, { label: "Hybrid", value: "Hybrid" }, { label: "On-site", value: "On-site" }] as const}
        value={draft.workMode}
        onChange={(workMode) => setDraft((d) => ({ ...d, workMode }))}
      />
      <Group
        title="Job type"
        options={[{ label: "Full-time", value: "Full Time" }, { label: "Internship", value: "Internship" }] as const}
        value={draft.jobType}
        onChange={(jobType) => setDraft((d) => ({ ...d, jobType }))}
      />
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: J.text, marginBottom: 8 }}>Location</Text>
        <TextInput
          value={draft.location}
          onChangeText={(location) => setDraft((d) => ({ ...d, location }))}
          placeholder="City, e.g. Pune"
          placeholderTextColor="#94A3B8"
          style={{ height: 46, borderRadius: 12, borderWidth: 1, borderColor: J.border, backgroundColor: J.inputBg, paddingHorizontal: 14, color: J.text }}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          onPress={() => setDraft(EMPTY_DASH_FILTERS)}
          accessibilityRole="button"
          style={{ flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: J.border, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontWeight: "700", color: J.text }}>Reset</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onApply({ ...draft, location: draft.location.trim() });
            onClose();
          }}
          accessibilityRole="button"
          style={{ flex: 2, height: 46, borderRadius: 12, backgroundColor: J.primary, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontWeight: "700", color: "#FFFFFF" }}>Apply filters</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
