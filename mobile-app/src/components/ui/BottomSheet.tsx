import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, MIN_TOUCH } from "@/constants/theme";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Wrap the content in a ScrollView (for long forms / option lists). */
  scroll?: boolean;
  children?: React.ReactNode;
}

/**
 * Styling-only sheet on top of RN `Modal`: dimmed backdrop (tap to dismiss),
 * rounded top, drag-handle, title row with a 44px close button. Slides up and
 * fades with the built-in Animated API; Android back closes it.
 */
export function BottomSheet({ visible, onClose, title, scroll, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  const body = scroll ? (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(15,23,42,0.5)", opacity: progress }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={{
            maxHeight: height * 0.85,
            backgroundColor: COLORS.white,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.5, 0] }) }],
          }}
        >
          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", marginBottom: 10 }} />
          {title ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text accessibilityRole="header" numberOfLines={2} style={{ flex: 1, fontSize: 18, lineHeight: 24, fontWeight: "700", color: COLORS.textPrimary }}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </Pressable>
            </View>
          ) : null}
          {body}
        </Animated.View>
      </View>
    </Modal>
  );
}
