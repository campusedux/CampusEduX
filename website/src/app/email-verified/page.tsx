import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Email verification",
  robots: { index: false, follow: false },
};

type Status = "success" | "already-verified" | "error";

function normalizeStatus(value: string | string[] | undefined): Status {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "success" || raw === "already-verified" ? raw : "error";
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-line bg-card p-6 text-center shadow-card sm:p-8">
        {children}
      </div>
    </div>
  );
}

export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = normalizeStatus(searchParams.status);
  // The "Continue" CTA should land signed-in users on their account and
  // everyone else on sign-in — this page never forces a redirect itself, so
  // the success message is always seen first.
  const user = await getAuthUser();
  const continueHref = user ? "/account" : "/login";

  if (status === "error") {
    return (
      <Shell>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <XCircle className="h-8 w-8 text-danger" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink">Email Verification Failed</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          The verification link is invalid or has expired. Request a new one by signing in, or head back to
          CampusEduX.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Button href="/login" fullWidth>
            Sign In
          </Button>
          <Button href="/" variant="ghost" fullWidth>
            Back to CampusEduX
          </Button>
        </div>
      </Shell>
    );
  }

  const isAlready = status === "already-verified";

  return (
    <Shell>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
        <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-ink">
        {isAlready ? "Email Already Verified" : "Email Verified Successfully!"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {isAlready
          ? "Your email address has already been verified."
          : "Your email address has been verified successfully. Your CampusEduX account is now ready to use."}
      </p>
      <div className="mt-6">
        <Button href={continueHref} fullWidth>
          Continue to CampusEduX
        </Button>
      </div>
    </Shell>
  );
}
