import Image from "next/image";
import { cn } from "@/lib/cn";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

/**
 * One blog image. Two paths:
 *  • SVG (the seeded illustrations in `/public/blog/*.svg`) — resolution-
 *    independent and already tiny, so a plain lazy `<img>` is optimal and needs
 *    no `next.config` SVG allowance.
 *  • Raster (admin-uploaded JPG/PNG/WebP on Supabase Storage) — `next/image`,
 *    so the browser gets a resized AVIF/WebP and a blur-up placeholder.
 * Either way the wrapper owns the aspect ratio, so there is no layout shift.
 */
export function BlogImage({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 720px, 100vw",
  className,
  imgClassName,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
}) {
  const isSvg = /\.svg(\?|$)/i.test(src);
  return (
    <div className={cn("relative overflow-hidden bg-primary-50", className)}>
      {isSvg ? (
        // eslint-disable-next-line @next/next/no-img-element -- SVG: no optimizer benefit, avoids the next.config SVG allowance
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          placeholder="blur"
          blurDataURL={IMAGE_BLUR_DATA_URL}
          className={cn("object-cover", imgClassName)}
        />
      )}
    </div>
  );
}

export default BlogImage;
