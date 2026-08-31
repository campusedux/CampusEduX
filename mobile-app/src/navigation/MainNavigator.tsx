import React from "react";
import { BottomTabNavigator } from "./BottomTabNavigator";

/**
 * Entry point for the authenticated app. The Drawer (Module: side menu)
 * wraps this in DrawerNavigator.tsx; kept separate so the tab bar can also
 * be used standalone in tests.
 */
export function MainNavigator() {
  return <BottomTabNavigator />;
}

export default MainNavigator;
