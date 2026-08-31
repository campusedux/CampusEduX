import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import type { ProjectStackParamList } from "@/types";

type Rte = RouteProp<ProjectStackParamList, "PaymentSuccess">;

export function PaymentSuccessScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => paymentService.getOrder(params.orderId),
  });

  if (isLoading) return <Screen className="items-center justify-center"><LoadingState label="Confirming payment..." /></Screen>;
  if (isError || !order) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load order details." onRetry={refetch} /></Screen>;

  return (
    <Screen className="px-6 items-center justify-center">
      <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: "#DCFCE7" }}>
        <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</Text>
      <Text className="text-gray-500 text-center mb-6">Your payment has been completed successfully.</Text>

      <View className="w-full border border-gray-100 rounded-2xl p-4 mb-8">
        <Row label="Order ID" value={`#${order.id.slice(0, 8).toUpperCase()}`} />
        <Row label="Amount" value={`₹${order.totalAmount}`} />
        <Row label="Date" value={new Date(order.createdAt).toLocaleString()} last />
      </View>

      <Button
        label="View My Orders"
        className="w-full mb-3"
        onPress={() =>
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "MyPurchasedProjects" }] }))
        }
      />
      <Button
        label="Continue Shopping"
        variant="text"
        onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "AllProjects" }] }))}
      />
    </Screen>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row justify-between ${last ? "" : "mb-2"}`}>
      <Text className="text-gray-500">{label}</Text>
      <Text className="text-gray-900 font-medium">{value}</Text>
    </View>
  );
}

export default PaymentSuccessScreen;
