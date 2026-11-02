"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Dashed drag-and-drop area over a plain file input — presentation only. Every
 * drop or pick is forwarded to `onFiles` as a FileList, which the caller
 * passes straight into the existing upload handler (same validation, same
 * storage upload, same draft state as before this redesign).
 */
export function Dropzone({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  label = "Drag & drop files here or",
  buttonLabel = "Choose files",
  hint,
}: {
  onFiles: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  buttonLabel?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center min-h-[120px] gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-center transition",
        dragging ? "border-primary bg-primary-50/60" : "border-line bg-surface",
        disabled && "opacity-60",
      )}
    >
      <UploadCloud className={cn("h-6 w-6", dragging ? "text-primary" : "text-ink-faint")} aria-hidden />
      <p className="text-sm text-ink-muted">
        {label}{" "}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="font-semibold text-primary underline underline-offset-2 disabled:opacity-60"
        >
          {buttonLabel}
        </button>
      </p>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}

export default Dropzone;
