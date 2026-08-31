import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";

const SECTIONS: { title: string; points: string[] }[] = [
  {
    title: "Structure",
    points: [
      "One page for < 5 years of experience. Two only if every line earns its place.",
      "Order: Contact → Summary (optional) → Skills → Experience/Projects → Education → Achievements.",
      "Use a single, ATS-safe font (Calibri, Arial, Inter) at 10–12pt. No tables, columns, text boxes or images.",
    ],
  },
  {
    title: "Bullet points that land",
    points: [
      "Start with a strong past-tense verb: Built, Led, Reduced, Automated, Shipped.",
      "Formula: Action + what + tech + measurable result. e.g. \"Cut API latency 40% by adding Redis caching.\"",
      "3–5 bullets per role/project. Cut duties everyone has; keep outcomes only you can claim.",
    ],
  },
  {
    title: "Keywords & ATS",
    points: [
      "Mirror the exact words from the job description (e.g. \"React Native\", not just \"mobile\").",
      "Put a plain \"Skills\" section with comma-separated tech — recruiters and parsers both scan it first.",
      "Save and send as PDF unless the posting asks for .docx. Name it FirstName_LastName_Resume.pdf.",
    ],
  },
  {
    title: "Projects (for students)",
    points: [
      "2–3 projects beat a long list. Include the problem, your role, the stack, and a live/GitHub link.",
      "Quantify anything you can: users, data size, test coverage, performance, marks/rank.",
      "Pin the repo, add a README with screenshots — recruiters do click.",
    ],
  },
  {
    title: "Before you send",
    points: [
      "Run it through the ATS Score check in this app and fix anything below 80%.",
      "Read every bullet aloud. Remove \"responsible for\", \"worked on\", \"various\", \"etc.\".",
      "Get one person to proofread — a single typo is the fastest rejection.",
    ],
  },
];

export function ResumeTipsScreen() {
  const navigation = useNavigation();

  return (
    <Screen className="px-0">
      <View className="flex-row items-center px-6 mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">Resume Tips & Tricks</Text>
      </View>

      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-gray-500 text-sm mb-5">
          A quick, practical checklist for a resume that gets past the parser and holds a recruiter&apos;s attention.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} className="mb-5">
            <Text className="font-bold text-gray-900 mb-2">{section.title}</Text>
            {section.points.map((point, i) => (
              <View key={i} className="flex-row items-start mb-2">
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={{ marginTop: 2, marginRight: 8 }} />
                <Text className="text-gray-700 text-[14px] leading-5 flex-1">{point}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

export default ResumeTipsScreen;
