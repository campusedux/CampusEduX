import React, { useState } from "react";
import { View, Text, Pressable, FlatList, TextInput } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, RatingStars, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { useReviews, useAddReview } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Rte = RouteProp<ProjectStackParamList, "Reviews">;

export function ReviewsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data, isLoading, isError, refetch } = useReviews(params.projectId);
  const addReview = useAddReview(params.projectId);

  const [showForm, setShowForm] = useState(false);
  const [draftRating, setDraftRating] = useState(5);
  const [draftComment, setDraftComment] = useState("");

  const submitReview = async () => {
    if (draftComment.trim().length < 5) {
      notify("Add a few more details", "Please write at least a short sentence about your experience.");
      return;
    }
    try {
      await addReview.mutateAsync({ rating: draftRating, comment: draftComment.trim() });
      setDraftComment("");
      setDraftRating(5);
      setShowForm(false);
    } catch (error: any) {
      notify("Couldn't submit review", error.message ?? "Please try again.");
    }
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
          Reviews
        </Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading reviews..." />
      ) : isError || !data ? (
        <ErrorState message="Couldn't load reviews." onRetry={refetch} />
      ) : (
        <>
          <View className="flex-row items-center bg-gray-50 rounded-2xl p-4 mb-4">
            <Text className="text-4xl font-bold text-gray-900 mr-4">{data.breakdown.average.toFixed(1)}</Text>
            <View className="flex-1">
              <RatingStars rating={data.breakdown.average} />
              <Text className="text-gray-400 text-xs mt-1">{data.breakdown.totalReviews} Reviews</Text>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = data.breakdown.counts[star as 1 | 2 | 3 | 4 | 5];
                const pct = data.breakdown.totalReviews ? (count / data.breakdown.totalReviews) * 100 : 0;
                return (
                  <View key={star} className="flex-row items-center mt-1">
                    <Text className="text-gray-400 text-xs w-3">{star}</Text>
                    <View className="flex-1 h-1.5 bg-gray-200 rounded-full mx-2">
                      <View className="h-1.5 bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {showForm ? (
            <View className="border border-gray-200 rounded-2xl p-4 mb-4">
              <Text className="font-semibold text-gray-900 mb-2">Your Rating</Text>
              <RatingStars rating={draftRating} size={26} onChange={setDraftRating} />
              <TextInput
                className="border border-gray-200 rounded-xl px-3 py-3 mt-3 text-gray-900"
                placeholder="Share your experience with this project..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={draftComment}
                onChangeText={setDraftComment}
                style={{ height: 90, textAlignVertical: "top" }}
              />
              <Button label="Submit Review" loading={addReview.isPending} onPress={submitReview} className="mt-3" />
            </View>
          ) : (
            <Button label="Write a Review" variant="outline" onPress={() => setShowForm(true)} className="mb-4" />
          )}

          {data.reviews.length === 0 ? (
            <EmptyState title="No reviews yet" subtitle="Be the first to review this project." />
          ) : (
            <FlatList
              data={data.reviews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="border-b border-gray-100 py-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="font-semibold text-gray-900">{item.userName}</Text>
                    <Text className="text-gray-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <RatingStars rating={item.rating} size={13} />
                  <Text className="text-gray-600 text-sm mt-1.5">{item.comment}</Text>
                </View>
              )}
            />
          )}
        </>
      )}
    </Screen>
  );
}

export default ReviewsScreen;
