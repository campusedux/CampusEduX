"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { AccountUser } from "@/lib/auth";
import { Button } from "@/components/ui";

interface Catalog {
  courses: { id: string; name: string }[];
  branches: { id: string; name: string; course_id: string | null }[];
  years: string[];
}

const inputCls = "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm";
const disabledCls = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-muted";

export default function ProfileForm({ initial, catalog }: { initial: AccountUser; catalog: Catalog }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [course, setCourse] = useState(initial.course ?? "");
  const [branch, setBranch] = useState(initial.branch ?? "");
  const [year, setYear] = useState(initial.year ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCatalog = catalog.courses.length > 0 && catalog.years.length > 0;

  // Branches for the currently-selected course (profile stores names, not ids).
  const courseId = useMemo(
    () => catalog.courses.find((c) => c.name.toLowerCase() === course.toLowerCase())?.id ?? null,
    [catalog.courses, course],
  );
  const branchOptions = useMemo(
    () => (courseId ? catalog.branches.filter((b) => b.course_id === courseId) : catalog.branches),
    [catalog.branches, courseId],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, course, branch, year })
      .eq("id", initial.id);
    setSaving(false);
    if (updateError) setError(updateError.message);
    else setSaved(true);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium text-ink">Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="text-sm font-medium text-ink">Email</label>
        <input value={initial.email} disabled className={disabledCls} />
      </div>
      <div>
        <label className="text-sm font-medium text-ink">Mobile number</label>
        <input value={initial.mobileNumber} disabled className={disabledCls} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-ink">Course</label>
          {hasCatalog ? (
            <select
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                setBranch("");
              }}
              className={inputCls}
            >
              <option value="">Select…</option>
              {catalog.courses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input value={course} onChange={(e) => setCourse(e.target.value)} className={inputCls} />
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Branch</label>
          {hasCatalog ? (
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <input value={branch} onChange={(e) => setBranch(e.target.value)} className={inputCls} />
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Year</label>
          {hasCatalog ? (
            <select value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {catalog.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          ) : (
            <input value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} />
          )}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && <p className="text-sm text-success">Saved.</p>}
      <Button type="submit" loading={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
