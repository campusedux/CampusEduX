import type { Metadata } from "next";
import RegisterView from "./RegisterView";

// Transactional auth page — never worth ranking, but still worth following
// for internal link discovery (it links to /login, /terms, /privacy-policy).
export const metadata: Metadata = { title: "Create Account", robots: { index: false, follow: true } };

export default function RegisterPage() {
  return <RegisterView />;
}
