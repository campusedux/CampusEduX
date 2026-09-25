import React from "react";
import { View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, PressableScale, SectionHeader } from "@/components/ui";
import { usePracticeCategories } from "@/hooks/usePractice";
import { CARD_SHADOW } from "@/constants/theme";
import type { HomeStackParamList } from "@/types";
import { PracticeHeader } from "./practiceUi";

type Nav = NativeStackNavigationProp<HomeStackParamList, "PracticeHub">;

const TILES: {
  route: keyof HomeStackParamList;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  tint: string;
  bg: string;
}[] = [
  {
    route: "PracticeProblems",
    icon: "code-slash",
    title: "Coding Problems",
    body: "Solve problems in Java, Python, C, C++ or JavaScript. Filter by difficulty and topic.",
    tint: "#4F39F6",
    bg: "#EEF0FF",
  },
  {
    route: "PracticeCompiler",
    icon: "terminal",
    title: "Online Compiler",
    body: "A quick scratchpad — write and run code in five languages, no problem attached.",
    tint: "#0D9488",
    bg: "#CCFBF1",
  },
  {
    route: "PracticeSubmissions",
    icon: "time",
    title: "Submissions",
    body: "Every solution you submit, with its verdict, language, run time and tests passed.",
    tint: "#7C3AED",
    bg: "#EDE9FE",
  },
  {
    route: "InterviewCategories",
    icon: "chatbubble-ellipses",
    title: "Interview Questions",
    body: "Interview questions and answers by topic, with an example and a key point for each.",
    tint: "#DB2777",
    bg: "#FCE7F3",
  },
];

export function PracticeHubScreen() {
  const navigation = useNavigation<Nav>();
  const categories = usePracticeCategories();
  const list = categories.data ?? [];
  const total = list.reduce((n, c) => n + (c.problem_count || 0), 0);

  return (
    <Screen>
      <PracticeHeader title="Practice" onBack={() => navigation.goBack()} />
      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={categories.isRefetching} onRefresh={() => categories.refetch()} tintColor="#4F39F6" />
        }
      >
        {TILES.map((t) => (
          <PressableScale
            key={t.title}
            onPress={() => (navigation as any).navigate(t.route)}
            className="bg-white rounded-2xl border border-gray-100 p-4 mb-3 flex-row items-center"
            style={CARD_SHADOW}
          >
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: t.bg }}>
              <Ionicons name={t.icon} size={22} color={t.tint} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900">{t.title}</Text>
              <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={3}>
                {t.body}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </PressableScale>
        ))}

        {list.length > 0 ? (
          <View className="mt-3">
            <SectionHeader title="Browse by topic" />
            <Text className="text-gray-400 text-xs mb-3">
              {total} problem{total === 1 ? "" : "s"}
            </Text>
            <View className="flex-row flex-wrap">
              {list.map((c) => (
                <Pressable
                  key={c.slug}
                  onPress={() => (navigation as any).navigate("PracticeProblems", { category: c.slug })}
                  className="flex-row items-center rounded-full border border-gray-200 bg-white px-3.5 py-1.5 mr-2 mb-2"
                >
                  <Text className="text-gray-700 text-sm font-medium">{c.name}</Text>
                  <View className="bg-gray-100 rounded-full px-1.5 ml-2">
                    <Text className="text-gray-500 text-xs font-semibold">{c.problem_count}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

export default PracticeHubScreen;
