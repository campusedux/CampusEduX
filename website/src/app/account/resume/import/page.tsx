import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import ImportWizard from "./ImportWizard";

export default async function ResumeImportPage() {
  await requireUser();

  return (
    <div className="max-w-3xl">
      <Link href="/resume" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Your résumés
      </Link>
      <h1 className="mt-3 font-display text-[1.6rem] font-bold tracking-tight text-ink">Import an existing resume</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Upload a PDF or DOCX resume. We&apos;ll extract what we can — review and edit everything before it&apos;s saved.
        This always creates a new resume; it never changes one you already have.
      </p>

      <ImportWizard />
    </div>
  );
}
