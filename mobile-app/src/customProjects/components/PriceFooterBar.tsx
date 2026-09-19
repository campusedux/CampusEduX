import React from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui";
import { rupees } from "./format";
import type { CustomProjectEstimate } from "@/types";

interface PriceFooterBarProps {
  /** Omit on steps that show no live price (Type, Payment). */
  estimate?: CustomProjectEstimate;
  loading?: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  submitting?: boolean;
  /** Why the button is disabled — shown as text, not only greyed out. */
  disabledReason?: string;
}

/** "Base ₹7,999 + Add-ons ₹125 = ₹8,124" — same numbers as the estimate page. */
export function priceLine(e: CustomProjectEstimate): string {
  const parts = [`Base ${rupees(e.basePrice)}`];
  if (e.addOnsTotal > 0 || e.addOns.length > 0) parts.push(`Add-ons ${rupees(e.addOnsTotal)}`);
  if (e.platformCharges > 0) parts.push(`Platform ${rupees(e.platformCharges)}`);
  return parts.length > 1 ? `${parts.join(" + ")} = ${rupees(e.total)}` : "";
}

/** Sticky bottom bar: live price on the left, the primary action (named for what comes next) on the right. */
export function PriceFooterBar({ estimate, loading, label, onPress, disabled, submitting, disabledReason }: PriceFooterBarProps) {
  return (
    <View className="border-t border-gray-100 bg-white px-4 pt-3 pb-4">
      {disabled && disabledReason ? (
        <Text className="text-xs mb-2" style={{ color: "#B45309" }} accessibilityLiveRegion="polite">
          {disabledReason}
        </Text>
      ) : null}
      <View className="flex-row items-center">
        {estimate ? (
          <View className="flex-1 pr-3">
            <Text className="text-gray-500 text-xs">Estimated project price</Text>
            <Text className="text-gray-900 text-xl font-bold" accessibilityLabel={`Estimated ${rupees(estimate.total)}`}>
              {loading ? "…" : rupees(estimate.total)}
            </Text>
            {!loading && priceLine(estimate) ? (
              <Text className="text-gray-500 text-xs" numberOfLines={2}>
                {priceLine(estimate)}
              </Text>
            ) : null}
          </View>
        ) : (
          <View className="flex-1" />
        )}
        <Button label={label} onPress={onPress} disabled={disabled} loading={submitting} size="md" />
      </View>
    </View>
  );
}
