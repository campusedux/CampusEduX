"use client";

import { Field, Input } from "@/components/ui";
import type { ResumePersonalDetails } from "@/lib/resumeBuilder/types";

/** Controlled — the parent owns the state and the autosave, so an "Import from CampusEduX" fill persists too. */
export default function PersonalDetailsForm({
  value,
  onChange,
}: {
  value: ResumePersonalDetails;
  onChange: (details: ResumePersonalDetails) => void;
}) {
  function set<K extends keyof ResumePersonalDetails>(key: K, v: ResumePersonalDetails[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ink">Personal Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="pd-full-name">
          <Input id="pd-full-name" value={value.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field label="Professional title" htmlFor="pd-job-title">
          <Input id="pd-job-title" value={value.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="e.g. Software Engineer" />
        </Field>
        <Field label="Email" htmlFor="pd-email">
          <Input id="pd-email" type="email" value={value.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="pd-phone">
          <Input id="pd-phone" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Location" htmlFor="pd-location">
          <Input id="pd-location" value={value.location} onChange={(e) => set("location", e.target.value)} placeholder="City, Country" />
        </Field>
        <Field label="LinkedIn" htmlFor="pd-linkedin">
          <Input id="pd-linkedin" value={value.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/…" />
        </Field>
        <Field label="GitHub" htmlFor="pd-github">
          <Input id="pd-github" value={value.github} onChange={(e) => set("github", e.target.value)} placeholder="github.com/…" />
        </Field>
        <Field label="Website / portfolio" htmlFor="pd-website">
          <Input id="pd-website" value={value.website} onChange={(e) => set("website", e.target.value)} placeholder="yoursite.dev" />
        </Field>
        <Field
          label="Profile photo URL (optional)"
          htmlFor="pd-photo"
          hint="Optional. Most ATS parsers ignore images — leave blank for a strictly ATS-safe resume."
          className="sm:col-span-2"
        >
          <Input id="pd-photo" value={value.photoUrl ?? ""} onChange={(e) => set("photoUrl", e.target.value || null)} placeholder="https://…" />
        </Field>
      </div>
    </div>
  );
}
