export const AUTH_ROUTES = {
  ONBOARDING_1: "Onboarding1",
  ONBOARDING_2: "Onboarding2",
  ONBOARDING_3: "Onboarding3",
  LOGIN: "Login",
  REGISTER: "Register",
  FORGOT_PASSWORD: "ForgotPassword",
  OTP_VERIFICATION: "OTPVerification",
  RESET_PASSWORD: "ResetPassword",
} as const;

export const PROFILE_SETUP_ROUTES = {
  SELECT_COURSE: "SelectCourse",
  SELECT_BRANCH: "SelectBranch",
  SELECT_YEAR: "SelectYear",
  WELCOME: "Welcome",
} as const;

export const ROOT_ROUTES = {
  AUTH: "AuthNavigator",
  PROFILE_SETUP: "ProfileSetupNavigator",
  MAIN: "MainNavigator",
} as const;

export const MAIN_TAB_ROUTES = {
  HOME: "Home",
  PROJECTS: "Projects",
  JOBS: "Jobs",
  PREP: "Prep",
  PROFILE: "Profile",
} as const;
