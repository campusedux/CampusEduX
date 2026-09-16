import type { Metadata } from "next";
import ResetPasswordView from "./ResetPasswordView";

// Transactional auth page — never worth ranking, but still worth following
// for internal link discovery (it links to /forgot-password, /login).
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
