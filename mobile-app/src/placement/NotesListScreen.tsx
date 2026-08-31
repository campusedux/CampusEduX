import React, { useState } from "react";
import { View, Text, Pressable, TextInput, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Chip, LoadingState, ErrorState, EmptyState, PressableScale } from "@/components/ui";
import { useNotes, useToggleNoteBookmark } from "@/hooks/useNotes";
import { useAuthStore } from "@/store/authStore";
import { academicFromUser, academicEmptyText } from "@/lib/personalization";
import { CARD_SHADOW } from "@/constants/theme";
import { NOTE_CATEGORIES } from "@/types";
import type { NoteCategory, PrepNote, PlacementStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<PlacementStackParamList, "Notes">;

const CATEGORY_FILTERS: (NoteCategory | "All")[] = ["All", ...NOTE_CATEGORIES];

export function NotesListScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<NoteCategory | "All">("All");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const academic = academicFromUser(useAuthStore((s) => s.user));

  const { data, isLoading, isError, refetch, isRefetching } = useNotes({
    search: search.trim() || undefined,
    category,
    bookmarkedOnly,
  });
  const toggleBookmark = useToggleNoteBookmark();

  return (
    <Screen className="px-0">
      <View className="px-6">
        <View className="flex-row items-center mt-2 mb-4">
          <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">Learning Material</Text>
        </View>

        <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-3" style={{ height: 46 }}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search notes, topics, tags..."
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setBookmarkedOnly((v) => !v)}
          className="flex-row items-center self-start mb-2"
          hitSlop={6}
        >
          <Ionicons
            name={bookmarkedOnly ? "bookmark" : "bookmark-outline"}
            size={16}
            color={bookmarkedOnly ? "#4F39F6" : "#6B7280"}
          />
          <Text className={`ml-1.5 text-sm ${bookmarkedOnly ? "text-primary font-semibold" : "text-gray-500"}`}>
            Bookmarked only
          </Text>
        </Pressable>
      </View>

      <View className="pl-6">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORY_FILTERS}
          keyExtractor={(c) => c}
          contentContainerStyle={{ paddingRight: 24, paddingVertical: 4 }}
          renderItem={({ item }) => (
            <Chip label={item} active={category === item} onPress={() => setCategory(item)} />
          )}
        />
      </View>

      {isLoading ? (
        <View className="px-6 pt-10">
          <LoadingState label="Loading notes..." />
        </View>
      ) : isError ? (
        <View className="px-6 pt-10">
          <ErrorState message="Couldn't load notes." onRetry={refetch} />
        </View>
      ) : !data || data.length === 0 ? (
        <View className="px-6 pt-10">
          <EmptyState
            icon="document-text-outline"
            title={bookmarkedOnly ? "No bookmarked notes yet" : "No notes found"}
            subtitle={
              bookmarkedOnly
                ? "Bookmark a note to find it here quickly."
                : search || category !== "All"
                  ? "Try a different category or search term."
                  : academicEmptyText(academic, "learning material")
            }
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 24, paddingTop: 8 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => navigation.navigate("NoteDetail", { noteId: item.id })}
              onToggleBookmark={() =>
                toggleBookmark.mutate({ noteId: item.id, isBookmarked: item.isBookmarked })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

function NoteCard({
  note,
  onPress,
  onToggleBookmark,
}: {
  note: PrepNote;
  onPress: () => void;
  onToggleBookmark: () => void;
}) {
  return (
    <PressableScale onPress={onPress} className="bg-white border border-gray-100 rounded-2xl p-4 mb-3" style={CARD_SHADOW}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center mb-1" style={{ gap: 6 }}>
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
          <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={2}>
            {note.title}
          </Text>
          {note.topic ? <Text className="text-gray-400 text-xs mt-0.5">{note.topic}</Text> : null}
        </View>
        <Pressable onPress={onToggleBookmark} hitSlop={10}>
          <Ionicons
            name={note.isBookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            color={note.isBookmarked ? "#4F39F6" : "#9CA3AF"}
          />
        </Pressable>
      </View>
      {note.tags.length > 0 ? (
        <View className="flex-row flex-wrap mt-2" style={{ gap: 6 }}>
          {note.tags.slice(0, 4).map((tag) => (
            <Text key={tag} className="text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
              #{tag}
            </Text>
          ))}
        </View>
      ) : null}
    </PressableScale>
  );
}

export default NotesListScreen;
