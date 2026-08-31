import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { rupees } from "./components/wizard";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "SubmitSuccess">;
type Rte = RouteProp<CustomProjectsStackParamList, "SubmitSuccess">;

export function SubmitSuccessScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rte>();

  const openDetail = () =>
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: "MyCustomProjects" },
          { name: "CustomProjectDetail", params: { requestId: params.requestId } },
        ],
      })
    );

  const openList = () =>
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "MyCustomProjects" }] }));

  return (
    <Screen className="px-6 items-center justify-center">
      <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#DCFCE7" }}>
        <Ionicons name="checkmark" size={40} color="#16A34A" />
      </View>

      <Text className="text-2xl font-bold text-gray-900 mt-5">Payment Successful</Text>
      <Text className="text-lg font-semibold text-primary mt-1">{rupees(params.tokenAmount)} Token Paid</Text>

      <View className="w-full rounded-2xl border border-gray-100 p-4 mt-6">
        <View className="flex-row justify-between py-1.5">
          <Text className="text-gray-500">Project</Text>
          <Text className="text-gray-900 font-medium" numberOfLines={1}>
            {params.title}
          </Text>
        </View>
        <View className="flex-row justify-between py-1.5">
          <Text className="text-gray-500">Request ID</Text>
          <Text className="text-gray-900 font-mono">{params.requestCode}</Text>
        </View>
        <View className="flex-row justify-between py-1.5">
          <Text className="text-gray-500">Status</Text>
          <Text className="text-green-700 font-semibold">Request Created</Text>
        </View>
      </View>

      <Text className="text-gray-400 text-sm text-center mt-4">
        Our team has been notified and will start the project work. You will get updates as it moves
        through development, testing and delivery.
      </Text>

      <View className="w-full mt-8">
        <Button label="View Project Request" onPress={openDetail} />
        <Button label="Back to My Custom Projects" variant="text" onPress={openList} className="mt-1" />
      </View>
    </Screen>
  );
}

export default SubmitSuccessScreen;
