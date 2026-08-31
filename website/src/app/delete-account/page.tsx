export const metadata = { title: "Delete Account" };

export default function DeleteAccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl text-ink">Delete Your Account</h1>
      <p className="mt-4 text-ink-muted">
        Account deletion is a real, working action inside the app — go to <strong>Settings → Delete Account</strong> while
        signed in. This is not a support-ticket workaround.
      </p>

      <h2 className="mt-8 text-lg text-ink">What happens when you delete your account</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
        <li>Your wallet transaction history, wallet top-up orders and referral earnings records tied to your account are removed.</li>
        <li>Your premium subscription record, notifications and notification preferences are removed.</li>
        <li>Your test attempts and DSA progress, saved/favourite questions and preferences are removed.</li>
        <li>Your resumes — both uploaded PDF resumes and resume-builder documents — and their download history are removed.</li>
        <li>Your job applications, saved jobs and job alerts are removed.</li>
        <li>Your project downloads, reviews, wishlist and purchase records are removed.</li>
        <li>Files in your personal storage folders (avatar, resumes) are deleted.</li>
        <li>Your account itself is then permanently removed and you can no longer sign in with it.</li>
      </ul>

      <p className="mt-6 text-sm text-ink-muted">
        This runs as a single authenticated action tied to your own session — one account can only delete itself, never another
        student&apos;s account.
      </p>

      <div className="empty-state mt-8">
        MANUAL IMPLEMENTATION / BUSINESS DECISION REQUIRED — confirm with the owner whether any data must be retained beyond
        deletion for legal, tax or fraud-prevention reasons (e.g. payment records required by Razorpay/Indian tax law), and
        state that retention period explicitly here rather than implying full erasure if that is not entirely accurate.
      </div>
    </div>
  );
}
