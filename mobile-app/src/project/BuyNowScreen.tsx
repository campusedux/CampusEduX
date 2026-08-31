import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useProjectDetail } from "@/hooks/useProjects";
import type { ProjectStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProjectStackParamList, "BuyNow">;
type Rte = RouteProp<ProjectStackParamList, "BuyNow">;

const INCLUDES = ["Source Code", "Documentation", "Lifetime Support", "Regular Updates"];

export function BuyNowScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();
  const { data: project, isLoading, isError, refetch } = useProjectDetail(params.projectId);

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Loading..." /></Screen>;
  if (isError || !project) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load project." onRetry={refetch} /></Screen>;

  const platformFee = Math.round((project.price * project.platformFeePercent) / 100);
  const discount = 0;
  const total = project.price + platformFee - discount;

  return (
    <Screen className="px-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Buy Project</Text>
      </View>

      <View className="flex-row items-center border border-gray-100 rounded-2xl p-3 mb-6">
        <View className="w-14 h-14 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name="cube-outline" size={26} color="#4F39F6" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>{project.title}</Text>
          <Text className="text-gray-400 text-sm">{project.categoryName}</Text>
        </View>
        <Text className="font-bold text-gray-900">₹{project.price}</Text>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Price Details</Text>
      <View className="mb-2 flex-row justify-between">
        <Text className="text-gray-500">Price</Text>
        <Text className="text-gray-900">₹{project.price}</Text>
      </View>
      <View className="mb-2 flex-row justify-between">
        <Text className="text-gray-500">Platform Fee</Text>
        <Text className="text-gray-900">₹{platformFee}</Text>
      </View>
      <View className="mb-2 flex-row justify-between">
        <Text className="text-gray-500">Discount</Text>
        <Text className="text-gray-900">-₹{discount}</Text>
      </View>
      <View className="mb-4 flex-row justify-between border-t border-gray-100 pt-3">
        <Text className="font-bold text-gray-900">Total Amount</Text>
        <Text className="font-bold text-primary text-lg">₹{total}</Text>
      </View>

      <Text className="font-bold text-gray-900 mb-3">You will get</Text>
      {INCLUDES.map((item) => (
        <View key={item} className="flex-row items-center mb-2">
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text className="text-gray-600 ml-2">{item}</Text>
        </View>
      ))}

      <View className="flex-1" />
      <Button label={`Proceed to Payment`} onPress={() => (navigation as any).navigate("Payment", { projectId: project.id })} className="mb-6" />
    </Screen>
  );
}

export default BuyNowScreen;
