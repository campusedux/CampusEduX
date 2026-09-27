"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Field, Input, Textarea, toast, type BadgeTone } from "@/components/ui";
import { formatINRExact as formatINR } from "@/lib/format";
import { ADDON_STATUS_LABELS, type AddonStatus, type CustomProjectAddon } from "@/lib/customProjects";
import {
  acceptCustomProjectAddonAction,
  createCustomProjectAddonAction,
  deleteCustomProjectAddonAction,
  updateCustomProjectAddonAction,
} from "@/lib/actions/customProjects";

const TONE: Record<AddonStatus, BadgeTone> = {
  pending: "neutral",
  priced: "premium",
  accepted: "success",
  rejected: "danger",
};

function AddonForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; description: string };
  submitLabel: string;
  onSubmit: (v: { title: string; description: string }) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3 rounded-xl border border-line bg-surface p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          if (await onSubmit({ title, description })) onCancel();
        });
      }}
    >
      <Field label="Feature" htmlFor="addon-title" required>
        <Input id="addon-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </Field>
      <Field label="Details" htmlFor="addon-desc" hint="What should it do? The team will price it.">
        <Textarea id="addon-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Extra features the owner asked for, kept separate from the original request. The owner adds them (no
 * price), the team prices them, the owner accepts. Only accepted prices count toward the project value.
 */
export default function AddonsPanel({
  requestId,
  addons,
  canAdd,
}: {
  requestId: string;
  addons: CustomProjectAddon[];
  canAdd: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(result: Promise<{ ok: true } | { error: string }>, success: string): Promise<boolean> {
    const res = await result;
    if ("error" in res) {
      toast({ title: "Something went wrong", description: res.error, tone: "error" });
      return false;
    }
    toast({ title: success, tone: "success" });
    router.refresh();
    return true;
  }

  async function act(id: string, fn: () => Promise<boolean>) {
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {addons.length === 0 && !adding && (
        <p className="text-sm text-ink-muted">Need something that wasn&apos;t in the original request? Add it as an extra feature.</p>
      )}

      {addons.length > 0 && (
        <ul className="divide-y divide-line text-sm">
          {addons.map((a) =>
            editingId === a.id ? (
              <li key={a.id} className="py-3">
                <AddonForm
                  initial={{ title: a.title, description: a.description }}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={(v) => run(updateCustomProjectAddonAction({ addonId: a.id, ...v }), "Extra feature updated")}
                />
              </li>
            ) : (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{a.title}</p>
                  {a.description && <p className="mt-0.5 whitespace-pre-line text-xs text-ink-muted">{a.description}</p>}
                  <div className="mt-1.5">
                    <Badge tone={TONE[a.status]}>{ADDON_STATUS_LABELS[a.status]}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{a.price != null ? formatINR(a.price) : "Price pending"}</span>
                  {a.status === "priced" && (
                    <Button
                      size="sm"
                      loading={busyId === a.id}
                      onClick={() =>
                        act(a.id, () => run(acceptCustomProjectAddonAction({ addonId: a.id }), "Extra feature accepted"))
                      }
                    >
                      Accept {a.price != null ? formatINR(a.price) : ""}
                    </Button>
                  )}
                  {a.status === "pending" && (
                    <>
                      <Button size="sm" variant="ghost" leftIcon={Pencil} onClick={() => setEditingId(a.id)} aria-label={`Edit ${a.title}`}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={Trash2}
                        loading={busyId === a.id}
                        aria-label={`Delete ${a.title}`}
                        onClick={() => {
                          if (!window.confirm(`Delete "${a.title}"?`)) return;
                          act(a.id, () => run(deleteCustomProjectAddonAction({ addonId: a.id }), "Extra feature deleted"));
                        }}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {canAdd &&
        (adding ? (
          <AddonForm
            submitLabel="Send for pricing"
            onCancel={() => setAdding(false)}
            onSubmit={(v) => run(createCustomProjectAddonAction({ requestId, ...v }), "Extra feature sent for pricing")}
          />
        ) : (
          <Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => setAdding(true)}>
            Add extra feature
          </Button>
        ))}
    </div>
  );
}
