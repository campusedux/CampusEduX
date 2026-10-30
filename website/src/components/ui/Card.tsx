import Link from "next/link";
import { cn } from "@/lib/cn";

type Padding = "none" | "sm" | "md" | "lg";
const PADDING: Record<Padding, string> = { none: "", sm: "p-4", md: "card-pad", lg: "p-5 md:p-6" };

/**
 * Raised surface — the `.card` recipe as a component. Pass `href` to make the
 * whole card a link (adds the shared hover lift); `interactive` adds the lift
 * to a non-link card that wraps its own button.
 */
export function Card({
  href,
  padding = "md",
  interactive = false,
  className,
  children,
  ...rest
}: {
  href?: string;
  padding?: Padding;
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const classes = cn("card block", PADDING[padding], (href || interactive) && "card-hover", className);
  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }
  return (
    <div className={classes} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  );
}

export default Card;
