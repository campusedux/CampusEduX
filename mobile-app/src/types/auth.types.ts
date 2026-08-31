export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  avatarUrl?: string | null;
  course?: string | null;
  branch?: string | null;
  year?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  location?: string | null;
  isPremium: boolean;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedProfileSetup: boolean;
}

export interface LoginPayload {
  identifier: string; // email or mobile
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

export interface OTPVerificationParams {
  context: "register" | "forgot-password";
  identifier: string;
}
