import type { Metadata } from "next";
import ForgotPasswordView from "./ForgotPasswordView";

// Transactional auth page — never worth ranking, but still worth following
// for internal link discovery (it links to /login).
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
