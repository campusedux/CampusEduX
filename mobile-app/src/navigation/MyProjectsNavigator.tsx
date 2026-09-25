import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PurchasedProjectsScreen } from "@/myProjects/PurchasedProjectsScreen";
import { ProjectDetailsScreen } from "@/myProjects/ProjectDetailsScreen";
import { DownloadFilesScreen } from "@/myProjects/DownloadFilesScreen";
import { UpdateAvailableScreen } from "@/myProjects/UpdateAvailableScreen";
import { DocumentationScreen } from "@/myProjects/DocumentationScreen";
import { SourceCodeScreen } from "@/myProjects/SourceCodeScreen";
import { VersionHistoryScreen } from "@/myProjects/VersionHistoryScreen";
import { SupportScreen } from "@/myProjects/SupportScreen";
import type { MyProjectsStackParamList } from "@/types";

const Stack = createNativeStackNavigator<MyProjectsStackParamList>();

/**
 * Module 7 - My Projects (8 screens), reached from the drawer. Distinct
 * from Module 3's marketplace "Projects" tab: this covers what a student
 * already owns (purchased/wishlist/collections, downloads, updates,
 * source code, version history) rather than browsing/buying new ones.
 */
export function MyProjectsNavigator() {
  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PurchasedProjects" component={PurchasedProjectsScreen} />
      <Stack.Screen name="MyProjectDetails" component={ProjectDetailsScreen} />
      <Stack.Screen name="DownloadFiles" component={DownloadFilesScreen} />
      <Stack.Screen name="UpdateAvailable" component={UpdateAvailableScreen} />
      <Stack.Screen name="Documentation" component={DocumentationScreen} />
      <Stack.Screen name="SourceCode" component={SourceCodeScreen} />
      <Stack.Screen name="VersionHistory" component={VersionHistoryScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}

export default MyProjectsNavigator;
