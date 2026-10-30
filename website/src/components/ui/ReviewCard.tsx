import { Rating } from "./Rating";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ReviewCardData = {
  id: string;
  author_name?: string | null;
  rating: number;
  comment?: string | null;
  created_at?: string | null;
};

/** Single review — initial avatar + name + stars + relative date + body. */
export function ReviewCard({ review, className }: { review: ReviewCardData; className?: string }) {
  const name = review.author_name?.trim() || "Student";
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={cn("card card-pad", className)}>
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{name}</div>
          <Rating value={review.rating} size={12} showCount={false} />
        </div>
        {review.created_at && <span className="text-xs text-ink-faint">{timeAgo(review.created_at)}</span>}
      </div>
      {review.comment && <p className="mt-3 text-sm text-ink-muted">{review.comment}</p>}
    </div>
  );
}

export default ReviewCard;
