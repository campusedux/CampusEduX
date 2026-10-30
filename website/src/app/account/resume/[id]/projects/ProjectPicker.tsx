"use client";

import { useState } from "react";
import { appendCustomProjectToResumeAction, type ResumeProjectCandidate } from "@/lib/actions/resumeBuilder";
import { Button } from "@/components/ui";

export default function ProjectPicker({ resumeId, projects }: { resumeId: string; projects: ResumeProjectCandidate[] }) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(projectId: string) {
    if (pendingId !== null) return;
    setPendingId(projectId);
    setError(null);
    try {
      const result = await appendCustomProjectToResumeAction(resumeId, projectId);
      setPendingId(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAddedIds((prev) => new Set(prev).add(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}
      {projects.map((project) => {
        const added = addedIds.has(project.id);
        return (
          <div key={project.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-card p-4">
            <div>
              <div className="font-semibold text-ink">{project.title}</div>
              {project.technologyPreference && <div className="text-xs text-ink-muted">{project.technologyPreference}</div>}
              {project.description && <p className="mt-1 text-sm text-ink-muted line-clamp-2">{project.description}</p>}
            </div>
            <Button
              size="sm"
              variant={added ? "ghost" : "primary"}
              disabled={added || pendingId === project.id}
              onClick={() => handleAdd(project.id)}
            >
              {added ? "Added" : pendingId === project.id ? "Adding…" : "Add to resume"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
