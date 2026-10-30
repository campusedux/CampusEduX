"use client";

import { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { emitSessionChange } from "@/lib/sessionSignal";
import type { AccountUser } from "@/lib/auth";
import { Button, Field, Input, Select } from "@/components/ui";

interface Catalog {
  courses: { id: string; name: string }[];
  branches: { id: string; name: string; course_id: string | null }[];
  years: string[];
}

export default function ProfileForm({ initial, catalog }: { initial: AccountUser; catalog: Catalog }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [course, setCourse] = useState(initial.course ?? "");
  const [branch, setBranch] = useState(initial.branch ?? "");
  const [year, setYear] = useState(initial.year ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(initial.githubUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(initial.portfolioUrl ?? "");
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
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const supabase = createBrowserSupabase();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          course,
          branch,
          year,
          linkedin_url: linkedinUrl.trim() || null,
          github_url: githubUrl.trim() || null,
          portfolio_url: portfolioUrl.trim() || null,
        })
        .eq("id", initial.id);
      setSaving(false);
      if (updateError) setError(updateError.message);
      else {
        setSaved(true);
        emitSessionChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Full name" htmlFor="pf-full-name">
        <Input id="pf-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="pf-email">
        <Input id="pf-email" value={initial.email} disabled />
      </Field>
      <Field label="Mobile number" htmlFor="pf-mobile">
        <Input id="pf-mobile" value={initial.mobileNumber} disabled />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Course" htmlFor="pf-course">
          {hasCatalog ? (
            <Select
              id="pf-course"
              value={course}
              onChange={(e) => {
                setCourse(e.target.value);
                setBranch("");
              }}
            >
              <option value="">Select…</option>
              {catalog.courses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input id="pf-course" value={course} onChange={(e) => setCourse(e.target.value)} />
          )}
        </Field>
        <Field label="Branch" htmlFor="pf-branch">
          {hasCatalog ? (
            <Select id="pf-branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">Select…</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </Select>
          ) : (
            <Input id="pf-branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
          )}
        </Field>
        <Field label="Year" htmlFor="pf-year">
          {hasCatalog ? (
            <Select id="pf-year" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Select…</option>
              {catalog.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          ) : (
            <Input id="pf-year" value={year} onChange={(e) => setYear(e.target.value)} />
          )}
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="LinkedIn URL" htmlFor="pf-linkedin">
          <Input id="pf-linkedin" placeholder="https://linkedin.com/in/…" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
        </Field>
        <Field label="GitHub URL" htmlFor="pf-github">
          <Input id="pf-github" placeholder="https://github.com/…" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
        </Field>
        <Field label="Portfolio / website URL" htmlFor="pf-portfolio">
          <Input id="pf-portfolio" placeholder="https://…" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
        </Field>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>
      )}
      {saved && <p className="text-sm font-medium text-success">Saved.</p>}
      <Button type="submit" loading={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
