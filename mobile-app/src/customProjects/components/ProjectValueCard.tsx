import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CustomProjectAddon, CustomProjectAmounts, CustomPaymentStatus } from "@/types";
import { money } from "./format";

const STATUS_LABEL: Record<CustomPaymentStatus, string> = {
  paid: "Paid",
  partially_paid: "Partially paid",
  unpaid: "Unpaid",
};

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={strong ? "font-bold text-gray-900 flex-1 pr-3" : "text-gray-500 flex-1 pr-3"} numberOfLines={2}>
        {k}
      </Text>
      <Text className={strong ? "font-bold text-gray-900" : "text-gray-900"}>{v}</Text>
    </View>
  );
}

/**
 * Base value + accepted add-ons = total, − paid (− credits) = due. Every number comes from
 * custom_project_amounts() (migration 0128); once fully paid the due line is replaced by "Paid".
 */
export function ProjectValueCard({
  amounts,
  acceptedAddons,
  estimatedTotal,
}: {
  amounts: CustomProjectAmounts;
  acceptedAddons: CustomProjectAddon[];
  estimatedTotal: number;
}) {
  const paid = amounts.paymentStatus === "paid";
  return (
    <View className="rounded-2xl border border-gray-100 p-4">
      <Line k="Base project value" v={money(amounts.baseValue)} />
      {amounts.baseValue !== estimatedTotal ? (
        <Text className="text-gray-400 text-xs mb-1">Adjusted from the {money(estimatedTotal)} estimate after review.</Text>
      ) : null}
      {acceptedAddons.map((a) => (
        <Line key={a.id} k={`+ ${a.title}`} v={money(a.price ?? 0)} />
      ))}
      <View className="border-t border-gray-100 mt-1 pt-1">
        <Line k="Total project value" v={money(amounts.projectValue)} strong />
      </View>
      <Line k="Paid" v={`− ${money(amounts.paymentsTotal)}`} />
      {amounts.creditsTotal > 0 ? <Line k="Credits" v={`− ${money(amounts.creditsTotal)}`} /> : null}
      {paid ? (
        <View className="flex-row items-center justify-between rounded-xl px-3 py-2 mt-2" style={{ backgroundColor: "#DCFCE7" }}>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={16} color="#166534" />
            <Text className="font-bold ml-1.5" style={{ color: "#166534" }}>
              Payment status
            </Text>
          </View>
          <Text className="font-bold" style={{ color: "#166534" }}>
            {STATUS_LABEL.paid}
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-between rounded-xl px-3 py-2 mt-2" style={{ backgroundColor: "#FEF3C7" }}>
          <Text className="font-bold" style={{ color: "#92400E" }}>
            Due · {STATUS_LABEL[amounts.paymentStatus]}
          </Text>
          <Text className="font-bold" style={{ color: "#92400E" }}>
            {money(amounts.due)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default ProjectValueCard;
