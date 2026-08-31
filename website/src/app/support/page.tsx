import Link from "next/link";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl text-ink">Support</h1>
      <p className="mt-4 text-ink-muted">Most questions are answered in the FAQ. For anything account-specific, contact the team directly.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/faq" className="rounded-lg border border-line px-5 py-2.5 text-sm text-ink hover:bg-primary hover:text-white">Browse FAQ</Link>
        <Link href="/contact" className="rounded-lg bg-primary px-5 py-2.5 text-sm text-white hover:bg-primary/90">Contact us</Link>
      </div>
    </div>
  );
}
