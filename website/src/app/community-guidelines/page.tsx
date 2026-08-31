export const metadata = { title: "Community Guidelines" };

export default function CommunityGuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl text-ink">Community Guidelines</h1>
      <p className="mt-4 text-ink-muted">CampusEduX exists for genuine student projects, reviews and job activity. To keep it useful for everyone:</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-muted">
        <li>Reviews should reflect real experience with a project — the platform supports one review per purchased project per user, and moderates reported reviews from the admin panel.</li>
        <li>Do not upload content you do not have the right to distribute.</li>
        <li>Do not impersonate a company, recruiter or another student.</li>
        <li>Referral invitations should go to real, interested students — not be used to game the reward system.</li>
        <li>Harassment, spam and scam attempts toward other students or recruiters are not allowed.</li>
      </ul>
      <div className="empty-state mt-8">
        MANUAL IMPLEMENTATION / BUSINESS DECISION REQUIRED — enforcement details (how reports are handled, suspension/ban
        process, appeal process) should be confirmed against the actual admin panel moderation workflow (Reviews →
        review_reports) before being stated here as policy.
      </div>
    </div>
  );
}
