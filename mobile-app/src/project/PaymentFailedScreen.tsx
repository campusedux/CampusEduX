import React from "react";
import { View, Text } from "react-native";
import { useNavigation, useRoute, RouteProp, CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, LoadingState, ErrorState } from "@/components/ui";
import { useQuery } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import type { ProjectStackParamList } from "@/types";

type Rte = RouteProp<ProjectStackParamList, "PaymentFailed">;

export function PaymentFailedScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ["order", params.orderId],
    queryFn: () => paymentService.getOrder(params.orderId),
  });

  return (
    <Screen className="px-6 items-center justify-center">
      <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: "#FEE2E2" }}>
        <Ionicons name="close-circle" size={64} color="#DC2626" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-1">Payment Failed!</Text>
      <Text className="text-gray-500 text-center mb-6">We couldn&apos;t complete your payment. Please try again.</Text>

      {isLoading ? (
        <LoadingState label="Loading order details..." />
      ) : isError || !order ? (
        <ErrorState message="Couldn't load order details." onRetry={refetch} />
      ) : (
        <View className="w-full border border-gray-100 rounded-2xl p-4 mb-8">
          <Row label="Order ID" value={`#${order.id.slice(0, 8).toUpperCase()}`} />
          <Row label="Reason" value={order.failureReason ?? "Payment could not be processed"} />
          <Row label="Amount" value={`₹${order.totalAmount}`} last />
        </View>
      )}

      <Button
        label="Try Again"
        className="w-full mb-3"
        onPress={() =>
          order
            ? navigation.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: "Payment", params: { projectId: order.projectId } }] })
              )
            : navigation.goBack()
        }
      />
      <Button
        label="Back to Home"
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
      <Text className="text-gray-900 font-medium" numberOfLines={1}>{value}</Text>
    </View>
  );
}

export default PaymentFailedScreen;
