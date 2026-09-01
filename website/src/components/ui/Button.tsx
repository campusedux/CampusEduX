import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * CTA button — mirrors `mobile-app/src/components/ui/Button.tsx`.
 * `primary` solid indigo · `secondary` indigo-tint · `ghost` bordered ·
 * `danger` solid red · `text` link-style. Renders an `<a>` (next/link) when
 * `href` is set, otherwise a `<button>`.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "text";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-600",
  secondary: "bg-primary-50 text-primary hover:bg-primary-100",
  ghost: "border border-line bg-white text-ink hover:bg-surface",
  danger: "bg-danger text-white hover:bg-danger/90",
  text: "bg-transparent text-primary hover:text-primary-700 px-0",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[0.8rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

type AsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
type AsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

export function Button(props: AsButton | AsLink) {
  const {
    variant = "primary",
    size = "md",
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    loading = false,
    fullWidth = false,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.98] disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none motion-reduce:transform-none",
    VARIANT[variant],
    SIZE[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        LeftIcon && <LeftIcon className="h-4 w-4" aria-hidden />
      )}
      <span>{children}</span>
      {RightIcon && !loading && <RightIcon className="h-4 w-4" aria-hidden />}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  const { disabled, ...buttonRest } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} disabled={disabled || loading} {...buttonRest}>
      {content}
    </button>
  );
}

export default Button;
