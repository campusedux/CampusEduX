import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Input, LoadingState, ErrorState } from "@/components/ui";
import { useResumeDetail, useUpdatePersonalDetails } from "@/hooks/useResume";
import type { ResumeStackParamList, ResumePersonalDetails } from "@/types";

type Rte = RouteProp<ResumeStackParamList, "PersonalDetails">;

export function PersonalDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const { data: resume, isLoading, isError, refetch } = useResumeDetail(params.resumeId);
  const updateDetails = useUpdatePersonalDetails(params.resumeId);

  const [details, setDetails] = useState<ResumePersonalDetails | null>(null);

  useEffect(() => {
    if (resume) setDetails(resume.personalDetails);
  }, [resume]);

  if (isLoading || !details) return <Screen className="items-center justify-center"><LoadingState label="Loading..." /></Screen>;
  if (isError) return <Screen className="items-center justify-center px-6"><ErrorState message="Couldn't load this resume." onRetry={refetch} /></Screen>;

  const set = (field: keyof ResumePersonalDetails, value: string) => setDetails((d) => (d ? { ...d, [field]: value } : d));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify("Permission needed", "Allow photo library access to add a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets?.[0]) {
      set("photoUrl", result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!details.fullName.trim()) {
      notify("Full name required", "Please enter your full name to continue.");
      return;
    }
    try {
      await updateDetails.mutateAsync(details);
      (navigation as any).navigate("Education", { resumeId: params.resumeId });
    } catch (error: any) {
      notify("Couldn't save", error.message ?? "Please try again.");
    }
  };

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center mt-2 mb-5">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Personal Details</Text>
      </View>

      <Pressable onPress={pickPhoto} className="self-center mb-6">
        <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: "#EEF0FF" }}>
          {details.photoUrl ? (
            <Image source={{ uri: details.photoUrl }} className="w-24 h-24 rounded-full" />
          ) : (
            <Ionicons name="person" size={40} color="#4F39F6" />
          )}
        </View>
        <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-white">
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      </Pressable>

      <Input icon="person-outline" placeholder="Full Name" value={details.fullName} onChangeText={(v) => set("fullName", v)} />
      <Input icon="briefcase-outline" placeholder="Job Title" value={details.jobTitle} onChangeText={(v) => set("jobTitle", v)} />
      <Input icon="mail-outline" placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={details.email} onChangeText={(v) => set("email", v)} />
      <Input icon="call-outline" placeholder="Phone" keyboardType="phone-pad" value={details.phone} onChangeText={(v) => set("phone", v)} />
      <Input icon="location-outline" placeholder="Location" value={details.location} onChangeText={(v) => set("location", v)} />
      <Input icon="logo-linkedin" placeholder="LinkedIn" autoCapitalize="none" value={details.linkedin} onChangeText={(v) => set("linkedin", v)} />
      <Input icon="globe-outline" placeholder="Website" autoCapitalize="none" value={details.website} onChangeText={(v) => set("website", v)} />

      <Button label="Save & Continue" loading={updateDetails.isPending} onPress={handleContinue} className="mt-2 mb-6" />
    </Screen>
  );
}

export default PersonalDetailsScreen;
