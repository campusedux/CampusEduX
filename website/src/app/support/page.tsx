import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { WhatsAppSupport } from "@/components/support/WhatsAppSupport";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Support",
  alternates: { canonical: absoluteUrl("/support") },
};

export default function SupportPage() {
  return (
    <div className="page-shell-narrow">
      <h1 className="text-3xl font-bold text-ink">Support</h1>
      <p className="mt-4 text-ink-muted">Most questions are answered in the FAQ. For anything account-specific, contact the team directly — by email, or on WhatsApp for a quick chat.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="/faq" variant="ghost">Browse FAQ</Button>
        <Button href="/contact">Contact us</Button>
        <WhatsAppSupport />
        <Button href="/legal" variant="ghost">Legal &amp; policies</Button>
      </div>
    </div>
  );
}
