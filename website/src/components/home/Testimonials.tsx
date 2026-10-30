import { Quote } from "lucide-react";
import { Rating, SectionHeader } from "@/components/ui";

export interface TestimonialRow {
  id: string;
  author_name: string;
  author_role: string | null;
  quote: string;
  rating: number;
}

/** Home "Success stories" — admin-managed `testimonials` rows only; nothing when empty. */
export function Testimonials({ items }: { items: TestimonialRow[] }) {
  if (items.length === 0) return null;
  return (
    <section className="container-page pt-10 md:pt-14" aria-labelledby="home-testimonials-title">
      <SectionHeader id="home-testimonials-title" eyebrow="Success stories" title="What students say" />
      <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((t) => (
          <figure key={t.id} className="card relative flex min-w-0 flex-col p-4">
            <Quote aria-hidden className="absolute right-5 top-5 h-8 w-8 text-primary/15" />
            {t.rating > 0 && <Rating value={t.rating} showCount={false} />}
            <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-ink">“{t.quote}”</blockquote>
            <figcaption className="mt-3 flex items-center gap-3 border-t border-line pt-3">
              <span
                aria-hidden
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-violet text-sm font-bold text-white"
              >
                {t.author_name.trim().charAt(0).toUpperCase() || "S"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{t.author_name}</span>
                {t.author_role && <span className="block truncate text-xs text-ink-muted">{t.author_role}</span>}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
