import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
import { LEGAL } from "@/legal/config";

const DESCRIPTION =
  "CampusEduX brings together the project marketplace, jobs & internships, learning resources, a resume builder and custom project development — all in one app, backed by one account.";

export const metadata: Metadata = {
  title: "About CampusEduX",
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/about") },
};

export default function AboutPage() {
  return (
    <div className="page-shell-narrow">
      <h1 className="text-3xl font-bold text-ink">About CampusEduX</h1>
      <p className="mt-3 text-ink-muted">
        CampusEduX brings together the tools a student needs across a college career: a project marketplace to buy, sell
        or find final-year and mini projects; a jobs and internships board; structured learning resources and tutorials;
        a guided resume builder; custom project development; and a referral program — all in one app, backed by one
        account.
      </p>
      <p className="mt-4 text-ink-muted">
        The platform is available as this website and as a companion mobile app, sharing one account so your projects,
        applications, resumes and wallet stay in sync wherever you use it.
      </p>

      <h2 className="mt-8 text-xl font-bold text-ink">Who it&apos;s for</h2>
      <p className="mt-3 text-ink-muted">
        CampusEduX is built for college students — from browsing and buying ready-made final-year and mini projects, to
        preparing for placements, to building a resume for internship and job applications.
      </p>

      <h2 className="mt-8 text-xl font-bold text-ink">What you can do here</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-muted">
        <li>
          Browse the <Link href="/projects" className="font-medium text-primary hover:underline">project marketplace</Link>{" "}
          for final-year and mini project source code, or request a{" "}
          <Link href="/custom-projects" className="font-medium text-primary hover:underline">custom-built project</Link>.
        </li>
        <li>
          Search <Link href="/jobs" className="font-medium text-primary hover:underline">jobs and internships</Link> from
          companies hiring students and freshers.
        </li>
        <li>
          Work through structured{" "}
          <Link href="/learning" className="font-medium text-primary hover:underline">tutorials, notes and mock tests</Link>{" "}
          and practice with{" "}
          <Link href="/practice" className="font-medium text-primary hover:underline">coding problems and interview questions</Link>.
        </li>
        <li>
          Build and export a resume with the{" "}
          <Link href="/resume" className="font-medium text-primary hover:underline">guided resume builder</Link>, including
          ATS scoring and job-description matching.
        </li>
        <li>
          Run and test code directly in the browser with the{" "}
          <Link href="/compiler" className="font-medium text-primary hover:underline">online compiler</Link>.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-bold text-ink">Operator and contact</h2>
      <p className="mt-3 text-ink-muted">
        CampusEduX is operated by {LEGAL.entityDescription}. For support, privacy, legal or grievance matters, see the{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">Contact</Link> page or the full{" "}
        <Link href="/legal" className="font-medium text-primary hover:underline">Legal &amp; Privacy</Link> policies.
      </p>
    </div>
  );
}
