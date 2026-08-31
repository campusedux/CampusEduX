/** Fixture rows for `profiles` and Supabase auth payloads. */

export const profileRow = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "demo@campusedux.app",
  full_name: "Rohan Verma",
  mobile_number: "9999999999",
  avatar_url: null,
  course: "B.Tech",
  branch: "Computer Science Engineering",
  year: "Final Year",
  date_of_birth: null,
  gender: null,
  location: "Bangalore, India",
  is_premium: true,
  referral_code: "ROHAN21",
  created_at: "2025-01-01T00:00:00.000Z",
};

export const authUser = {
  id: profileRow.id,
  email: profileRow.email,
  user_metadata: { full_name: "Rohan Verma", mobile_number: "9999999999" },
};

export const signInSuccess = {
  data: { user: authUser, session: { access_token: "jwt-token", user: authUser } },
  error: null,
};

export const walletTransactionRows = [
  { id: "wt-1", user_id: profileRow.id, type: "credit", category: "added_money", amount: 500, description: "Added Money", created_at: "2025-05-25T00:00:00.000Z" },
  { id: "wt-2", user_id: profileRow.id, type: "debit", category: "project_purchase", amount: 299, description: "Project Purchase", created_at: "2025-05-23T00:00:00.000Z" },
  { id: "wt-3", user_id: profileRow.id, type: "credit", category: "referral_bonus", amount: 200, description: "Referral Bonus", created_at: "2025-05-20T00:00:00.000Z" },
  { id: "wt-4", user_id: profileRow.id, type: "credit", category: "cashback", amount: 50, description: "Cashback", created_at: "2025-05-18T00:00:00.000Z" },
];

export const referralRows = [
  { id: "rf-1", referrer_id: profileRow.id, referred_user_id: "u-2", status: "successful", reward_amount: 100, created_at: "2025-05-25T00:00:00.000Z", completed_at: "2025-05-26T00:00:00.000Z", referred_user: { full_name: "Amit Kumar", email: "amit@e.com" } },
  { id: "rf-2", referrer_id: profileRow.id, referred_user_id: "u-3", status: "successful", reward_amount: 100, created_at: "2025-05-20T00:00:00.000Z", completed_at: "2025-05-21T00:00:00.000Z", referred_user: { full_name: "Neha Singh", email: "neha@e.com" } },
  { id: "rf-3", referrer_id: profileRow.id, referred_user_id: "u-4", status: "pending", reward_amount: 0, created_at: "2025-05-15T00:00:00.000Z", completed_at: null, referred_user: { full_name: "Vikash Patel", email: "vikash@e.com" } },
];
