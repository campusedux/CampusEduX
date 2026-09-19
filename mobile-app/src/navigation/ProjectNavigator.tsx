import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AllProjectsScreen } from "@/project/AllProjectsScreen";
import { CategoryProjectsScreen } from "@/project/CategoryProjectsScreen";
import { SearchProjectsScreen } from "@/project/SearchProjectsScreen";
import { FilterProjectsScreen } from "@/project/FilterProjectsScreen";
import { ProjectDetailsScreen } from "@/project/ProjectDetailsScreen";
import { ImageGalleryScreen } from "@/project/ImageGalleryScreen";
import { VideoPreviewScreen } from "@/project/VideoPreviewScreen";
import { LiveDemoScreen } from "@/project/LiveDemoScreen";
import { ReviewsScreen } from "@/project/ReviewsScreen";
import { SimilarProjectsScreen } from "@/project/SimilarProjectsScreen";
import { BuyNowScreen } from "@/project/BuyNowScreen";
import { PaymentScreen } from "@/project/PaymentScreen";
import { PaymentSuccessScreen } from "@/project/PaymentSuccessScreen";
import { PaymentFailedScreen } from "@/project/PaymentFailedScreen";
import { WishlistScreen } from "@/project/WishlistScreen";
import { DownloadProjectScreen } from "@/project/DownloadProjectScreen";
import { MyPurchasedProjectsScreen } from "@/project/MyPurchasedProjectsScreen";
import { DownloadHistoryScreen } from "@/project/DownloadHistoryScreen";
import type { ProjectStackParamList } from "@/types";

const Stack = createNativeStackNavigator<ProjectStackParamList>();

/**
 * Module 3 - Project Marketplace (18 screens). Nested inside the "Projects"
 * bottom tab, same pattern as HomeNavigator.
 */
export function ProjectNavigator() {
  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AllProjects" component={AllProjectsScreen} />
      <Stack.Screen name="CategoryProjects" component={CategoryProjectsScreen} />
      <Stack.Screen name="SearchProjects" component={SearchProjectsScreen} />
      <Stack.Screen name="FilterProjects" component={FilterProjectsScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
      <Stack.Screen name="ImageGallery" component={ImageGalleryScreen} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="VideoPreview" component={VideoPreviewScreen} />
      <Stack.Screen name="LiveDemo" component={LiveDemoScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="SimilarProjects" component={SimilarProjectsScreen} />
      <Stack.Screen name="BuyNow" component={BuyNowScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="PaymentFailed" component={PaymentFailedScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="DownloadProject" component={DownloadProjectScreen} />
      <Stack.Screen name="MyPurchasedProjects" component={MyPurchasedProjectsScreen} />
      <Stack.Screen name="DownloadHistory" component={DownloadHistoryScreen} />
    </Stack.Navigator>
  );
}

export default ProjectNavigator;
