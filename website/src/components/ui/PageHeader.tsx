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
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1
        className={cn(
          "text-[1.75rem] font-bold leading-tight tracking-tight text-ink sm:text-3xl",
          eyebrow && "mt-2.5",
        )}
      >
        {title}
      </h1>
      {description && <p className="lede mt-3">{description}</p>}
      {children}
    </div>
  );
}

export default PageHeader;
