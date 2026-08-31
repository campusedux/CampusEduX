import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface NoteCardData {
  id: string;
  title: string;
  category: string | null;
  topic: string | null;
  is_premium: boolean | null;
}

export function NoteCard({ note, className }: { note: NoteCardData; className?: string }) {
  return (
    <Link
      href={`/placement/notes/${note.id}`}
      className={cn(
        "flex flex-col rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <FileText className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink">{note.title}</h3>
          {note.topic ? <p className="mt-0.5 truncate text-xs text-ink-faint">{note.topic}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {note.category && <Badge tone="neutral">{note.category}</Badge>}
        {note.is_premium && <Badge tone="premium">Premium</Badge>}
      </div>
    </Link>
  );
}

export default NoteCard;
