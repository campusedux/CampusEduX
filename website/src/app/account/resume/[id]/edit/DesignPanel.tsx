"use client";

import { useState } from "react";
import { Palette, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  ACCENT_SWATCHES,
  DESIGN_FONT_LABELS,
  DESIGN_HEADING_LABELS,
  DESIGN_MARGIN_LABELS,
  DESIGN_SIZE_LABELS,
  DESIGN_SPACING_LABELS,
  isEmptyDesign,
  type DesignFontFamily,
  type DesignHeading,
  type DesignMargin,
  type DesignSize,
  type DesignSpacing,
  type ResumeDesign,
} from "@/lib/resumeBuilder/design";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function Row<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? undefined : opt)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
              value === opt ? "border-primary bg-primary text-white" : "border-line bg-white text-ink-muted hover:border-primary/40",
            )}
          >
            {labels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DesignPanel({ design, onChange }: { design: ResumeDesign; onChange: (next: ResumeDesign) => void }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(design.accentColor ?? "");

  const set = <K extends keyof ResumeDesign>(key: K, value: ResumeDesign[K] | undefined) => {
    const next = { ...design };
    if (value == null) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("inline-flex items-center gap-1.5 text-sm font-semibold hover:underline", isEmptyDesign(design) ? "text-primary" : "text-primary")}
      >
        <Palette className="h-3.5 w-3.5" /> Design{!isEmptyDesign(design) && " •"}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Design">
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Accent colour</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {ACCENT_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Accent ${c}`}
                  onClick={() => {
                    setHex(c);
                    set("accentColor", c);
                  }}
                  className={cn("h-7 w-7 rounded-full border-2", design.accentColor === c ? "border-ink" : "border-white shadow-card")}
                  style={{ background: c }}
                />
              ))}
              <input
                value={hex}
                onChange={(e) => {
                  const v = e.target.value;
                  setHex(v);
                  if (HEX_RE.test(v)) set("accentColor", v);
                  else if (v === "") set("accentColor", undefined);
                }}
                placeholder="#4F39F6"
                className="h-8 w-24 rounded-lg border border-line px-2 text-xs"
              />
            </div>
          </div>

          <Row<DesignFontFamily>
            label="Font"
            value={design.fontFamily}
            options={["sans", "serif", "slab"]}
            labels={DESIGN_FONT_LABELS}
            onChange={(v) => set("fontFamily", v)}
          />
          <Row<DesignSize> label="Font size" value={design.size} options={["s", "m", "l"]} labels={DESIGN_SIZE_LABELS} onChange={(v) => set("size", v)} />
          <Row<DesignSpacing>
            label="Spacing"
            value={design.spacing}
            options={["compact", "normal", "relaxed"]}
            labels={DESIGN_SPACING_LABELS}
            onChange={(v) => set("spacing", v)}
          />
          <Row<DesignMargin> label="Margins" value={design.margin} options={["narrow", "normal", "wide"]} labels={DESIGN_MARGIN_LABELS} onChange={(v) => set("margin", v)} />
          <Row<DesignHeading>
            label="Heading style"
            value={design.headingStyle}
            options={["template", "rule", "full-underline", "plain-caps", "bar"]}
            labels={DESIGN_HEADING_LABELS}
            onChange={(v) => set("headingStyle", v)}
          />

          <p className="text-xs text-ink-faint">
            Font size and margins are clamped so the résumé stays ATS-readable no matter what you pick.
          </p>

          <button
            type="button"
            onClick={() => {
              setHex("");
              onChange({});
            }}
            disabled={isEmptyDesign(design)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted hover:bg-surface disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset design
          </button>
        </div>
      </Modal>
    </>
  );
}
