import React from "react";
import { Pressable, Text, View } from "react-native";
import { getLegalDocument } from "@/legal/content";
import { fillTokens } from "@/legal/interpolate";

/** The existing refund policy's "Custom Project tokens" section — quoted verbatim, never re-worded. */
export function tokenRefundText(): string {
  const section = getLegalDocument("refund-policy").sections.find((s) => /custom project tokens/i.test(s.heading));
  return (section?.body ?? []).map(fillTokens).join(" ");
}

export function TokenRefundSummary({ onReadFullPolicy }: { onReadFullPolicy: () => void }) {
  const text = tokenRefundText();
  return (
    <View className="mt-3 rounded-xl px-3 py-3" style={{ backgroundColor: "#F9FAFB" }}>
      <Text className="text-gray-800 font-semibold text-sm">Token refunds</Text>
      {text ? <Text className="text-gray-600 text-sm mt-1">{text}</Text> : null}
      <Pressable
        onPress={onReadFullPolicy}
        accessibilityRole="link"
        accessibilityLabel="Read the full refund policy"
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Text className="text-primary font-semibold text-sm">Read the full refund policy</Text>
      </Pressable>
    </View>
  );
}
