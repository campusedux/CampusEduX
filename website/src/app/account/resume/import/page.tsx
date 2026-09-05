import Link from "next/link";
import { requireUser } from "@/lib/auth";
import ImportWizard from "./ImportWizard";

export default async function ResumeImportPage() {
  await requireUser();

  return (
    <div className="container-prose py-12">
      <Link href="/account/resume" className="text-sm text-ink-muted hover:text-ink">
        &larr; Back to your resumes
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-ink">Import an existing resume</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Upload a PDF or DOCX resume. We&apos;ll extract what we can — review and edit everything before it&apos;s saved.
        This always creates a new resume; it never changes one you already have.
      </p>

      <ImportWizard />
    </div>
  );
}
