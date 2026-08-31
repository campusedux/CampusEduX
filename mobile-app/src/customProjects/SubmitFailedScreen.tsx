import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "SubmitFailed">;
type Rte = RouteProp<CustomProjectsStackParamList, "SubmitFailed">;

export function SubmitFailedScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();

  return (
    <Screen className="px-6 items-center justify-center">
      <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
        <Ionicons name="close" size={40} color="#DC2626" />
      </View>

      <Text className="text-2xl font-bold text-gray-900 mt-5">Payment not completed</Text>
      <Text className="text-gray-500 text-center mt-2">
        {params?.message ?? "Your payment could not be verified."}
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-3">
        Nothing was charged and no request was created. Your project configuration has been kept —
        you can try again.
      </Text>

      <View className="w-full mt-8">
        <Button
          label="Back to payment"
          onPress={() => navigation.navigate("BuilderPayment")}
        />
        <Button
          label="Save as draft & exit"
          variant="text"
          onPress={() => navigation.navigate("BuilderStart")}
          className="mt-1"
        />
      </View>
    </Screen>
  );
}

export default SubmitFailedScreen;
