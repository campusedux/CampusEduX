import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useBuilderStore } from "./builderStore";
import { WizardScreen } from "./components/wizard";
import type { CustomProjectType, CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderType">;

const TYPES: { id: CustomProjectType; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "academic", title: "Academic Project", icon: "school" },
  { id: "personal", title: "Personal Project", icon: "person" },
  { id: "business", title: "Business Project", icon: "briefcase" },
];

export function BuilderTypeScreen() {
  const navigation = useNavigation<Nav>();
  const projectType = useBuilderStore((s) => s.config.projectType);
  const setType = useBuilderStore((s) => s.setType);

  return (
    <WizardScreen
      step={1}
      title="Choose a project type"
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderLevel")}
      nextDisabled={!projectType}
    >
      {TYPES.map((t) => {
        const selected = projectType === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => setType(t.id)}
            className="rounded-2xl border px-4 py-4 mb-3"
            style={{ borderColor: selected ? "#4F39F6" : "#E5E7EB", backgroundColor: selected ? "#EEF0FF" : "#FFFFFF" }}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: selected ? "#4F39F620" : "#F3F4F6" }}>
                <Ionicons name={t.icon} size={20} color={selected ? "#4F39F6" : "#6B7280"} />
              </View>
              <Text className={`font-semibold flex-1 ${selected ? "text-primary" : "text-gray-900"}`}>{t.title}</Text>
              <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? "#4F39F6" : "#D1D5DB"} />
            </View>
          </Pressable>
        );
      })}
    </WizardScreen>
  );
}

export default BuilderTypeScreen;
