"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui";
import { updateResumePersonalDetailsAction } from "@/lib/actions/resumeBuilder";
import type { ResumePersonalDetails } from "@/lib/resumeBuilder/types";
import { useAutosaveField, type SaveStatus } from "./useAutosaveField";

export default function PersonalDetailsForm({
  resumeId,
  initial,
  onChange,
  onStatusChange,
}: {
  resumeId: string;
  initial: ResumePersonalDetails;
  onChange: (details: ResumePersonalDetails) => void;
  onStatusChange: (status: SaveStatus) => void;
}) {
  const [details, setDetails] = useState(initial);

  useAutosaveField(details, (value) => updateResumePersonalDetailsAction(resumeId, value), onStatusChange);

  function set<K extends keyof ResumePersonalDetails>(key: K, value: ResumePersonalDetails[K]) {
    const next = { ...details, [key]: value };
    setDetails(next);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-ink">Personal Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="pd-full-name">
          <Input id="pd-full-name" value={details.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field label="Job title" htmlFor="pd-job-title">
          <Input id="pd-job-title" value={details.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="pd-email">
          <Input id="pd-email" type="email" value={details.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="pd-phone">
          <Input id="pd-phone" value={details.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Location" htmlFor="pd-location">
          <Input id="pd-location" value={details.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="LinkedIn" htmlFor="pd-linkedin">
          <Input id="pd-linkedin" value={details.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
        </Field>
        <Field label="Website / portfolio" htmlFor="pd-website">
          <Input id="pd-website" value={details.website} onChange={(e) => set("website", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}
