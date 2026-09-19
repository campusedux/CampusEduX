import React, { useState } from "react";
import { View, TextInput, Pressable, Text, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MIN_TOUCH, withAlpha } from "@/constants/theme";

interface SearchBarProps extends Omit<TextInputProps, "style"> {
  /** Called by the clear (x) button; the clear button shows only while `value` is non-empty. */
  onClear?: () => void;
  /** Shows a filter button at the trailing edge. */
  onFilterPress?: () => void;
  /** Dot on the filter button when filters are applied. */
  filterActive?: boolean;
  /** Turns the bar into a tap target (no typing) that opens a search screen. */
  onPress?: () => void;
}

/** Rounded search field: icon, clear button, optional filter button. 48px tall. */
export function SearchBar({ value, onClear, onFilterPress, filterActive, onPress, placeholder = "Search", onFocus, onBlur, ...rest }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const box = {
    flex: 1,
    height: 48,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: focused ? COLORS.primary : COLORS.border,
    backgroundColor: focused ? COLORS.white : COLORS.surface,
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="search" accessibilityLabel={placeholder} style={box}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 10 }} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 15, color: COLORS.textMuted }}>
            {placeholder}
          </Text>
        </Pressable>
      ) : (
        <View style={box}>
          <Ionicons name="search" size={20} color={focused ? COLORS.primary : COLORS.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            value={value}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textDisabled}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 0 }}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {value && onClear ? (
            <Pressable onPress={onClear} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={COLORS.textDisabled} />
            </Pressable>
          ) : null}
        </View>
      )}
      {onFilterPress ? (
        <Pressable
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          style={{
            width: 48,
            height: 48,
            minWidth: MIN_TOUCH,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: filterActive ? COLORS.primary : withAlpha(COLORS.primary, 0.08),
          }}
        >
          <Ionicons name="options-outline" size={22} color={filterActive ? "#FFFFFF" : COLORS.primary} />
          {filterActive ? (
            <View style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "#F59E0B", borderWidth: 1, borderColor: "#fff" }} />
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}
