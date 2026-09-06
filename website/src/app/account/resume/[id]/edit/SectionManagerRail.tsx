"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, Pencil, Plus, Trash2, User, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { SECTION_TYPE_META, type ResumeContent, type SectionType } from "@/lib/resumeBuilder/content";
import { useDragSort } from "./useDragSort";

const ADD_ORDER: SectionType[] = [
  "summary",
  "objective",
  "experience",
  "internships",
  "education",
  "skills",
  "projects",
  "certifications",
  "achievements",
  "awards",
  "publications",
  "research",
  "volunteer",
  "leadership",
  "languages",
  "interests",
  "coding_profiles",
  "social_links",
  "references",
  "custom",
];

type ActiveId = "personal" | string;

export default function SectionManagerRail({
  content,
  activeId,
  onSelect,
  onReorder,
  onMove,
  onDuplicate,
  onDelete,
  onToggleHide,
  onRename,
  onAdd,
}: {
  content: ResumeContent;
  activeId: ActiveId;
  onSelect: (id: ActiveId) => void;
  onReorder: (fromId: string, toId: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleHide: (id: string) => void;
  onRename: (id: string, heading: string) => void;
  onAdd: (type: SectionType) => void;
}) {
  const { rowProps, draggingId, overId } = useDragSort(onReorder);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  function startRename(id: string, heading: string) {
    setEditingId(id);
    setDraft(heading);
    setTimeout(() => editRef.current?.focus(), 0);
  }
  function commitRename() {
    if (editingId) onRename(editingId, draft.trim() || "Section");
    setEditingId(null);
  }

  return (
    <nav className="space-y-3 lg:sticky lg:top-20 lg:self-start">
      <button
        type="button"
        onClick={() => onSelect("personal")}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition",
          activeId === "personal" ? "bg-primary text-white" : "text-ink hover:bg-surface",
        )}
      >
        <User className="h-4 w-4" aria-hidden />
        Personal Details
      </button>

      <ul className="space-y-1">
        {content.map((block, index) => {
          const isActive = activeId === block.id;
          const isEditing = editingId === block.id;
          return (
            <li
              key={block.id}
              {...rowProps(block.id)}
              className={cn(
                "group rounded-xl border px-1.5 py-1 text-sm transition",
                isActive ? "border-primary/30 bg-primary/10" : "border-transparent hover:bg-surface",
                draggingId === block.id && "opacity-40",
                overId === block.id && draggingId && draggingId !== block.id && "border-primary/50",
              )}
            >
              <div className="flex items-center gap-1">
                <GripVertical className="h-3.5 w-3.5 flex-shrink-0 cursor-grab text-ink-faint" aria-hidden />
                {isEditing ? (
                  <input
                    ref={editRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="min-w-0 flex-1 rounded border border-line px-1.5 py-0.5 text-sm"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(block.id)}
                    className={cn("min-w-0 flex-1 truncate rounded px-1.5 py-1 text-left", isActive ? "font-semibold text-primary" : "text-ink", block.hidden && "text-ink-faint line-through")}
                  >
                    {block.heading}
                  </button>
                )}
              </div>

              <div className="mt-0.5 flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <IconBtn label="Rename" onClick={() => startRename(block.id, block.heading)}>
                  <Pencil className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label={block.hidden ? "Show" : "Hide"} onClick={() => onToggleHide(block.id)}>
                  {block.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </IconBtn>
                <IconBtn label="Duplicate" onClick={() => onDuplicate(block.id)}>
                  <Copy className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(block.id, "up")}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Move down" disabled={index === content.length - 1} onClick={() => onMove(block.id, "down")}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Delete" onClick={() => onDelete(block.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line px-3 py-2 text-sm font-medium text-primary hover:bg-primary-50"
        >
          <Plus className="h-4 w-4" /> Add section
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
            <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-white p-1 shadow-card-lg">
              <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Add a section
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {ADD_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onAdd(type);
                    setMenuOpen(false);
                  }}
                  className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-ink hover:bg-surface"
                >
                  {SECTION_TYPE_META[type].label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded p-1 text-ink-faint hover:bg-white hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
