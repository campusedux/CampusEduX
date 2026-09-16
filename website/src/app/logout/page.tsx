import type { Metadata } from "next";
import LogoutView from "./LogoutView";

// Transactional auth page — never worth ranking, but still worth following
// for internal link discovery.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function LogoutPage() {
  return <LogoutView />;
}
