import { boundaryScreenLayout } from "@/components/errors/ErrorBoundary";
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { JobsDashboardScreen } from "@/jobs/JobsDashboardScreen";
import { SearchJobsScreen } from "@/jobs/SearchJobsScreen";
import { FilterJobsScreen } from "@/jobs/FilterJobsScreen";
import { CompanyListScreen } from "@/jobs/CompanyListScreen";
import { CompanyDetailsScreen } from "@/jobs/CompanyDetailsScreen";
import { JobDetailsScreen } from "@/jobs/JobDetailsScreen";
import { ResumeUploadScreen } from "@/jobs/ResumeUploadScreen";
import { SavedJobsScreen } from "@/jobs/SavedJobsScreen";
import { AppliedJobsScreen } from "@/jobs/AppliedJobsScreen";
import { ApplicationStatusScreen } from "@/jobs/ApplicationStatusScreen";
import { RecommendedJobsScreen } from "@/jobs/RecommendedJobsScreen";
import { JobAlertsScreen } from "@/jobs/JobAlertsScreen";
import { RecruiterDetailsScreen } from "@/jobs/RecruiterDetailsScreen";
import type { JobStackParamList } from "@/types";

const Stack = createNativeStackNavigator<JobStackParamList>();

/**
 * Module 4 - Jobs (14 screens). Nested inside the "Jobs" bottom tab, same
 * pattern as HomeNavigator / ProjectNavigator.
 */
export function JobNavigator() {
  return (
    <Stack.Navigator screenLayout={boundaryScreenLayout} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JobsDashboard" component={JobsDashboardScreen} />
      <Stack.Screen name="SearchJobs" component={SearchJobsScreen} />
      <Stack.Screen name="FilterJobs" component={FilterJobsScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="CompanyList" component={CompanyListScreen} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetailsScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="ResumeUpload" component={ResumeUploadScreen} />
      <Stack.Screen name="SavedJobs" component={SavedJobsScreen} />
      <Stack.Screen name="AppliedJobs" component={AppliedJobsScreen} />
      <Stack.Screen name="ApplicationStatus" component={ApplicationStatusScreen} />
      <Stack.Screen name="RecommendedJobs" component={RecommendedJobsScreen} />
      <Stack.Screen name="JobAlerts" component={JobAlertsScreen} />
      <Stack.Screen name="RecruiterDetails" component={RecruiterDetailsScreen} />
    </Stack.Navigator>
  );
}

export default JobNavigator;
