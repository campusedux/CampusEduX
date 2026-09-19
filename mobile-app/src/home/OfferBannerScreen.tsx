import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, Card, IconTile, Badge, SkeletonList, ErrorState, EmptyState } from "@/components/ui";
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
      <ScreenHeader title="Special Offers" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <SkeletonList count={3} hero />
      ) : isError ? (
        <ErrorState message="Couldn't load offers." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon="pricetag-outline" accent="orange" title="No active offers right now" subtitle="Check back soon for new deals." />
      ) : (
        <FlatList
          data={data.slice(1)}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            // Hero text is the first REAL active offer — nothing here is hard-coded marketing copy.
            <View style={{ marginBottom: 20 }}>
              <Card variant="gradient" accent="orange" padding={20}>
                <View className="flex-row items-center mb-1">
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-1.5 flex-1" numberOfLines={2}>
                    {data[0].title}
                  </Text>
                </View>
                {data[0].description ? <Text className="text-white/90 text-sm mb-4">{data[0].description}</Text> : <View className="mb-3" />}
                <View className="flex-row items-center" style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => copyCode(data[0].couponCode)}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy coupon code ${data[0].couponCode}`}
                    className="flex-row items-center bg-white rounded-lg px-4"
                    style={{ minHeight: 44 }}
                  >
                    <Text className="text-orange-700 font-semibold text-sm">Use Code: {data[0].couponCode}</Text>
                    <Ionicons name="copy-outline" size={14} color="#C2410C" style={{ marginLeft: 6 }} />
                  </Pressable>
                  {data[0].discountLabel ? <Badge label={data[0].discountLabel} tone="orange" variant="solid" /> : null}
                </View>
              </Card>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12 }}>
              <Card padding={14}>
                <View className="flex-row items-center">
                  <View className="mr-3">
                    <IconTile icon="pricetag" accent="orange" variant="soft" size={44} />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="font-bold text-gray-900">{item.title}</Text>
                    <Text className="text-gray-600 text-sm mt-0.5">{item.description}</Text>
                    <Pressable
                      onPress={() => copyCode(item.couponCode)}
                      accessibilityRole="button"
                      accessibilityLabel={`Copy coupon code ${item.couponCode}`}
                      className="flex-row items-center self-start"
                      style={{ minHeight: 44 }}
                    >
                      <Text className="text-primary text-xs font-semibold">Use Code: {item.couponCode}</Text>
                      <Ionicons name="copy-outline" size={12} color="#4F39F6" style={{ marginLeft: 4 }} />
                    </Pressable>
                  </View>
                  <Badge label={item.discountLabel} tone="orange" />
                </View>
              </Card>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

export default OfferBannerScreen;
