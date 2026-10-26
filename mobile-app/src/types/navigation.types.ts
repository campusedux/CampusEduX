import type { NavigatorScreenParams } from "@react-navigation/native";
import type { OTPVerificationParams } from "./auth.types";
import type { LegalDocId } from "./legal.types";

export type AuthStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Login: undefined;
  Register: { referralCode?: string } | undefined;
  ForgotPassword: undefined;
  OTPVerification: OTPVerificationParams;
  ResetPassword: { identifier: string };
  LegalDocument: { docId: LegalDocId };
};

/**
 * First-time academic setup. Mounted by RootNavigator only when a session
 * exists but course / branch / year are not yet all saved on the profile.
 */
export type ProfileSetupStackParamList = {
  SelectCourse: undefined;
  SelectBranch: undefined;
  SelectYear: undefined;
  Welcome: { year: string };
};

export type HomeStackParamList = {
  HomeDashboard: undefined;
  SearchResult: { initialQuery?: string } | undefined;
  Notifications: undefined;
  AllCategories: undefined;
  TrendingProjects: undefined;
  PremiumProjects: undefined;
  BestSellers: undefined;
  NewArrivals: undefined;
  LatestJobs: undefined;
  ReferralBanner: undefined;
  OfferBanner: undefined;
  PracticeHub: undefined;
  PracticeProblems: { category?: string } | undefined;
  PracticeProblem: { slug: string; title?: string };
  PracticeCompiler: undefined;
  PracticeSubmissions: undefined;
  PracticeSubmission: { id: string };
  InterviewCategories: undefined;
  InterviewTopics: { categorySlug: string };
  InterviewTopic: { categorySlug: string; topicSlug: string };
};

export type ProjectStackParamList = {
  AllProjects: undefined;
  CategoryProjects: { categoryId: string; categoryName: string };
  SearchProjects: { initialQuery?: string } | undefined;
  FilterProjects: undefined;
  ProjectDetails: { projectId: string };
  ImageGallery: { images: string[]; startIndex?: number };
  VideoPreview: { projectId: string; videoUrl: string; title: string };
  LiveDemo: { projectId: string; demoUrl: string; title: string };
  Reviews: { projectId: string; title: string };
  SimilarProjects: { projectId: string; title: string };
  BuyNow: { projectId: string };
  Payment: { projectId: string };
  PaymentSuccess: { orderId: string };
  PaymentFailed: { orderId: string };
  Wishlist: undefined;
  DownloadProject: { projectId: string };
  MyPurchasedProjects: undefined;
  DownloadHistory: undefined;
};

export type JobStackParamList = {
  JobsDashboard: undefined;
  SearchJobs: { initialQuery?: string } | undefined;
  FilterJobs: undefined;
  CompanyList: undefined;
  CompanyDetails: { companyId: string };
  JobDetails: { jobId: string };
  ResumeUpload: { jobId: string };
  SavedJobs: undefined;
  AppliedJobs: undefined;
  ApplicationStatus: { applicationId: string };
  RecommendedJobs: undefined;
  JobAlerts: undefined;
  RecruiterDetails: { jobId: string };
};

/**
 * The "Learning" tab stack (internal route name "Prep", kept for deep-link
 * stability). Grid → Section → Topic → Content, plus the native mock-test-taking
 * flow (TestInstruction → LiveTest → TestResult → PerformanceAnalysis) that a
 * topic's Mock Test card opens.
 */
