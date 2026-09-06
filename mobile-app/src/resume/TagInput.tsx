import React, { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/** Chip input — type a value, press return or + to add; ✕ removes. */
export function TagInput({ tags, onChange, placeholder = "Add and press return" }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");

  const add = () => {
    const v = text.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setText("");
  };

  return (
    <View>
      {tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {tags.map((tag) => (
            <View key={tag} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 8, paddingLeft: 10, paddingRight: 4, height: 30 }}>
              <Text style={{ fontSize: 13, color: "#374151" }}>{tag}</Text>
              <Pressable onPress={() => onChange(tags.filter((t) => t !== tag))} hitSlop={6} style={{ padding: 4 }}>
                <Ionicons name="close" size={13} color="#6B7280" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          blurOnSubmit={false}
          returnKeyType="done"
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={{ flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, height: 42, color: "#111827" }}
        />
        <Pressable onPress={add} style={{ width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="add" size={18} color="#4F39F6" />
        </Pressable>
      </View>
    </View>
  );
}

export default TagInput;
