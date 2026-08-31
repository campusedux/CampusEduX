'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileArchive, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { addProjectFile, deleteProjectFile } from '@/app/projects/actions';
import { Select } from '@/components/ui/primitives';

interface ProjectFile {
  id: string;
  file_type: 'source_zip' | 'database' | 'other';
  storage_path: string;
  size_bytes: number;
}

const FILE_TYPE_LABEL: Record<ProjectFile['file_type'], string> = {
  source_zip: 'Source code (ZIP)',
  database: 'Database dump',
  other: 'Other',
};

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileManager({ projectId, files }: { projectId: string; files: ProjectFile[] }) {
  const router = useRouter();
  const [fileType, setFileType] = useState<ProjectFile['file_type']>('source_zip');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const checksum = await sha256Hex(file);
      const path = `${projectId}/${fileType}/${Date.now()}-${file.name}`;
      // This bucket is private (project-assets, see 010) — the file is never
      // reachable by a public URL; buyers only ever get a short-lived signed
      // URL from the get-download-url Edge Function after ownership is verified.
      const { error: uploadError } = await supabase.storage.from('project-assets').upload(path, file);
      if (uploadError) throw uploadError;
      await addProjectFile(projectId, fileType, path, checksum, file.size);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file: ProjectFile) => {
    await deleteProjectFile(projectId, file.id, file.storage_path);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <ul className="divide-y divide-border">
        {files.map((file) => (
          <li key={file.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <FileArchive size={16} className="text-ink-faint" />
              <div>
                <p className="text-sm font-medium text-ink">{FILE_TYPE_LABEL[file.file_type]}</p>
                <p className="text-xs text-ink-faint">{formatSize(file.size_bytes)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(file)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-danger/10 hover:text-danger"
              aria-label="Delete file"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {files.length === 0 ? <li className="py-2.5 text-sm text-ink-faint">No files uploaded yet.</li> : null}
      </ul>

      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Select value={fileType} onChange={(e) => setFileType(e.target.value as ProjectFile['file_type'])} className="w-48">
          <option value="source_zip">Source code (ZIP)</option>
          <option value="database">Database dump</option>
          <option value="other">Other</option>
        </Select>
        <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle">
          <Upload size={14} />
          {isUploading ? 'Uploading…' : 'Upload file'}
          <input
            type="file"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}
