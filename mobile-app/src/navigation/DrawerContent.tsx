import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { confirmAction, notify } from "@/lib/notify";
import { alpha, lighten, useSchemeColors } from "@/theme";

type Nav = DrawerContentComponentProps["navigation"];

interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  /** Drawer route this item belongs to, used for the active highlight. */
  route: string;
  onPress: (nav: Nav) => void;
}

const MENU_ITEMS: MenuItem[] = [
  { label: "Home", icon: "home", tint: "#4F39F6", route: "MainTabs", onPress: (nav) => nav.navigate("MainTabs", { screen: "Home", params: { screen: "HomeDashboard" } }) },
  { label: "My Projects", icon: "folder", tint: "#F59E0B", route: "MyProjects", onPress: (nav) => nav.navigate("MyProjects", { screen: "PurchasedProjects" }) },
  { label: "Custom Project Builder", icon: "construct", tint: "#4F39F6", route: "CustomProjects", onPress: (nav) => nav.navigate("CustomProjects", { screen: "BuilderStart" }) },
  { label: "My Custom Projects", icon: "cube", tint: "#0D9488", route: "_CustomProjectsList", onPress: (nav) => nav.navigate("CustomProjects", { screen: "MyCustomProjects" }) },
  { label: "Jobs", icon: "briefcase", tint: "#3B82F6", route: "_Jobs", onPress: (nav) => nav.navigate("MainTabs", { screen: "Jobs" }) },
  { label: "Learning", icon: "library", tint: "#16A34A", route: "_Prep", onPress: (nav) => nav.navigate("MainTabs", { screen: "Prep" }) },
  { label: "Resume Builder", icon: "document-text", tint: "#16A34A", route: "ResumeBuilder", onPress: (nav) => nav.navigate("ResumeBuilder", { screen: "ResumeDashboard" }) },
  { label: "Companies", icon: "business", tint: "#0D9488", route: "_Companies", onPress: (nav) => nav.navigate("MainTabs", { screen: "Jobs", params: { screen: "CompanyList" } }) },
  { label: "Referral & Earn", icon: "gift", tint: "#EC4899", route: "Referral", onPress: (nav) => nav.navigate("Referral", { screen: "ReferralDashboard" }) },
  { label: "Premium", icon: "star", tint: "#F59E0B", route: "Premium", onPress: (nav) => nav.navigate("Premium", { screen: "PremiumPlans" }) },
  { label: "Downloads", icon: "download", tint: "#16A34A", route: "_Downloads", onPress: (nav) => nav.navigate("MainTabs", { screen: "Projects", params: { screen: "DownloadHistory" } }) },
  { label: "Wishlist", icon: "heart", tint: "#EC4899", route: "_Wishlist", onPress: (nav) => nav.navigate("MainTabs", { screen: "Projects", params: { screen: "Wishlist" } }) },
  { label: "Wallet", icon: "wallet", tint: "#7C3AED", route: "_Wallet", onPress: (nav) => nav.navigate("MainTabs", { screen: "Profile", params: { screen: "Wallet" } }) },
  { label: "Settings", icon: "settings", tint: "#6B7280", route: "SettingsModule", onPress: (nav) => nav.navigate("SettingsModule", { screen: "Settings" }) },
  { label: "Help", icon: "help-circle", tint: "#2563EB", route: "_Help", onPress: (nav) => nav.navigate("SettingsModule", { screen: "ContactSupport" }) },
  { label: "About", icon: "information-circle", tint: "#2563EB", route: "_About", onPress: (nav) => nav.navigate("SettingsModule", { screen: "About" }) },
];

/**
 * Custom drawer content matching the drawer mockup: gradient profile header
 * with a Premium badge, then a full menu where every row has a coloured icon
 * tile and the active section is highlighted.
 */
export function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const user = useAuthStore((s) => s.user);
  const reset = useAuthStore((s) => s.reset);
  const activeRoute = state.routeNames[state.index];
  // Colours only. Light mode keeps the original classes/values exactly; Dark/AMOLED override via tokens.
  const { colors, isDark } = useSchemeColors();

  const handleLogout = () => {
    confirmAction(
      "Logout",
      "Are you sure you want to logout?",
      async () => {
        try {
          await authService.logout();
        } catch (error: any) {
          notify("Logout failed", error?.message ?? "Please try again.");
          return;
        }
        // RootNavigator swaps back to the auth stack the moment the store
        // clears — no imperative navigation reset needed.
        reset();
      },
      "Logout"
    );
  };

  return (
    <ScrollView className="flex-1 bg-white" style={isDark ? { backgroundColor: colors.surface } : undefined} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#4F39F6", "#3A28C8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 56 }}>
        <View className="pb-6 px-6">
          <View className="flex-row items-center">
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="w-16 h-16 rounded-full border-2 border-white/60" />
            ) : (
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center border-2 border-white/40">
                <Ionicons name="person" size={30} color="#fff" />
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="text-white text-lg font-bold" numberOfLines={1}>
                {user?.fullName || "Guest"}
              </Text>
              <Text style={{ color: "#C7CBFF" }} className="text-xs" numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>
          {user?.isPremium ? (
            <View className="flex-row items-center self-start bg-yellow-400 rounded-full px-3 py-1 mt-3">
              <Ionicons name="ribbon" size={12} color="#78350F" />
              <Text className="text-yellow-900 text-xs font-semibold ml-1">Premium Member</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View className="px-3 pt-3">
        {MENU_ITEMS.map((item) => {
          const isActive = activeRoute === item.route || (item.route === "MainTabs" && activeRoute === "MainTabs");
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                // Navigate first, then close the drawer via the library's own
                // DrawerActions (navigation.closeDrawer()). Both are plain
                // dispatches on the same navigator, so this also works when the
                // item targets a nested screen — no timeouts / hacks needed.
                item.onPress(navigation);
                navigation.closeDrawer();
              }}
              className="flex-row items-center justify-between px-3 py-2.5 rounded-xl mb-0.5"
              style={isActive ? { backgroundColor: isDark ? colors.primarySoft : "#EEF0FF" } : undefined}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${item.tint}1A` }}
                >
                  <Ionicons name={item.icon} size={18} color={isDark ? lighten(item.tint, 0.4) : item.tint} />
                </View>
                <Text
                  className={`text-[15px] ${isActive ? "text-primary font-semibold" : "text-gray-800"}`}
                  style={isDark ? { color: isActive ? colors.primaryText : colors.text } : undefined}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? (isActive ? colors.primaryText : colors.textMuted) : isActive ? "#4F39F6" : "#D1D5DB"} />
            </Pressable>
          );
        })}

        <View className="h-px bg-gray-100 my-2 mx-3" style={isDark ? { backgroundColor: colors.divider } : undefined} />

        <Pressable onPress={handleLogout} className="flex-row items-center px-3 py-2.5 rounded-xl">
          <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: isDark ? alpha(colors.danger, 0.16) : "#FEE2E2" }}>
            <Ionicons name="log-out-outline" size={18} color={isDark ? colors.danger : "#DC2626"} />
          </View>
          <Text className="text-danger text-[15px] font-semibold" style={isDark ? { color: colors.danger } : undefined}>
            Logout
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default DrawerContent;
