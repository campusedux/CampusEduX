"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button, Field, Input, Select } from "@/components/ui";

interface Catalog {
  courses: { id: string; name: string }[];
  branches: { id: string; name: string; course_id: string | null }[];
  years: string[];
}

interface Initial {
  course: string;
  branch: string;
  year: string;
}

/**
 * Branches belonging to the given course name (profiles store names, not
 * catalog ids — same lookup account/profile/ProfileForm.tsx uses). Falls
 * back to the full branch list until a course is picked, or when the
 * catalog isn't course-scoped.
 */
export function branchesForCourse(catalog: Pick<Catalog, "courses" | "branches">, courseName: string) {
  const courseId =
    catalog.courses.find((c) => c.name.trim().toLowerCase() === courseName.trim().toLowerCase())?.id ?? null;
  return courseId ? catalog.branches.filter((b) => b.course_id === courseId) : catalog.branches;
}

/** Course, branch and year are the only fields onboarding requires — mirrors lib/auth.ts's isAcademicComplete. */
export function isOnboardingComplete(course: string, branch: string, year: string): boolean {
  return !!(course && branch && year);
}

/** Where a successful onboarding submit sends the browser — exported so the redirect target is testable without rendering. */
export const ONBOARDING_COMPLETE_REDIRECT = "/";

type ProfilesTable = ReturnType<typeof createBrowserSupabase>;

/** Isolated from the component so the write can be tested without rendering. */
export async function saveOnboardingProfile(
  supabase: ProfilesTable,
  userId: string,
  fields: { course: string; branch: string; year: string },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  return { error: error ? (error as { message: string }).message : null };
}

export default function OnboardingForm({
  userId,
  initial,
  catalog,
}: {
  userId: string;
  initial: Initial;
  catalog: Catalog;
}) {
  const router = useRouter();
  const [course, setCourse] = useState(initial.course);
  const [branch, setBranch] = useState(initial.branch);
  const [year, setYear] = useState(initial.year);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCatalog = catalog.courses.length > 0 && catalog.years.length > 0;
  const branchOptions = useMemo(() => branchesForCourse(catalog, course), [catalog, course]);
  const canContinue = isOnboardingComplete(course, branch, year);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canContinue || saving) return;
    setSaving(true);
    setError(null);
    try {
      const { error: saveError } = await saveOnboardingProfile(createBrowserSupabase(), userId, {
        course,
        branch,
        year,
      });
      setSaving(false);
      if (saveError) {
        setError(saveError);
        return;
      }
      router.push(ONBOARDING_COMPLETE_REDIRECT);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Course" htmlFor="ob-course" required>
        {hasCatalog ? (
          <Select
            id="ob-course"
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
          <Input
            id="ob-course"
            value={course}
            onChange={(e) => {
              setCourse(e.target.value);
              setBranch("");
            }}
            placeholder="B.Tech, BCA…"
          />
        )}
      </Field>

      <Field label="Branch" htmlFor="ob-branch" required>
        {hasCatalog ? (
          <Select id="ob-branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">Select…</option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </Select>
        ) : (
          <Input id="ob-branch" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="CSE, ECE…" />
        )}
      </Field>

      <Field label="Year" htmlFor="ob-year" required>
        {hasCatalog ? (
          <Select id="ob-year" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select…</option>
            {catalog.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        ) : (
          <Input id="ob-year" value={year} onChange={(e) => setYear(e.target.value)} placeholder="1st Year…" />
        )}
      </Field>

      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

      <Button type="submit" fullWidth loading={saving} disabled={!canContinue}>
        Continue
      </Button>
    </form>
  );
}
