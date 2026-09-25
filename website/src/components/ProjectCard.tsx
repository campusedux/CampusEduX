import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Box, Gem, Sparkles, Trophy } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { cn } from "@/lib/cn";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

export type ProjectCardData = {
  id: string;
  title: string;
  category_name: string | null;
  tech_stack: string[] | null;
  price: number;
  original_price?: number | null;
  rating: number;
  review_count: number;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_best_seller: boolean;
};

/**
 * Marketplace project card: thumbnail (or a tinted placeholder), category +
 * Premium / Bestseller badges, title, up to three tech tags, rating only when
 * real reviews exist, and the price — or a Free badge for ₹0.
 */
export function ProjectCard({ project, rank, className }: { project: ProjectCardData; rank?: number; className?: string }) {
  const tags = (project.tech_stack ?? []).filter(Boolean);
  const free = !(project.price > 0);

  return (
    <Link href={`/projects/${project.id}`} className={cn("card card-hover group flex flex-col overflow-hidden", className)}>
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 to-surface">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.title}
            fill
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          />
        ) : (
          <>
            <span aria-hidden className="bg-grid absolute inset-0 opacity-70" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-card shadow-card">
              {project.is_premium ? <Gem className="h-6 w-6 text-primary" aria-hidden /> : <Box className="h-6 w-6 text-primary" aria-hidden />}
            </span>
          </>
        )}

        {typeof rank === "number" && (
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-warning to-accent-pink text-xs font-bold text-white shadow-card">
            #{rank}
          </span>
        )}
        <span className="absolute right-3 top-3 flex gap-1.5">
          {project.is_premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-scrim/75 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white backdrop-blur">
              <Sparkles className="h-3 w-3" aria-hidden /> Premium
            </span>
          )}
          {project.is_best_seller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-scrim/75 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white backdrop-blur">
              <Trophy className="h-3 w-3" aria-hidden /> Bestseller
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {project.category_name && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{project.category_name}</p>
        )}
        <h3 className="mt-1 line-clamp-2 font-display text-[1.05rem] font-bold leading-snug tracking-tight text-ink group-hover:text-primary">
          {project.title}
        </h3>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                {t}
              </span>
            ))}
            {tags.length > 3 && <span className="px-1 py-0.5 text-[11px] font-medium text-ink-faint">+{tags.length - 3}</span>}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {project.review_count > 0 ? <Rating value={project.rating} count={project.review_count} size={13} /> : <span />}
          <span className="flex items-center gap-2">
            {free ? (
              <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-success">Free</span>
            ) : (
              <PriceDisplay price={project.price} originalPrice={project.original_price} size="md" />
            )}
            <ArrowUpRight
              className="h-4 w-4 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
