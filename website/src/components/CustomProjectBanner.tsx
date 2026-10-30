import Link from "next/link";
import { Wrench } from "lucide-react";
import { whatsAppSupportUrl } from "@/lib/whatsapp";

/** Compact project help; retain the scope and both existing destinations. */
export function CustomProjectBanner() {
  return (
    <section className="card px-3 sm:px-5" aria-label="Project help">
      <div className="flex min-h-[76px] min-w-0 items-center gap-3">
        <Wrench className="h-5 w-5 shrink-0 text-orange-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-5 text-ink">Project help</h2>
          <details className="group relative text-xs text-ink-muted">
            <summary className="hit-44 w-fit cursor-pointer rounded leading-5 hover:text-ink">Mentoring &amp; software</summary>
            <div className="pb-3 pt-2 text-sm leading-5">
              <p>Students can get code review, debugging help, architecture guidance and feedback on work they author. Personal and business customers can request complete software development.</p>
              <a
                href={whatsAppSupportUrl("Hello CampusEduX, I would like project mentoring, code review or debugging help on work I author. I understand you do not complete assessed work for students.")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex min-h-11 items-center font-medium text-ink hover:underline"
              >Ask about mentoring</a>
            </div>
          </details>
        </div>
        <Link href="/custom-projects/start" className="btn-primary shrink-0 px-3 text-xs">Get help</Link>
      </div>
    </section>
  );
}

export default CustomProjectBanner;
