import { cn } from "@/lib/cn";

const SIZE = { sm: "h-8 w-8 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-lg" } as const;
const PX = { sm: 32, md: 36, lg: 56 } as const;

/**
 * Round user avatar — photo when there is one, otherwise the initial on the
 * brand gradient. Raw <img> on purpose: avatar hosts (Google / GitHub /
 * Supabase) are not in next.config `remotePatterns`; the box is fixed-size so
 * there is no layout shift.
 */
export function Avatar({
  src,
  name,
  size = "md",
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const initial = (name?.trim()[0] || "C").toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent-violet font-bold text-white",
        SIZE[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={PX[size]}
          height={PX[size]}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );
}

export default Avatar;
