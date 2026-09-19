import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { MainNavigator } from "./MainNavigator";
import { ResumeNavigator } from "./ResumeNavigator";
import { MyProjectsNavigator } from "./MyProjectsNavigator";
import { CustomProjectsNavigator } from "./CustomProjectsNavigator";
import { ReferralNavigator } from "./ReferralNavigator";
import { PremiumNavigator } from "./PremiumNavigator";
import { SettingsNavigator } from "./SettingsNavigator";
import { useSchemeColors } from "@/theme";
import { DrawerContent } from "./DrawerContent";
import type { DrawerParamList } from "@/types";

const Drawer = createDrawerNavigator<DrawerParamList>();

/**
 * Side drawer (see Drawer.png) — wraps MainNavigator with the full menu
 * (profile header, all module links, logout). Modules reached only from
 * the drawer (not a bottom tab), like Resume Builder, are registered here
 * as sibling stacks alongside MainTabs.
 */
export function DrawerNavigator() {
  const { colors, isDark } = useSchemeColors();
  return (
    <Drawer.Navigator
      // Dark/AMOLED: the panel behind the menu takes the surface colour (Light: the library default, unchanged).
      screenOptions={{ headerShown: false, drawerStyle: isDark ? { width: "82%", backgroundColor: colors.surface } : { width: "82%" } }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="MainTabs" component={MainNavigator} />
      <Drawer.Screen name="ResumeBuilder" component={ResumeNavigator} />
      <Drawer.Screen name="MyProjects" component={MyProjectsNavigator} />
      <Drawer.Screen name="CustomProjects" component={CustomProjectsNavigator} />
      <Drawer.Screen name="Referral" component={ReferralNavigator} />
      <Drawer.Screen name="Premium" component={PremiumNavigator} />
      <Drawer.Screen name="SettingsModule" component={SettingsNavigator} />
    </Drawer.Navigator>
  );
}

export default DrawerNavigator;
