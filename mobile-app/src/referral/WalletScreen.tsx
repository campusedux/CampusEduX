// Referral module's "Wallet" screen (screen 4) shows the exact same wallet
// as Module 8 (Profile) — there's only one wallet per user — so this
// re-exports it rather than duplicating the balance/top-up/withdraw logic.
export { WalletScreen, default } from "@/profile/WalletScreen";
