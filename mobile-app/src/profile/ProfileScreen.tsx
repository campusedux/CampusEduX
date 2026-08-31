import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Screen, DrawerMenuButton, PressableScale } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import { useWalletSummary } from "@/hooks/useWallet";
import { useReferralSummary } from "@/hooks/useHomeData";
import { CARD_SHADOW, CARD_SHADOW_LG } from "@/constants/theme";
import type { ProfileStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "Profile">;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const { data: wallet, isError: walletError } = useWalletSummary();
  const { data: referral } = useReferralSummary();

  const hasAcademic = !!(user?.branch || user?.course || user?.year);

  return (
    <Screen scroll className="px-6">
      <View className="flex-row items-center justify-between mt-2 mb-5">
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <DrawerMenuButton />
          <Text className="text-xl font-bold text-gray-900">My Profile</Text>
        </View>
        <Pressable onPress={() => (navigation as any).navigate("Settings")} hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color="#111827" />
        </Pressable>
      </View>

      {/* Profile header card */}
      <View className="bg-white border border-gray-100 rounded-2xl p-5 mb-5" style={CARD_SHADOW_LG}>
        <View className="flex-row items-center">
          <Pressable onPress={() => (navigation as any).navigate("EditProfile")} className="relative">
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="w-20 h-20 rounded-full" />
            ) : (
              <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: "#EEF0FF" }}>
                <Ionicons name="person" size={34} color="#4F39F6" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary items-center justify-center border-2 border-white">
              <Ionicons name="camera" size={11} color="#fff" />
            </View>
          </Pressable>
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
              {user?.fullName || "Your Name"}
            </Text>
            <Text className="text-gray-400 text-sm" numberOfLines={1}>
              {user?.email}
            </Text>
            {user?.mobileNumber ? <Text className="text-gray-400 text-sm">+91 {user.mobileNumber}</Text> : null}
          </View>
        </View>
        <PressableScale
          onPress={() => (navigation as any).navigate("EditProfile")}
          className="flex-row items-center justify-center rounded-xl mt-4 py-2.5"
          style={{ backgroundColor: "#EEF0FF" }}
        >
          <Ionicons name="create-outline" size={16} color="#4F39F6" />
          <Text className="text-primary font-semibold text-sm ml-1.5">Edit Profile</Text>
        </PressableScale>
      </View>

      {/* Academic card */}
      <Text className="font-bold text-gray-900 mb-3">Academic Details</Text>
      <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-6" style={CARD_SHADOW}>
        {hasAcademic ? (
          <>
            <AcademicRow icon="git-branch-outline" label="Branch" value={user?.branch || "Not set"} />
            <AcademicRow icon="school-outline" label="Course" value={user?.course || "Not set"} />
            <AcademicRow icon="calendar-outline" label="Year" value={user?.year || "Not set"} last />
          </>
        ) : (
          <Text className="text-gray-500 text-sm mb-3">
            Add your course, branch and year to get study material, projects and jobs picked for you.
          </Text>
        )}
        <PressableScale
          onPress={() => (navigation as any).navigate("ChangeCourse")}
          className="flex-row items-center justify-center rounded-xl mt-3 py-2.5 border border-primary"
        >
          <Text className="text-primary font-semibold text-sm">
            {hasAcademic ? "Change Academic Details" : "Add Academic Details"}
          </Text>
        </PressableScale>
      </View>

      <Text className="font-bold text-gray-900 mb-3">Quick Access</Text>
      <QuickAccessRow
        icon="wallet-outline"
        label="Wallet"
        value={walletError ? "—" : `₹${wallet?.balance.toLocaleString() ?? "0"}`}
        onPress={() => (navigation as any).navigate("Wallet")}
      />
      <QuickAccessRow
        icon="gift-outline"
        label="Referral & Earn"
        value="Invite & Earn"
        onPress={() => (navigation as any).navigate("ReferralEarn")}
      />
      <QuickAccessRow
        icon="receipt-outline"
        label="Purchase History"
        value="View Orders"
        onPress={() => (navigation as any).navigate("PurchaseHistory")}
      />
      <QuickAccessRow
        icon="settings-outline"
        label="Settings"
        value="App Preferences"
        onPress={() => (navigation as any).navigate("Settings")}
      />
      <QuickAccessRow
        icon="help-circle-outline"
        label="Help & Support"
        value="Get Assistance"
        onPress={() => (navigation as any).navigate("HelpSupport")}
      />

      {referral && referral.totalReferrals > 0 && (
        <Text className="text-gray-400 text-xs text-center mt-4 mb-2">
          {referral.totalReferrals} referrals · ₹{referral.totalEarned} earned so far
        </Text>
      )}

      <PressableScale
        onPress={() => (navigation as any).navigate("Logout")}
        className="flex-row items-center justify-center bg-white border border-gray-100 rounded-2xl p-4 mt-3"
        style={CARD_SHADOW}
      >
        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
        <Text className="text-danger font-semibold ml-2">Logout</Text>
      </PressableScale>

      <View className="h-6" />
    </Screen>
  );
}

function AcademicRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between py-2.5 ${last ? "" : "border-b border-gray-100"}`}>
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color="#9CA3AF" />
        <Text className="text-gray-500 text-sm ml-2">{label}</Text>
      </View>
      <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function QuickAccessRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      className="flex-row items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 mb-3"
      style={CARD_SHADOW}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
          <Ionicons name={icon} size={19} color="#4F39F6" />
        </View>
        <Text className="font-semibold text-gray-900">{label}</Text>
      </View>
      <View className="flex-row items-center">
        <Text className="text-gray-400 text-sm mr-2">{value}</Text>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </PressableScale>
  );
}

export default ProfileScreen;
