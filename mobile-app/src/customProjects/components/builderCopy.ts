import type { CustomProjectLevel, CustomProjectsStackParamList, CustomProjectType } from "@/types";

export const TOTAL_STEPS = 8;

export const BUILDER_STEPS: { step: number; name: string; route: keyof CustomProjectsStackParamList }[] = [
  { step: 1, name: "Project type", route: "BuilderType" },
  { step: 2, name: "Level", route: "BuilderLevel" },
  { step: 3, name: "Platform", route: "BuilderPlatform" },
  { step: 4, name: "Details", route: "BuilderDetails" },
  { step: 5, name: "Features", route: "BuilderFeatures" },
  { step: 6, name: "Uploads", route: "BuilderUploads" },
  { step: 7, name: "Estimate", route: "BuilderEstimate" },
  { step: 8, name: "Payment", route: "BuilderPayment" },
];

export const stepName = (step: number): string => BUILDER_STEPS.find((s) => s.step === step)?.name ?? "";

export const TYPE_LABEL: Record<CustomProjectType, string> = {
  academic: "Mentoring",
  personal: "Personal",
  business: "Business",
};

export const LEVEL_LABEL: Record<CustomProjectLevel, string> = {
  standard: "Standard",
  advanced: "Advanced",
};

/**
 * Where the balance (estimated price − token) is paid. Balance payment is not
 * built yet, so this is display-only. TODO(owner): replace with the confirmed schedule.
 */
export const BALANCE_TIMING_TEXT = "The balance is payable later, on the schedule agreed with our team.";

export const CUSTOM_REQUIREMENTS_NOTE =
  "Your custom requirements will be reviewed; if they change the price, we'll confirm with you before starting work.";

/** One glossary so every screen explains a term the same way. */
export const TERMS = {
  basePrice: {
    label: "Base price",
    text: "The starting price of your project. It depends on the project type and level (Standard or Advanced) and already covers every included feature.",
  },
  included: {
    label: "Included features",
    text: "Features that come with your project at no extra cost. They are part of the base price and can't be removed or charged separately.",
  },
  addOn: {
    label: "Add-on features",
    text: "Optional extra features. Each add-on adds its listed price to your estimated project price.",
  },
  token: {
    label: "Token amount",
    text: "The part of the price you pay now to submit your request. It is fixed for each project type (it does not change with level or features) and is deducted from the estimated project price.",
  },
  platform: {
    label: "Platform charges",
    text: "An extra charge for the platforms your project must run on (Web, Android, iOS). Web-only has no extra charge.",
  },
  level: {
    label: "Level",
    text: "Standard covers the core features of your project type. Advanced has a higher base price and unlocks more capabilities.",
  },
  balance: {
    label: "Balance payable later",
    text: "What is left of the estimated project price after the token: estimated project price minus token amount.",
  },
  estimate: {
    label: "Estimated project price",
    text: "Base price + add-ons + platform charges. Included features are free.",
  },
} as const;

export const TITLE_MIN = 5;

const GENERIC_TITLES = [
  "application", "app", "project", "website", "web app", "mobile app", "system", "software",
  "my project", "my app", "test", "demo", "management system", "web application",
];

export function isGenericTitle(title: string): boolean {
  return GENERIC_TITLES.includes(title.trim().toLowerCase());
}
