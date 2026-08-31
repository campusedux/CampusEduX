'use client';

import { useMemo, useState } from 'react';
import { Label, Select } from '@/components/ui/primitives';
import type { AcademicOptions } from '@/lib/academic-targeting';

export interface AcademicTargetingInitial {
  target_type?: string | null;
  target_course_id?: string | null;
  target_branch_ids?: string[] | null;
  target_year_id?: string | null;
}

type Audience = 'global' | 'course' | 'branch';

/**
 * "Target audience" control (spec §26–§29): Global · Specific course ·
 * Specific branches. "Specific course" shows one course select; "Specific
 * branches" shows a course select plus a multi-select of that course's
 * branches. A separate optional "also limit to year" select is always shown
 * (year is a soft ranking signal, not a hard filter — spec §39).
 *
 * Posts: target_type, target_course_id, target_branch_ids (repeated),
 * target_year_id — resolved server-side by resolveTargetingFromForm().
 */
export function AcademicTargetingFields({
  options,
  initial = {},
  disabled,
}: {
  options: AcademicOptions;
  initial?: AcademicTargetingInitial;
  disabled?: boolean;
}) {
  const initialBranchIds = initial.target_branch_ids ?? [];
  const derivedType: Audience =
    (initial.target_type as Audience | undefined) ??
    (initialBranchIds.length ? 'branch' : initial.target_course_id ? 'course' : 'global');

  const branchCourseId =
    initial.target_course_id ??
    options.branches.find((b) => initialBranchIds.includes(b.id))?.course_id ??
    '';

  const [audience, setAudience] = useState<Audience>(derivedType);
  const [courseId, setCourseId] = useState<string>(branchCourseId || '');
  const [branchIds, setBranchIds] = useState<string[]>(initialBranchIds);

  const branchesForCourse = useMemo(
    () => options.branches.filter((b) => b.course_id === courseId),
    [options.branches, courseId],
  );

  const toggleBranch = (id: string) =>
    setBranchIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const onCourseChange = (next: string) => {
    setCourseId(next);
    // drop any selected branches that no longer belong to the chosen course
    setBranchIds((cur) =>
      cur.filter((id) => options.branches.some((b) => b.id === id && b.course_id === next)),
    );
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="target_type" value={audience} />
      {/* course id is posted for both 'course' and 'branch' so the resolver has it */}
      {audience !== 'global' ? <input type="hidden" name="target_course_id" value={courseId} /> : null}
      {audience === 'branch'
        ? branchIds.map((id) => <input key={id} type="hidden" name="target_branch_ids" value={id} />)
        : null}

      <div>
        <Label>Target audience</Label>
        <div className="flex flex-wrap gap-4 pt-1 text-sm">
          {(
            [
              ['global', 'Global — every student'],
              ['course', 'Specific course'],
              ['branch', 'Specific branches'],
            ] as [Audience, string][]
          ).map(([value, label]) => (
            <label key={value} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="__target_audience_ui"
                value={value}
                checked={audience === value}
                disabled={disabled}
                onChange={() => setAudience(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {audience !== 'global' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="__target_course_ui">Course</Label>
            <Select
              id="__target_course_ui"
              value={courseId}
              disabled={disabled}
              onChange={(e) => onCourseChange(e.target.value)}
            >
              <option value="">Select a course…</option>
              {options.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      ) : null}

      {audience === 'branch' ? (
        <div>
          <Label>Branches</Label>
          {!courseId ? (
            <p className="text-sm text-ink-muted">Pick a course to choose its branches.</p>
          ) : branchesForCourse.length === 0 ? (
            <p className="text-sm text-ink-muted">This course has no active branches yet.</p>
          ) : (
            <div className="grid max-h-56 gap-1.5 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
              {branchesForCourse.map((b) => (
                <label key={b.id} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={branchIds.includes(b.id)}
                    disabled={disabled}
                    onChange={() => toggleBranch(b.id)}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          )}
          {courseId && branchIds.length === 0 ? (
            <p className="mt-1 text-xs text-amber-600">
              No branch selected — this will be saved as Global.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="target_year_id">Also limit to year (optional)</Label>
          <Select id="target_year_id" name="target_year_id" defaultValue={initial.target_year_id ?? ''} disabled={disabled}>
            <option value="">Any year</option>
            {options.years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}