export type PlacementStackParamList = {
  PlacementHome: undefined;
  LearningGrids: undefined;
  LearningGrid: { gridSlug: string; gridName?: string };
  LearningTopic: { gridSlug: string; topicSlug: string; topicTitle?: string };
  LearningCodingProblem: { slug: string; title?: string };
  TestInstruction: { testId: string };
  LiveTest: { testId: string };
  TestResult: { attemptId: string };
  PerformanceAnalysis: { attemptId?: string } | undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangeCourse: undefined;
  ChangeBranch: undefined;
  ChangeYear: undefined;
  Wallet: undefined;
  ReferralEarn: undefined;
  PurchaseHistory: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  About: undefined;
  Logout: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Projects: NavigatorScreenParams<ProjectStackParamList>;
  Jobs: NavigatorScreenParams<JobStackParamList>;
  Prep: NavigatorScreenParams<PlacementStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type ResumeStackParamList = {
  ResumeDashboard: undefined;
  ResumeTips: undefined;
  Templates: { resumeId?: string } | undefined;
  ResumeEditor: { resumeId: string };
  SectionEdit: { resumeId: string; blockId: string };
  PersonalDetails: { resumeId: string };
  Education: { resumeId: string };
  Skills: { resumeId: string };
  PreviewResume: { resumeId: string };
  ATSScore: { resumeId: string };
  JdMatch: { resumeId: string };
  ResumeUploadImport: undefined;
  DownloadPDF: { resumeId: string };
  ResumeHistory: undefined;
};

export type CustomProjectsStackParamList = {
  BuilderStart: undefined;
  BuilderType: undefined;
  BuilderLevel: undefined;
  BuilderPlatform: undefined;
  BuilderDetails: undefined;
  BuilderFeatures: undefined;
  BuilderUploads: undefined;
  BuilderEstimate: undefined;
  BuilderPayment: undefined;
  SubmitSuccess: {
    projectType?: "academic" | "personal" | "business";
    requestId: string;
    requestCode: string;
    tokenAmount: number;
    title: string;
    /** Estimated project price at submit time — for the receipt / balance line. */
    estimatedTotal: number;
    /** ISO timestamp of the successful payment. */
    paidAt: string;
  };
  LegalDocument: { docId: LegalDocId };
  SubmitFailed: { message?: string } | undefined;
  MyCustomProjects: undefined;
  CustomProjectDetail: { requestId: string };
};

export type MyProjectsStackParamList = {
  PurchasedProjects: undefined;
  MyProjectDetails: { orderId: string };
  DownloadFiles: { projectId: string };
  UpdateAvailable: { projectId: string };
  Documentation: { projectId: string };
  SourceCode: { projectId: string };
  VersionHistory: { projectId: string };
  Support: undefined;
};

export type ReferralStackParamList = {
  ReferralDashboard: undefined;
  ShareReferral: undefined;
  Earnings: undefined;
  Wallet: undefined;
  ReferralHistory: undefined;
  Leaderboard: undefined;
};

export type PremiumStackParamList = {
  PremiumPlans: undefined;
  PremiumFeatures: undefined;
  PremiumPayment: { planId: string; billingCycle: "monthly" | "yearly" };
  PremiumSuccess: { subscriptionId: string };
  MembershipDetails: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  Theme: undefined;
  Language: undefined;
  Notification: undefined;
  Privacy: undefined;
  Terms: undefined;
  ContactSupport: undefined;
  About: undefined;
  LegalHub: undefined;
  LegalDocument: { docId: LegalDocId };
  Contact: undefined;
  DeleteAccount: undefined;
};

export type DrawerParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ResumeBuilder: NavigatorScreenParams<ResumeStackParamList>;
  MyProjects: NavigatorScreenParams<MyProjectsStackParamList>;
  CustomProjects: NavigatorScreenParams<CustomProjectsStackParamList>;
  Referral: NavigatorScreenParams<ReferralStackParamList>;
  Premium: NavigatorScreenParams<PremiumStackParamList>;
  SettingsModule: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  AuthNavigator: NavigatorScreenParams<AuthStackParamList>;
  ProfileSetupNavigator: NavigatorScreenParams<ProfileSetupStackParamList>;
  MainNavigator: NavigatorScreenParams<DrawerParamList>;
};

declare global {
  namespace ReactNavigation {
    // Must be an `interface … extends` (not a type alias) to merge into
    // React Navigation's global RootParamList. The empty body is the
    // documented pattern, so the no-empty-object-type rule doesn't apply.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
