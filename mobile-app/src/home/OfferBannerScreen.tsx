import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Screen, LoadingState, ErrorState, EmptyState } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useOfferBanners } from "@/hooks/useHomeData";
import type { HomeStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<HomeStackParamList, "OfferBanner">;

export function OfferBannerScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = useOfferBanners();

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    notify("Copied", `Coupon code "${code}" copied to clipboard.`);
  };

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Special Offers</Text>
      </View>

      {isLoading ? (
        <LoadingState label="Loading offers..." />
      ) : isError ? (
        <ErrorState message="Couldn't load offers." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="pricetag-outline" title="No active offers right now" subtitle="Check back soon for new deals." />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="rounded-2xl p-5 mb-5" style={{ backgroundColor: "#F97316" }}>
              <View className="flex-row items-center mb-1">
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text className="text-white font-bold text-base ml-1.5">Limited Time Offer</Text>
              </View>
              <Text className="text-white/90 text-sm mb-4">Up to 50% OFF on Premium Projects</Text>
              <View className="self-start bg-white rounded-lg px-4 py-2">
                <Text className="text-orange-600 font-semibold text-sm">Shop Now</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center bg-white rounded-2xl border border-gray-100 p-4 mb-3">
              <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#FFF1E6" }}>
                <Ionicons name="pricetag" size={18} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900">{item.title}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">{item.description}</Text>
                <Pressable onPress={() => copyCode(item.couponCode)} className="flex-row items-center mt-1">
                  <Text className="text-primary text-xs font-semibold">Use Code: {item.couponCode}</Text>
                  <Ionicons name="copy-outline" size={12} color="#4F39F6" style={{ marginLeft: 4 }} />
                </Pressable>
              </View>
              <View className="rounded-xl px-3 py-2" style={{ backgroundColor: "#FFF1E6" }}>
                <Text className="text-orange-600 font-bold">{item.discountLabel}</Text>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default OfferBannerScreen;
