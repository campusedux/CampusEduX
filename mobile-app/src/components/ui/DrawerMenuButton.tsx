import React from "react";
import { Pressable } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

interface DrawerMenuButtonProps {
  color?: string;
  size?: number;
  className?: string;
}

/**
 * Hamburger that opens the app side drawer (see DrawerContent). Sits in the
 * header of every bottom-tab dashboard. Dispatching DrawerActions.openDrawer()
 * lets the action bubble up from a deeply nested stack screen to the Drawer
 * navigator, so callers don't need to know how many parents up it sits.
 */
export function DrawerMenuButton({ color = "#111827", size = 26, className }: DrawerMenuButtonProps) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      className={className}
    >
      <Ionicons name="menu" size={size} color={color} />
    </Pressable>
  );
}

export default DrawerMenuButton;
