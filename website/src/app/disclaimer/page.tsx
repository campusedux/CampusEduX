export const metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl text-ink">Disclaimer</h1>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-muted">
        <li>CampusEduX does not guarantee that using the platform will result in a job offer, an internship, a placement, or any specific exam or interview outcome.</li>
        <li>Placement preparation content (aptitude, DSA, HR) is practice material, not a certification, and resume ATS scoring is an estimate, not a guarantee that any specific employer&apos;s system will accept a resume.</li>
        <li>Jobs and companies listed are sourced from recruiters and partners; CampusEduX is not the employer for these roles and is not responsible for a third party&apos;s hiring decisions.</li>
        <li>Projects listed in the marketplace are created by their respective sellers; academic integrity and originality requirements at a student&apos;s own institution remain the student&apos;s responsibility.</li>
      </ul>
    </div>
  );
}
