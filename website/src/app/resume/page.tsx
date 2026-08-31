import Link from "next/link";

export const metadata = { title: "Resume Builder" };

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-serif text-3xl text-navy">Resume Builder</h1>
      <p className="mt-3 text-slate">
        A guided resume builder inside the CampusEduX app: fill in education, projects, skills and experience in structured sections, see an ATS-friendliness score as you go, and export a clean PDF when it&apos;s ready.
      </p>
      <ul className="mt-6 list-disc space-y-1 pl-5 text-slate">
        <li>Guided personal details, education, skills and experience sections</li>
        <li>Live ATS score with a breakdown of what to improve</li>
        <li>Multiple templates to choose from</li>
        <li>PDF export and a history of past downloads</li>
      </ul>
      <Link href="/resume/templates" className="mt-6 inline-block rounded-sm border border-navy px-5 py-2.5 text-sm text-navy hover:bg-navy hover:text-paper">
        View templates
      </Link>
    </div>
  );
}
