import React, { useState } from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
}

/**
 * Standard bordered input with a leading icon, matching the auth screens
 * (Email/Mobile, Password, Full Name, etc.). Handles password visibility
 * toggling internally when isPassword is set.
 */
export function Input({ icon, error, isPassword, className, ...rest }: InputProps) {
  const [secure, setSecure] = useState(!!isPassword);

  return (
    <View className="mb-4">
      <View
        className={`flex-row items-center rounded-xl border px-4 ${
          error ? "border-danger" : "border-gray-200"
        } bg-white`}
        style={{ height: 52 }}
      >
        {icon && <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 10 }} />}
        <TextInput
          className={`flex-1 text-base text-gray-900 ${className ?? ""}`}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secure}
          {...rest}
        />
        {isPassword && (
          <Ionicons
            name={secure ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#9CA3AF"
            onPress={() => setSecure((s) => !s)}
          />
        )}
      </View>
      {error ? <Text className="text-danger text-xs mt-1 ml-1">{error}</Text> : null}
    </View>
  );
}
