"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

/**
 * Project preview gallery. The server page still renders `images[0]` as the main
 * shot (progressive enhancement); once hydrated, the thumbnails switch it.
 */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-primary-50">
        {main ? (
          <Image
            key={main}
            src={main}
            alt={title}
            fill
            priority
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
            className="object-cover animate-fade-in"
            sizes="(max-width:1024px) 100vw, 55vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">No preview image</div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.slice(0, 10).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show preview ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-surface transition",
                i === active ? "border-primary" : "border-transparent hover:border-line",
              )}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="20vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Gallery;
