import { cn } from "@/lib/cn";

/**
 * Standard page-title block — a small uppercase eyebrow, an <h1>, and an
 * optional muted description. Presentation only; pages keep their own data and
 * layout around it. Use on list / landing pages so the title rhythm is
 * identical across Projects / Jobs / Learning / Resume / Premium.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      )}
      <h1 className={cn("text-3xl font-bold tracking-tight text-ink", eyebrow && "mt-2")}>{title}</h1>
      {description && <p className="mt-2 text-ink-muted">{description}</p>}
      {children}
    </div>
  );
}

export default PageHeader;
