import type { Metadata } from "next";
import LoginView from "./LoginView";

// Transactional auth page — never worth ranking, but still worth following
// for internal link discovery (it links to /register, /forgot-password).
export const metadata: Metadata = { title: "Log In", robots: { index: false, follow: true } };

export default function LoginPage() {
  return <LoginView />;
}
