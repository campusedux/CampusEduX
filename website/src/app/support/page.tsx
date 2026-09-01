import { Button } from "@/components/ui";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl font-bold text-ink">Support</h1>
      <p className="mt-4 text-ink-muted">Most questions are answered in the FAQ. For anything account-specific, contact the team directly.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="/faq" variant="ghost">Browse FAQ</Button>
        <Button href="/contact">Contact us</Button>
      </div>
    </div>
  );
}
