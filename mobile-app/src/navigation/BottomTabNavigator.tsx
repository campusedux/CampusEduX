import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TabBarIcon, TabBarButton } from "@/components/ui/TabBarIcon";
import { COLORS } from "@/constants/theme";
import { HomeNavigator } from "./HomeNavigator";
import { ProjectNavigator } from "./ProjectNavigator";
import { JobNavigator } from "./JobNavigator";
import { PlacementNavigator } from "./PlacementNavigator";
import { ProfileNavigator } from "./ProfileNavigator";
import type { MainTabParamList } from "@/types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: "home",
  Projects: "folder",
  Jobs: "briefcase",
  Prep: "school",
  Profile: "person",
};

/**
 * First screen of each tab's nested native-stack. Tapping a footer tab always
 * lands here: without this, a tab keeps whatever screen it was last left on
 * (e.g. a drawer "Downloads" jump leaves the Projects stack on DownloadHistory),
 * so the next tap on "Projects" would open that screen instead of the list.
 */
const TAB_ROOT: Record<keyof MainTabParamList, string> = {
  Home: "HomeDashboard",
  Projects: "AllProjects",
  Jobs: "JobsDashboard",
  Prep: "PlacementHome",
  Profile: "Profile",
};

/**
 * On every tab-bar press, switch to that tab AND reset its nested stack to its
 * root screen using React Navigation's own navigate({ screen }) — no manual
 * stack surgery. `tabPress` only fires for real button presses, so programmatic
 * deep links (Home → ProjectDetails, drawer → Wishlist, …) are untouched.
 */
const resetTabOnPress: React.ComponentProps<typeof Tab.Screen>["listeners"] = ({ navigation, route }) => ({
  tabPress: (e) => {
    e.preventDefault();
    const name = route.name as keyof MainTabParamList;
    (navigation as any).navigate(name, { screen: TAB_ROOT[name] });
  },
});

/**
 * Bottom tab bar shown across every module. The fourth tab keeps the internal
 * route name "Prep" (deep links / navigation unchanged) but is shown to the
 * user as "Learning" — one dynamic, DB-driven Learning home listing every
 * published grid (Grid → Section → Topic → Content).
 */
export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarAllowFontScaling: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          paddingTop: 6,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarIcon: ({ color, focused }) => <TabBarIcon name={ICONS[route.name]} focused={focused} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeNavigator} listeners={resetTabOnPress} />
      <Tab.Screen name="Projects" component={ProjectNavigator} listeners={resetTabOnPress} />
      <Tab.Screen name="Jobs" component={JobNavigator} listeners={resetTabOnPress} />
      <Tab.Screen name="Prep" component={PlacementNavigator} options={{ title: "Learning" }} listeners={resetTabOnPress} />
      <Tab.Screen name="Profile" component={ProfileNavigator} listeners={resetTabOnPress} />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
