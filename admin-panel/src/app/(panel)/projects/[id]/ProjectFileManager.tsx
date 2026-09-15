'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CardHeader, EmptyState, Label, Input } from '@/components/ui/primitives';
import { UploadDropzone, type UploadedFile } from '@/components/ui/UploadDropzone';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { addProjectFile, deleteProjectFile } from '../actions';

type Result = { ok: boolean; error?: string };
interface FileRow {
  id: string;
  label: string;
  file_name: string;
  size_mb: number;
  storage_path: string;
  url: string | null;
}

export function ProjectFileManager({
  projectId,
  category,
  title,
  accept,
  files,
  canEdit,
}: {
  projectId: string;
  category: 'main' | 'documentation';
  title: string;
  accept?: string;
  files: FileRow[];
  canEdit: boolean;
}) {
  const [label, setLabel] = useState('');

  const upload = (uploaded: UploadedFile[]): Promise<Result> =>
    addProjectFile(projectId, category, label.trim(), uploaded);

  return (
    <div className="space-y-5">
      {canEdit ? (
        <Card>
          <CardHeader title={`Upload ${title.toLowerCase()}`} description="Stored in the project-files bucket (same path the mobile app reads)." />
          <div className="space-y-3">
            <div className="max-w-sm">
              <Label htmlFor="file-label">Label (optional)</Label>
              <Input
                id="file-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={category === 'main' ? 'Full source code' : 'Setup guide'}
              />
            </div>
            <UploadDropzone
              bucket="project-files"
              pathPrefix={`${projectId}/${category}`}
              accept={accept}
              multiple
              action={upload}
            />
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={`${title} (${files.length})`} />
        {files.length === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()} yet`} />
        ) : (
          <ul className="divide-y divide-border">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{f.label || f.file_name}</p>
                  <p className="text-xs text-ink-faint">
                    {f.file_name} · {Number(f.size_mb).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {f.url ? (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink"
                      aria-label="Download"
                    >
                      <Download size={15} />
                    </a>
                  ) : (
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint/40"
                      aria-label="Download link unavailable"
                      title="Couldn't sign a download link — refresh the page."
                    >
                      <Download size={15} />
                    </span>
                  )}
                  {canEdit ? (
                    <DeleteButton
                      action={() => deleteProjectFile(projectId, f.id, f.storage_path, category)}
                      confirmMessage={`Delete "${f.label || f.file_name}"?`}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
