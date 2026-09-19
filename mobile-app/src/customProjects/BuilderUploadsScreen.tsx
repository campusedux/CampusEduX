import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { customProjectsService } from "@/services/customProjects.service";
import { useAuthStore } from "@/store/authStore";
import { useBuilderStore } from "./builderStore";
import { WizardScreen, SectionCard } from "./components/wizard";
import type { CustomProjectsStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<CustomProjectsStackParamList, "BuilderUploads">;

const MAX_FILE_MB = 15;
const MAX_FILES = 20; // create-custom-project-order keeps at most 20 reference files
const DOC_TYPES = [
  "image/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
];

interface Uploading {
  key: string;
  name: string;
}

export function BuilderUploadsScreen() {
  const navigation = useNavigation<Nav>();
  const userId = useAuthStore((s) => s.user?.id);
  const config = useBuilderStore((s) => s.config);
  const previews = useBuilderStore((s) => s.previews);
  const patch = useBuilderStore((s) => s.patch);
  const setPreview = useBuilderStore((s) => s.setPreview);
  const addReferenceFile = useBuilderStore((s) => s.addReferenceFile);
  const removeReferenceFile = useBuilderStore((s) => s.removeReferenceFile);

  const [imageBusy, setImageBusy] = useState(false);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const pushError = (msg: string) => setErrors((prev) => [...prev, msg]);
  const imageUri = config.projectImagePath ? previews[config.projectImagePath] : undefined;
  const fileCount = config.referenceFiles.length;

  const pickImage = async () => {
    if (!userId) return;
    setErrors([]);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      pushError("Allow photo access in your device settings to attach a project image.");
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
      setPreview(path, asset.uri);
    } catch (e) {
      pushError(`Image upload failed: ${e instanceof Error ? e.message : "please try again."}`);
    } finally {
      setImageBusy(false);
    }
  };

  const pickFiles = async () => {
    if (!userId) return;
    setErrors([]);
    const room = MAX_FILES - fileCount;
    if (room <= 0) {
      pushError(`You can attach up to ${MAX_FILES} reference files. Remove one to add another.`);
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: DOC_TYPES, multiple: true, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.length) return;

    const assets = result.assets.slice(0, room);
    if (result.assets.length > room) pushError(`Only ${room} more file${room === 1 ? "" : "s"} can be added (limit ${MAX_FILES}).`);

    for (const asset of assets) {
      const sizeMb = (asset.size ?? 0) / (1024 * 1024);
      if (sizeMb > MAX_FILE_MB) {
        pushError(`“${asset.name}” is ${sizeMb.toFixed(1)} MB — the limit is ${MAX_FILE_MB} MB per file.`);
        continue;
      }
      if (useBuilderStore.getState().config.referenceFiles.some((f) => f.name === asset.name)) {
        pushError(`“${asset.name}” is already attached.`);
        continue;
      }
      const key = `${asset.name}-${Date.now()}`;
      setUploading((u) => [...u, { key, name: asset.name }]);
      try {
        const uploaded = await customProjectsService.uploadReferenceFile(userId, asset.uri, asset.name, asset.mimeType ?? undefined);
        addReferenceFile(uploaded);
        if (asset.mimeType?.startsWith("image/")) setPreview(uploaded.path, asset.uri);
      } catch (e) {
        pushError(`“${asset.name}” failed to upload: ${e instanceof Error ? e.message : "please try again."}`);
      } finally {
        setUploading((u) => u.filter((x) => x.key !== key));
      }
    }
  };

  return (
    <WizardScreen
      step={6}
      title="Upload reference material"
      helper="Reference images and documents help us build exactly what you want."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("BuilderEstimate")}
      nextLabel="Continue to estimate"
    >
      <View className="flex-row items-center rounded-xl px-3 py-3 mb-4" style={{ backgroundColor: "#EEF0FF" }}>
        <Ionicons name="information-circle" size={18} color="#4F39F6" />
        <Text className="text-primary text-sm ml-2 flex-1">
          Uploads are optional. You can skip this step and continue anytime.
        </Text>
      </View>

      {errors.length > 0 ? (
        <View className="rounded-xl border px-3 py-2.5 mb-4" style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2" }} accessibilityLiveRegion="polite">
          {errors.map((m, i) => (
            <Text key={`${m}-${i}`} className="text-sm" style={{ color: "#B91C1C" }}>
              {m}
            </Text>
          ))}
        </View>
      ) : null}

      <SectionCard title="Project image (optional)">
        <Text className="text-gray-500 text-xs mb-3">A cover or mock-up for the project · JPG, PNG or WEBP</Text>
        {config.projectImagePath ? (
          <View className="rounded-2xl overflow-hidden border border-gray-100">
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: 170 }} contentFit="cover" accessibilityLabel="Project image preview" />
            ) : (
              <View className="items-center justify-center bg-gray-50" style={{ height: 170 }}>
                <Ionicons name="image" size={28} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm mt-1">Image attached</Text>
              </View>
            )}
            <Pressable
              onPress={() => patch({ projectImagePath: null })}
              accessibilityRole="button"
              accessibilityLabel="Remove project image"
              className="flex-row items-center justify-center"
              style={{ minHeight: 44 }}
            >
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
              <Text className="text-danger ml-1.5 font-medium">Remove image</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={pickImage}
            disabled={imageBusy}
            accessibilityRole="button"
            accessibilityLabel="Upload project image"
            className="rounded-2xl border border-dashed border-gray-300 items-center justify-center"
            style={{ height: 130 }}
          >
            {imageBusy ? (
              <>
                <ActivityIndicator color="#4F39F6" />
                <Text className="text-gray-500 text-sm mt-2">Uploading…</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={26} color="#6B7280" />
                <Text className="text-gray-600 mt-2">Tap to choose an image</Text>
              </>
            )}
          </Pressable>
        )}
      </SectionCard>

      <SectionCard title={`Reference files (${fileCount}/${MAX_FILES})`}>
        <Text className="text-gray-500 text-xs mb-3">
          PDF, DOC/DOCX, ZIP or images · max {MAX_FILE_MB} MB per file · up to {MAX_FILES} files
        </Text>

        {config.referenceFiles.map((f) => {
          const uri = previews[f.path];
          return (
            <View key={f.path} className="flex-row items-center rounded-xl border border-gray-100 px-3 mb-2" style={{ minHeight: 56 }}>
              {uri ? (
                <Image source={{ uri }} style={{ width: 36, height: 36, borderRadius: 8 }} contentFit="cover" accessibilityLabel={`Preview of ${f.name}`} />
              ) : (
                <View className="w-9 h-9 rounded-lg items-center justify-center bg-gray-50">
                  <Ionicons name="document-attach-outline" size={18} color="#6B7280" />
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className="text-gray-800" numberOfLines={1}>
                  {f.name}
                </Text>
                <Text className="text-gray-500 text-xs">{f.sizeMb.toFixed(2)} MB</Text>
              </View>
              <Pressable
                onPress={() => removeReferenceFile(f.path)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${f.name}`}
                hitSlop={4}
                style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          );
        })}

        {uploading.map((u) => (
          <View key={u.key} className="flex-row items-center rounded-xl border border-gray-100 px-3 mb-2" style={{ minHeight: 56 }}>
            <ActivityIndicator color="#4F39F6" />
            <Text className="text-gray-600 ml-3 flex-1" numberOfLines={1}>
              Uploading {u.name}…
            </Text>
          </View>
        ))}

        <Pressable
          onPress={pickFiles}
          disabled={uploading.length > 0}
          accessibilityRole="button"
          accessibilityLabel="Add reference files"
          className="flex-row items-center justify-center rounded-xl border border-dashed border-gray-300"
          style={{ minHeight: 48 }}
        >
          <Ionicons name="add" size={18} color="#4F39F6" />
          <Text className="text-primary font-medium ml-1.5">Add files</Text>
        </Pressable>
      </SectionCard>

      <Pressable
        onPress={() => navigation.navigate("BuilderEstimate")}
        accessibilityRole="button"
        accessibilityLabel="Skip uploads for now"
        className="items-center justify-center"
        style={{ minHeight: 44 }}
      >
        <Text className="text-gray-600 font-medium">Skip for now</Text>
      </Pressable>
    </WizardScreen>
  );
}

export default BuilderUploadsScreen;
