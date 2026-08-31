"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { AccountUser } from "@/lib/auth";

export default function ProfileForm({ initial }: { initial: AccountUser }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [course, setCourse] = useState(initial.course ?? "");
  const [branch, setBranch] = useState(initial.branch ?? "");
  const [year, setYear] = useState(initial.year ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <label className="text-sm text-navy">Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="text-sm text-navy">Email</label>
        <input value={initial.email} disabled className="mt-1 w-full border border-navy/10 bg-paper px-3 py-2 text-sm text-slate" />
      </div>
      <div>
        <label className="text-sm text-navy">Mobile number</label>
        <input value={initial.mobileNumber} disabled className="mt-1 w-full border border-navy/10 bg-paper px-3 py-2 text-sm text-slate" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-navy">Course</label>
          <input value={course} onChange={(e) => setCourse(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm text-navy">Branch</label>
          <input value={branch} onChange={(e) => setBranch(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm text-navy">Year</label>
          <input value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 w-full border border-navy/20 bg-white px-3 py-2 text-sm" />
        </div>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && <p className="text-sm text-emerald">Saved.</p>}
      <button type="submit" disabled={saving} className="rounded-sm bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy/90 disabled:opacity-60">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
