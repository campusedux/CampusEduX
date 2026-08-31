/** Pure constants — safe for client components. */

export const BANNER_PLACEMENTS = ['home', 'offer', 'referral', 'placement', 'jobs', 'popup'] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const BANNER_PLACEMENT_LABEL: Record<string, string> = {
  home: 'Home Banner',
  offer: 'Offer Banner',
  referral: 'Referral Banner',
  placement: 'Placement Banner',
  jobs: 'Jobs Banner',
  popup: 'Popup Banner',
};

export const AUDIENCES = [
  { value: 'all', label: 'All students' },
  { value: 'premium', label: 'Premium only' },
  { value: 'free', label: 'Free only' },
] as const;

export const DISPLAY_ON_PAGES = ['home', 'projects', 'jobs', 'placement', 'resume', 'referral', 'premium', 'profile'] as const;

export const PUSH_CATEGORIES = ['updates', 'offers', 'messages'] as const;

export const FAQ_CATEGORIES = ['General', 'Projects', 'Payments', 'Jobs', 'Placement', 'Account', 'Refunds'] as const;
