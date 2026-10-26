import Link from "next/link";
import { whatsAppSupportUrl } from "@/lib/whatsapp";

/** Text-based replacement for the former artwork, which advertised completed academic projects. */
export function CustomProjectBanner() {
  return (
    <section className="rounded-2xl border border-line bg-card px-6 py-8 shadow-card sm:px-10 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Project help
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold text-ink">
        Learn with a mentor or commission software
      </h2>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Students can get code review, debugging help, architecture guidance and
        feedback on work they author. Personal and business customers can
        request complete software development.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/custom-projects/start" className="btn-primary">
          Explore project options
        </Link>
        <a
          href={whatsAppSupportUrl(
            "Hello CampusEduX, I would like project mentoring, code review or debugging help on work I author. I understand you do not complete assessed work for students.",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Ask about mentoring
        </a>
      </div>
    </section>
  );
}

export default CustomProjectBanner;
