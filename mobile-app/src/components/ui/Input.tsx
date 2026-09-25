import React, { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, withAlpha } from "@/constants/theme";

interface InputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
  /** Optional field label rendered above the input. */
  label?: string;
  /** Optional hint rendered under the input (hidden while an error shows). */
  helperText?: string;
}

/**
 * Standard bordered input with a leading icon, matching the auth screens
 * (Email/Mobile, Password, Full Name, etc.). Handles password visibility
 * toggling internally when isPassword is set. Shows a brand focus ring and a
 * tinted error state.
 */
export function Input({ icon, error, isPassword, label, helperText, className, onFocus, onBlur, ...rest }: InputProps) {
  const [secure, setSecure] = useState(!!isPassword);
  const [focused, setFocused] = useState(false);

  const borderColor = error ? COLORS.danger : focused ? COLORS.primary : COLORS.border;
  const ringColor = error ? withAlpha(COLORS.danger, 0.12) : focused ? withAlpha(COLORS.primary, 0.14) : "transparent";
  const iconColor = error ? COLORS.danger : focused ? COLORS.primary : COLORS.textDisabled;

  return (
    <View className="mb-4">
      {label ? <Text className="text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</Text> : null}
      {/* 3px translucent halo = focus ring without shifting layout */}
      <View style={{ borderRadius: 15, borderWidth: 3, borderColor: ringColor }}>
        <View
          className="flex-row items-center rounded-xl border px-4 bg-white"
          style={{ height: 52, borderColor, backgroundColor: error ? "#FFFBFB" : "#FFFFFF" }}
        >
          {icon && <Ionicons name={icon} size={20} color={iconColor} style={{ marginRight: 10 }} />}
          <TextInput
            className={`flex-1 text-base text-gray-900 ${className ?? ""}`}
            placeholderTextColor={COLORS.textDisabled}
            secureTextEntry={secure}
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
          {isPassword && (
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.textMuted}
              onPress={() => setSecure((s) => !s)}
            />
          )}
        </View>
      </View>
      {error ? (
        <Text className="text-danger text-xs mt-1 ml-1">{error}</Text>
      ) : helperText ? (
        <Text className="text-gray-500 text-xs mt-1 ml-1">{helperText}</Text>
      ) : null}
    </View>
  );
}
