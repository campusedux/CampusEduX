import React from "react";
import { Text, View } from "react-native";
import { TermLabel } from "./InfoTooltip";
import { TERMS } from "./builderCopy";
import { rupees } from "./format";
import type { CustomProjectEstimate } from "@/types";

function Row({ label, value, bold }: { label: React.ReactNode; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <View className="flex-1 pr-3">{label}</View>
      <Text className={bold ? "text-gray-900 font-bold text-lg" : "text-gray-900 font-medium"}>{value}</Text>
    </View>
  );
}

/** Receipt-style breakdown. Every figure comes from calculateEstimate. */
export function PriceBreakdown({ estimate, levelLabel }: { estimate: CustomProjectEstimate; levelLabel: string }) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4 mb-4">
      <Text className="font-bold text-gray-900 mb-1">Price breakdown</Text>
      <Row label={<TermLabel term={{ ...TERMS.basePrice, label: `Base price (${levelLabel})` }} />} value={rupees(estimate.basePrice)} />
      <Row
        label={<TermLabel term={{ ...TERMS.included, label: `Included features (${estimate.includedFeatures.length})` }} />}
        value="Free"
      />
      <Row
        label={<TermLabel term={{ ...TERMS.addOn, label: `Add-ons (${estimate.addOns.length})` }} />}
        value={estimate.addOns.length > 0 ? `+${rupees(estimate.addOnsTotal)}` : rupees(0)}
      />
      <Row label={<TermLabel term={TERMS.platform} />} value={rupees(estimate.platformCharges)} />
      <View className="border-t border-gray-200 mt-1.5 pt-1.5">
        <Row label={<TermLabel term={TERMS.estimate} className="text-gray-900 font-bold" />} value={rupees(estimate.total)} bold />
      </View>
    </View>
  );
}
