export type AppTheme = "light" | "dark" | "system";

export interface AppLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export interface AppPreferences {
  theme: AppTheme;
  accentColor: string;
  useAmoledDark: boolean;
  reduceAnimations: boolean;
  languageCode: string;
  hasAgreedToTerms: boolean;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  promotions: boolean;
  jobAlerts: boolean;
  applicationUpdates: boolean;
  messageAlerts: boolean;
  newsUpdates: boolean;
}

export interface BlockedUser {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  blockedAt: string;
}
