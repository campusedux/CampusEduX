import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Button } from "@/components/ui";
import { notify, confirmAction } from "@/lib/notify";
import { LEGAL } from "@/constants/legal";
import { useDeleteAccount } from "@/hooks/useSettings";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { LegalDocumentBody } from "./LegalDocumentBody";

export function DeleteAccountInfoScreen() {
  const navigation = useNavigation<any>();
  const deleteAccount = useDeleteAccount();
  const reset = useAuthStore((s) => s.reset);

  const handleDelete = () => {
    confirmAction(
      "Delete Account",
      "This permanently deletes your account and all your data (purchases, applications, resumes, wallet, custom projects). This cannot be undone.",
      async () => {
        try {
          await deleteAccount.mutateAsync();
          await authService.logout().catch(() => undefined);
          reset();
        } catch (error: any) {
          notify(
            "Couldn't delete account",
            error?.message ?? "Please try again or email " + LEGAL.privacyEmail + ".",
          );
        }
      },
      "Delete Permanently",
    );
  };

  const emailRequest = () => {
    const url = `mailto:${LEGAL.privacyEmail}?subject=${encodeURIComponent("Delete my account")}`;
    Linking.openURL(url).catch(() =>
      notify("Couldn't open your mail app", `Email ${LEGAL.privacyEmail} from your registered address.`),
    );
  };

  return (
    <Screen scroll className="px-6 pb-6">
      <View className="flex-row items-center mt-2 mb-4">
        <Pressable onPress={() => navigation.goBack()} className="mr-3" hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Delete Account</Text>
      </View>

      <LegalDocumentBody
        docId="delete-account"
        onNavigateRelated={(id) =>
          id === "contact"
            ? navigation.navigate("Contact")
            : navigation.navigate("LegalDocument", { docId: id })
        }
        footerExtras={
          <View className="mb-4">
            <Button
              label={deleteAccount.isPending ? "Deleting…" : "Delete my account permanently"}
              variant="danger"
              loading={deleteAccount.isPending}
              onPress={handleDelete}
            />
            <Pressable onPress={emailRequest} className="items-center py-3 mt-1">
              <Text className="text-primary text-sm font-medium">
                Can&apos;t sign in? Email a deletion request
              </Text>
            </Pressable>
          </View>
        }
      />
    </Screen>
  );
}

export default DeleteAccountInfoScreen;
