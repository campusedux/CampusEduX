import Link from "next/link";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Support</h1>
      <p className="mt-4 text-slate">Most questions are answered in the FAQ. For anything account-specific, contact the team directly.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/faq" className="rounded-sm border border-navy px-5 py-2.5 text-sm text-navy hover:bg-navy hover:text-paper">Browse FAQ</Link>
        <Link href="/contact" className="rounded-sm bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy/90">Contact us</Link>
      </div>
    </div>
  );
}
