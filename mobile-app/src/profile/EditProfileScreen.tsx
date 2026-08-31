import React, { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { notify } from "@/lib/notify";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button, Input, Chip } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import { useUpdateProfile, usePickAndUploadAvatar } from "@/hooks/useProfile";

const GENDERS = ["Male", "Female", "Other"];

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const { pickAndUpload, isUploading } = usePickAndUploadAvatar();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);

  const handlePickPhoto = async () => {
    const uploadedUrl = await pickAndUpload();
    if (uploadedUrl) setAvatarUrl(uploadedUrl);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      notify("Full name required", "Please enter your full name.");
      return;
    }
    try {
      await updateProfile.mutateAsync({ fullName, mobileNumber, dateOfBirth: dateOfBirth || null, gender: gender || null, location: location || null, avatarUrl });
      navigation.goBack();
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
        <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
      </View>

      <Pressable onPress={handlePickPhoto} className="self-center mb-6" disabled={isUploading}>
        <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: "#EEF0FF" }}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} className="w-24 h-24 rounded-full" /> : <Ionicons name="person" size={40} color="#4F39F6" />}
        </View>
        <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-white">
          <Ionicons name={isUploading ? "hourglass-outline" : "camera"} size={14} color="#fff" />
        </View>
      </Pressable>

      <Input icon="person-outline" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
      <Input icon="mail-outline" placeholder="Email" value={user?.email ?? ""} editable={false} />
      <Input icon="call-outline" placeholder="Phone Number" keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} />
      <Input icon="calendar-outline" placeholder="Date of Birth (YYYY-MM-DD)" value={dateOfBirth} onChangeText={setDateOfBirth} />

      <Text className="font-semibold text-gray-900 mb-2">Gender</Text>
      <View className="flex-row flex-wrap mb-4">
        {GENDERS.map((g) => (
          <Chip key={g} label={g} active={gender === g} onPress={() => setGender(gender === g ? "" : g)} />
        ))}
      </View>

      <Input icon="location-outline" placeholder="Location" value={location} onChangeText={setLocation} />

      <Button label="Save Changes" loading={updateProfile.isPending} onPress={handleSave} className="mt-2 mb-6" />
    </Screen>
  );
}

export default EditProfileScreen;
