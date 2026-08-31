import React from "react";
import { View, Text, Pressable, ScrollView, Share, Linking } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { BRAND } from "@/constants";
import { useNote, useToggleNoteBookmark } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/authStore";
import type { PlacementStackParamList } from "@/types";

type Rte = RouteProp<PlacementStackParamList, "NoteDetail">;

export function NoteDetailScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<Rte>();
  const isPremiumUser = useAuthStore((s) => s.user?.isPremium ?? false);
  const { data: note, isLoading, isError, refetch } = useNote(params.noteId);
  const toggleBookmark = useToggleNoteBookmark();

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <LoadingState label="Loading note..." />
      </Screen>
    );
  }
  if (isError || !note) {
    return (
      <Screen className="items-center justify-center px-6">
        <ErrorState message="Couldn't load this note." onRetry={refetch} />
      </Screen>
    );
  }

  const locked = note.isPremium && !isPremiumUser;

  const onShare = async () => {
    try {
      await Share.share({
        message: `${note.title} — ${note.topic || note.category} · Study notes on ${BRAND.name}`,
      });
    } catch {
      // dismissed
    }
  };

  const onOpenFile = async () => {
    if (!note.fileUrl) return;
    try {
      const ok = await Linking.canOpenURL(note.fileUrl);
      if (!ok) throw new Error("No app can open this file.");
      await Linking.openURL(note.fileUrl);
    } catch (error: any) {
      notify("Couldn't open file", error?.message ?? "The file link looks invalid.");
    }
  };

  return (
    <Screen className="px-0">
      <View className="flex-row items-center justify-between px-6 mt-2 mb-2">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <View className="flex-row items-center" style={{ gap: 18 }}>
          <Pressable
            onPress={() => toggleBookmark.mutate({ noteId: note.id, isBookmarked: note.isBookmarked })}
            hitSlop={8}
          >
            <Ionicons
              name={note.isBookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color={note.isBookmarked ? "#4F39F6" : "#111827"}
            />
          </Pressable>
          <Pressable onPress={onShare} hitSlop={8}>
            <Ionicons name="share-social-outline" size={22} color="#111827" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center mb-2" style={{ gap: 6 }}>
          <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: "#EEF0FF" }}>
            <Text className="text-primary text-[11px] font-semibold">{note.category}</Text>
          </View>
          {note.isPremium ? (
            <View className="flex-row items-center rounded-md px-2 py-0.5" style={{ backgroundColor: "#FEF3C7" }}>
              <Ionicons name="star" size={10} color="#B45309" />
              <Text className="text-[11px] font-semibold ml-1" style={{ color: "#B45309" }}>
                Premium
              </Text>
            </View>
          ) : null}
        </View>

        <Text className="text-[20px] font-bold text-gray-900 mb-1">{note.title}</Text>
        {note.topic ? <Text className="text-gray-500 text-sm mb-4">{note.topic}</Text> : null}

        {locked ? (
          <View className="border border-amber-200 bg-amber-50 rounded-2xl p-5 items-center mt-4">
            <Ionicons name="lock-closed" size={28} color="#B45309" />
            <Text className="text-amber-900 font-semibold mt-2 mb-1">Premium note</Text>
            <Text className="text-amber-800 text-sm text-center mb-4">
              Upgrade to CampusEduX Premium to read this note and download its resources.
            </Text>
            <Button
              label="See Premium Plans"
              onPress={() => navigation.getParent()?.navigate("Premium", { screen: "PremiumPlans" })}
              className="w-full"
            />
          </View>
        ) : (
          <>
            <Text className="text-[15px] leading-6 text-gray-800">{note.content}</Text>

            {note.tags.length > 0 ? (
              <View className="flex-row flex-wrap mt-5" style={{ gap: 6 }}>
                {note.tags.map((tag) => (
                  <Text key={tag} className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                    #{tag}
                  </Text>
                ))}
              </View>
            ) : null}

            {note.fileUrl ? (
              <Button
                label="Open / Download PDF"
                variant="outline"
                leftIcon="download-outline"
                className="mt-6"
                onPress={onOpenFile}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

export default NoteDetailScreen;
