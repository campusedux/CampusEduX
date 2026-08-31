import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { notify } from "@/lib/notify";
import { customProjectsService } from "@/services/customProjects.service";
import { useAuthStore } from "@/store/authStore";
import { useBuilderStore } from "./builderStore";
import { WizardScreen } from "./components/wizard";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderUploads">;

const MAX_FILE_MB = 15;
const DOC_TYPES = [
  "image/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
];

export function BuilderUploadsScreen() {
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.user?.id);
  const config = useBuilderStore((s) => s.config);
  const patch = useBuilderStore((s) => s.patch);
  const addReferenceFile = useBuilderStore((s) => s.addReferenceFile);
  const removeReferenceFile = useBuilderStore((s) => s.removeReferenceFile);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState(false);

  const pickImage = async () => {
    if (!userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify("Permission needed", "Allow photo access to attach a project image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setImageBusy(true);
    try {
      const path = await customProjectsService.uploadProjectImage(userId, asset.uri);
      patch({ projectImagePath: path });
      setImagePreview(asset.uri);
    } catch (e: any) {
      notify("Upload failed", e?.message ?? "Could not upload the image.");
    } finally {
      setImageBusy(false);
    }
  };

  const pickFiles = async () => {
    if (!userId) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: DOC_TYPES,
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.length) return;
    setFileBusy(true);
    try {
      for (const asset of result.assets) {
        const sizeMb = (asset.size ?? 0) / (1024 * 1024);
        if (sizeMb > MAX_FILE_MB) {
          notify("File too large", `"${asset.name}" is over ${MAX_FILE_MB} MB.`);
          continue;
        }
        if (config.referenceFiles.some((f) => f.name === asset.name)) continue;
        const uploaded = await customProjectsService.uploadReferenceFile(
          userId,
          asset.uri,
          asset.name,
          asset.mimeType ?? undefined
        );
        addReferenceFile(uploaded);
      }
    } catch (e: any) {
      notify("Upload failed", e?.message ?? "Could not upload a file.");
    } finally {
      setFileBusy(false);
    }
  };

  return (
    <WizardScreen
      step={6}
      title="Uploads"
      subtitle="Optional. Add a project image and any reference files."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderEstimate")}
    >
      <Text className="text-gray-700 font-medium mb-2">Project image</Text>
      {config.projectImagePath ? (
        <View className="rounded-2xl overflow-hidden border border-gray-100 mb-2">
          {imagePreview ? (
            <Image source={{ uri: imagePreview }} style={{ width: "100%", height: 170 }} contentFit="cover" />
          ) : (
            <View className="items-center justify-center bg-gray-50" style={{ height: 170 }}>
              <Ionicons name="image" size={28} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm mt-1">Image attached</Text>
            </View>
          )}
          <Pressable
            onPress={() => {
              patch({ projectImagePath: null });
              setImagePreview(null);
            }}
            className="flex-row items-center justify-center py-2.5"
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text className="text-danger ml-1.5 font-medium">Remove</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pickImage}
          className="rounded-2xl border border-dashed border-gray-300 items-center justify-center mb-2"
          style={{ height: 130 }}
        >
          {imageBusy ? (
            <ActivityIndicator color="#4F39F6" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={26} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">Upload JPG, PNG or WEBP</Text>
            </>
          )}
        </Pressable>
      )}

      <Text className="text-gray-700 font-medium mt-5 mb-2">Reference files</Text>
      {config.referenceFiles.map((f) => (
        <View key={f.path} className="flex-row items-center rounded-xl border border-gray-100 px-3 py-3 mb-2">
          <Ionicons name="document-attach-outline" size={18} color="#6B7280" />
          <View className="flex-1 ml-2.5">
            <Text className="text-gray-800" numberOfLines={1}>
              {f.name}
            </Text>
            <Text className="text-gray-400 text-xs">{f.sizeMb.toFixed(2)} MB</Text>
          </View>
          <Pressable onPress={() => removeReferenceFile(f.path)} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#D1D5DB" />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={pickFiles}
        className="flex-row items-center justify-center rounded-xl border border-dashed border-gray-300 py-3.5"
      >
        {fileBusy ? (
          <ActivityIndicator color="#4F39F6" />
        ) : (
          <>
            <Ionicons name="add" size={18} color="#4F39F6" />
            <Text className="text-primary font-medium ml-1.5">Add files (PDF, DOC, ZIP, images)</Text>
          </>
        )}
      </Pressable>
    </WizardScreen>
  );
}

export default BuilderUploadsScreen;
