'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Select } from '@/components/ui/primitives';
import { addProjectDocument, deleteProjectDocument } from '@/app/projects/actions';

type DocType = 'documentation' | 'report' | 'ppt' | 'installation_guide';

interface ProjectDocument {
  id: string;
  doc_type: DocType;
  storage_path: string;
  preview_storage_path: string | null;
  is_locked: boolean;
}

const DOC_TYPE_LABEL: Record<DocType, string> = {
  documentation: 'Documentation',
  report: 'Report',
  ppt: 'PPT',
  installation_guide: 'Installation guide',
};

export function DocumentManager({ projectId, documents }: { projectId: string; documents: ProjectDocument[] }) {
  const router = useRouter();
  const [docType, setDocType] = useState<DocType>('documentation');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File | undefined, previewFile: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `${projectId}/${docType}/${Date.now()}-${file.name}`;
      // Locked bucket — same pattern as FileManager: buyers only ever get a signed URL.
      const { error: uploadError } = await supabase.storage.from('project-assets').upload(path, file);
      if (uploadError) throw uploadError;

      let previewPath: string | null = null;
      if (previewFile) {
        previewPath = `${projectId}/${docType}/preview-${Date.now()}-${previewFile.name}`;
        const { error: previewError } = await supabase.storage.from('project-previews').upload(previewPath, previewFile);
        if (previewError) throw previewError;
      }

      await addProjectDocument(projectId, docType, path, previewPath, true);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (previewInputRef.current) previewInputRef.current.value = '';
    }
  };

  const handleDelete = async (doc: ProjectDocument) => {
    await deleteProjectDocument(projectId, doc.id, doc.storage_path, doc.preview_storage_path);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
        Heads up: the current app build doesn&apos;t read this table yet, so anything uploaded here won&apos;t appear
        in the app until that screen is added. Safe to use ahead of that, or skip for now.
      </p>
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <ul className="divide-y divide-border">
        {documents.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <FileText size={16} className="text-ink-faint" />
              <div>
                <p className="text-sm font-medium text-ink">{DOC_TYPE_LABEL[doc.doc_type]}</p>
                <p className="text-xs text-ink-faint">
                  {doc.preview_storage_path ? 'Has watermarked preview' : 'No preview uploaded'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(doc)}
              className="text-ink-faint hover:text-danger"
              aria-label="Delete document"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <Select value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
          {Object.entries(DOC_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Upload size={14} />
          Full file (locked)
        </div>
        <input ref={fileInputRef} type="file" disabled={isUploading} className="w-full text-sm" />
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Upload size={14} />
          Watermarked preview (optional, shown before purchase)
        </div>
        <input ref={previewInputRef} type="file" disabled={isUploading} className="w-full text-sm" />
        <button
          type="button"
          disabled={isUploading}
          onClick={() => handleUpload(fileInputRef.current?.files?.[0], previewInputRef.current?.files?.[0])}
          className="h-9 w-full rounded-lg bg-brand text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isUploading ? 'Uploading…' : 'Upload document'}
        </button>
      </div>
    </div>
  );
}
