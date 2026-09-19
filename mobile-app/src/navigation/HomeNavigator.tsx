import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeScreen } from "@/home/HomeScreen";
import { SearchResultScreen } from "@/home/SearchResultScreen";
import { NotificationScreen } from "@/home/NotificationScreen";
import { CategoriesScreen } from "@/home/CategoriesScreen";
import { TrendingProjectsScreen } from "@/home/TrendingProjectsScreen";
import { PremiumProjectsScreen } from "@/home/PremiumProjectsScreen";
import { BestSellerScreen } from "@/home/BestSellerScreen";
import { NewArrivalScreen } from "@/home/NewArrivalScreen";
import { LatestJobsScreen } from "@/home/LatestJobsScreen";
import { ReferralBannerScreen } from "@/home/ReferralBannerScreen";
import { OfferBannerScreen } from "@/home/OfferBannerScreen";
import { PracticeHubScreen } from "@/practice/PracticeHubScreen";
import { PracticeProblemsScreen } from "@/practice/PracticeProblemsScreen";
import { PracticeProblemScreen } from "@/practice/PracticeProblemScreen";
import { PracticeCompilerScreen } from "@/practice/PracticeCompilerScreen";
import { PracticeSubmissionsScreen } from "@/practice/PracticeSubmissionsScreen";
import { PracticeSubmissionScreen } from "@/practice/PracticeSubmissionScreen";
import { InterviewCategoriesScreen } from "@/practice/InterviewCategoriesScreen";
import { InterviewTopicsScreen } from "@/practice/InterviewTopicsScreen";
import { InterviewTopicScreen } from "@/practice/InterviewTopicScreen";
import type { HomeStackParamList } from "@/types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

/**
 * Module 2 - Home. Nested inside the "Home" bottom tab so the
 * tab bar stays visible on the dashboard but drills into full-screen views
 * (search, notifications, "view all" lists) without it.
 */
export function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeDashboard" component={HomeScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="AllCategories" component={CategoriesScreen} />
      <Stack.Screen name="TrendingProjects" component={TrendingProjectsScreen} />
      <Stack.Screen name="PremiumProjects" component={PremiumProjectsScreen} />
      <Stack.Screen name="BestSellers" component={BestSellerScreen} />
      <Stack.Screen name="NewArrivals" component={NewArrivalScreen} />
      <Stack.Screen name="LatestJobs" component={LatestJobsScreen} />
      <Stack.Screen name="ReferralBanner" component={ReferralBannerScreen} />
      <Stack.Screen name="OfferBanner" component={OfferBannerScreen} />
      <Stack.Screen name="PracticeHub" component={PracticeHubScreen} />
      <Stack.Screen name="PracticeProblems" component={PracticeProblemsScreen} />
      <Stack.Screen name="PracticeProblem" component={PracticeProblemScreen} />
      <Stack.Screen name="PracticeCompiler" component={PracticeCompilerScreen} />
      <Stack.Screen name="PracticeSubmissions" component={PracticeSubmissionsScreen} />
      <Stack.Screen name="PracticeSubmission" component={PracticeSubmissionScreen} />
      <Stack.Screen name="InterviewCategories" component={InterviewCategoriesScreen} />
      <Stack.Screen name="InterviewTopics" component={InterviewTopicsScreen} />
      <Stack.Screen name="InterviewTopic" component={InterviewTopicScreen} />
    </Stack.Navigator>
  );
}

export default HomeNavigator;
