import { Card, CardHeader } from '@/components/ui/primitives';
import { UploadDropzone, type UploadedFile } from '@/components/ui/UploadDropzone';
import { DeleteButton } from '@/components/ui/DeleteButton';

type Result = { ok: boolean; error?: string };

/**
 * Reusable "one image" field: shows the current image (if any) with a Remove
 * button, plus a drag-and-drop uploader that replaces it. Used for the project
 * thumbnail and the company logo. Existing URL-based values keep working — this
 * just writes a new public Storage URL into the same column.
 */
export function ImageFieldCard({
  title,
  description,
  currentUrl,
  bucket,
  pathPrefix,
  setAction,
  removeAction,
  canEdit,
}: {
  title: string;
  description?: string;
  currentUrl: string | null | undefined;
  bucket: string;
  pathPrefix: string;
  setAction: (files: UploadedFile[]) => Promise<Result>;
  removeAction: () => Promise<Result>;
  canEdit: boolean;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="space-y-4">
        {currentUrl ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt=""
              className="h-24 w-24 rounded-lg border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-faint">{currentUrl}</p>
              {canEdit ? (
                <div className="mt-2">
                  <DeleteButton action={removeAction} confirmMessage="Remove this image?" label="Remove" />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-faint">No image set — a fallback is shown in the app.</p>
        )}

        {canEdit ? (
          <UploadDropzone
            bucket={bucket}
            pathPrefix={pathPrefix}
            accept="image/png,image/jpeg,image/webp"
            hint="PNG, JPG or WebP · replaces the current image"
            action={setAction}
          />
        ) : null}
      </div>
    </Card>
  );
}
