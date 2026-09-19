import { userScopedKey } from "@/lib/queryClient";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/store/authStore";
import type { ProfileEditableFields } from "@/types";

export const profileQueryKeys = {
  purchaseHistory: ["profile", "purchase-history"] as const,
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const updateUserFields = useAuthStore((s) => s.updateUserFields);
  return useMutation({
    mutationFn: (fields: ProfileEditableFields) => profileService.updateProfile(userId as string, fields),
    onSuccess: (_data, fields) => {
      updateUserFields({
        fullName: fields.fullName,
        mobileNumber: fields.mobileNumber,
        avatarUrl: fields.avatarUrl,
        linkedinUrl: fields.linkedinUrl,
        githubUrl: fields.githubUrl,
        portfolioUrl: fields.portfolioUrl,
      });
      queryClient.invalidateQueries();
    },
  });
};

/** Picks a photo from the library and uploads it, returning the public URL. */
export function usePickAndUploadAvatar() {
  const [isUploading, setIsUploading] = useState(false);
  const userId = useAuthStore((s) => s.user?.id);

  const pickAndUpload = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return null;

    setIsUploading(true);
    try {
      return await profileService.uploadAvatar(userId as string, result.assets[0].uri);
    } finally {
      setIsUploading(false);
    }
  }, [userId]);

  return { pickAndUpload, isUploading };
}

export const usePurchaseHistory = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userScopedKey(profileQueryKeys.purchaseHistory, userId),
    queryFn: () => profileService.getPurchaseHistory(userId as string),
    enabled: !!userId,
  });
};
