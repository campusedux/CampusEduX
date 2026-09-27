"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Field, Input, Textarea, toast } from "@/components/ui";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { resolveUploadContentType, withContentType } from "@/lib/uploads";
import { CP_DOC_TYPES, CP_MAX_FILE_BYTES, CP_MAX_FILE_MB, CP_UPLOADS_BUCKET } from "@/lib/customProjects";
import {
  addCustomProjectAttachmentAction,
  removeCustomProjectAttachmentAction,
  updateCustomProjectRequestAction,
} from "@/lib/actions/customProjects";

export type EditableRequest = {
  title: string;
  objective: string;
  problem_statement: string;
  description: string;
  target_users: string;
  technology_preference: string;
  custom_requirements: string[];
  deadline: string | null;
};

type Attachment = { id: string; name: string; sizeMb: number };

const TEXT_FIELDS: { key: keyof Omit<EditableRequest, "custom_requirements" | "deadline">; label: string; max: number; rows?: number }[] = [
  { key: "title", label: "Title", max: 200 },
  { key: "objective", label: "Objective", max: 5000, rows: 3 },
  { key: "problem_statement", label: "Problem statement", max: 5000, rows: 3 },
  { key: "description", label: "Description", max: 10000, rows: 5 },
  { key: "target_users", label: "Target users", max: 2000, rows: 2 },
  { key: "technology_preference", label: "Tech stack", max: 500 },
];

/**
 * Owner-side "Edit request" (only rendered while the request is still 'new' — the RPC enforces the same
 * lock). The project value is deliberately not a field here: only an admin can change it.
 */
export default function EditRequestPanel({
  requestId,
  userId,
  initial,
  attachments,
}: {
  requestId: string;
  userId: string;
  initial: EditableRequest;
  attachments: Attachment[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EditableRequest>(initial);
  const [pending, start] = useTransition();
  const [fileBusy, setFileBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  function changedFields(): Partial<EditableRequest> {
    const out: Partial<EditableRequest> = {};
    for (const f of TEXT_FIELDS) if (form[f.key].trim() !== initial[f.key].trim()) out[f.key] = form[f.key];
    const reqs = form.custom_requirements.map((r) => r.trim()).filter(Boolean);
    if (JSON.stringify(reqs) !== JSON.stringify(initial.custom_requirements)) out.custom_requirements = reqs;
    if ((form.deadline || null) !== (initial.deadline || null)) out.deadline = form.deadline || null;
    return out;
  }

  function save() {
    const changes = changedFields();
    if (Object.keys(changes).length === 0) {
      setOpen(false);
      return;
    }
    start(async () => {
      const res = await updateCustomProjectRequestAction({ requestId, changes });
      if ("error" in res) {
        toast({ title: "Could not save", description: res.error, tone: "error" });
        return;
      }
      toast({ title: "Request updated", description: "The team has been notified.", tone: "success" });
      setOpen(false);
      router.refresh();
    });
  }

  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setFileBusy(true);
    try {
      const supabase = createBrowserSupabase();
      for (const f of files) {
        if (f.size > CP_MAX_FILE_BYTES) {
          toast({ title: `"${f.name}" is over ${CP_MAX_FILE_MB} MB`, tone: "error" });
          continue;
        }
        const type = resolveUploadContentType(f, CP_DOC_TYPES);
        if (!type) {
          toast({ title: `"${f.name}" is not an accepted file type`, tone: "error" });
          continue;
        }
        const path = `${userId}/uploads/ref_${Date.now()}_${f.name.replace(/[^A-Za-z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from(CP_UPLOADS_BUCKET).upload(path, withContentType(f, type), { contentType: type });
        if (error) {
          toast({ title: `Upload failed for "${f.name}"`, description: error.message, tone: "error" });
          continue;
        }
        const res = await addCustomProjectAttachmentAction({
          requestId,
          path,
          fileName: f.name,
          sizeMb: Math.round((f.size / (1024 * 1024)) * 100) / 100,
        });
        if ("error" in res) {
          await supabase.storage.from(CP_UPLOADS_BUCKET).remove([path]);
          toast({ title: `Could not attach "${f.name}"`, description: res.error, tone: "error" });
        }
      }
      router.refresh();
    } finally {
      setFileBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeFile(id: string, name: string) {
    if (!window.confirm(`Remove "${name}"?`)) return;
    setFileBusy(true);
    const res = await removeCustomProjectAttachmentAction({ fileId: id });
    setFileBusy(false);
    if ("error" in res) toast({ title: "Could not remove", description: res.error, tone: "error" });
    else router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" leftIcon={Pencil} onClick={() => setOpen(true)}>
        Edit request
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-ink-muted">
        You can edit these details until work starts. The project value is set by the CampusEduX team.
      </p>
      {TEXT_FIELDS.map((f) => (
        <Field key={f.key} label={f.label} htmlFor={`edit-${f.key}`} required={f.key === "title"}>
          {f.rows ? (
            <Textarea
              id={`edit-${f.key}`}
              rows={f.rows}
              maxLength={f.max}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          ) : (
            <Input
              id={`edit-${f.key}`}
              maxLength={f.max}
              value={form[f.key]}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          )}
        </Field>
      ))}

      <Field label="Deadline" htmlFor="edit-deadline" hint="Optional">
        <Input
          id="edit-deadline"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={form.deadline ?? ""}
          onChange={(e) => setForm({ ...form, deadline: e.target.value || null })}
        />
      </Field>

      <div>
        <div className="text-sm font-medium text-ink">Requirements</div>
        <ul className="mt-2 space-y-2">
          {form.custom_requirements.map((r, i) => (
            <li key={i} className="flex gap-2">
              <Input
                aria-label={`Requirement ${i + 1}`}
                maxLength={500}
                value={r}
                onChange={(e) => {
                  const next = [...form.custom_requirements];
                  next[i] = e.target.value;
                  setForm({ ...form, custom_requirements: next });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove requirement ${i + 1}`}
                onClick={() => setForm({ ...form, custom_requirements: form.custom_requirements.filter((_, j) => j !== i) })}
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        {form.custom_requirements.length < 30 && (
          <Button
            type="button"
            variant="text"
            size="sm"
            leftIcon={Plus}
            className="mt-2"
            onClick={() => setForm({ ...form, custom_requirements: [...form.custom_requirements, ""] })}
          >
            Add requirement
          </Button>
        )}
      </div>

      <div>
        <div className="text-sm font-medium text-ink">Attachments</div>
        <ul className="mt-2 divide-y divide-line text-sm">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-ink-muted">
                {a.name} <span className="text-xs">({a.sizeMb} MB)</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={Trash2}
                disabled={fileBusy}
                onClick={() => removeFile(a.id, a.name)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={CP_DOC_TYPES.join(",")}
          className="sr-only"
          id="edit-attachments"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={Paperclip}
          className="mt-2"
          loading={fileBusy}
          disabled={attachments.length >= 20}
          onClick={() => fileInput.current?.click()}
        >
          Add file
        </Button>
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setForm(initial);
            setOpen(false);
          }}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="button" onClick={save} loading={pending}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
