import { Label, Input, Select } from '@/components/ui/primitives';

/** Slug input with a hint that "leave blank to auto-generate". */
export function SlugField({ defaultValue, from }: { defaultValue?: string; from: string }) {
  return (
    <div>
      <Label htmlFor="slug">URL slug</Label>
      <Input name="slug" defaultValue={defaultValue ?? ''} placeholder={`auto from ${from}`} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
      <p className="mt-1 text-xs text-ink-faint">Lower-case, hyphen-separated. Leave blank to generate from the {from}.</p>
    </div>
  );
}

/** status + website/mobile visibility (+ optional premium / featured). */
export function PublishFields({
  status = 'draft',
  showWebsite = true,
  showMobile = true,
  premium,
  featured,
}: {
  status?: string;
  showWebsite?: boolean;
  showMobile?: boolean;
  premium?: boolean | null; // pass a boolean to render the "Premium" checkbox
  featured?: boolean | null; // pass a boolean to render the "Featured" checkbox
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-subtle/40 p-3">
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <div>
          <Label htmlFor="status">Publication</Label>
          <Select name="status" defaultValue={status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="show_on_website" defaultChecked={showWebsite} className="h-4 w-4 rounded border-border text-brand" />
            Show on Website
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="show_on_mobile" defaultChecked={showMobile} className="h-4 w-4 rounded border-border text-brand" />
            Show on Mobile app
          </label>
          {premium !== null && premium !== undefined ? (
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" name="is_premium" defaultChecked={premium} className="h-4 w-4 rounded border-border text-brand" />
              Premium only
            </label>
          ) : null}
          {featured !== null && featured !== undefined ? (
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" name="is_featured" defaultChecked={featured} className="h-4 w-4 rounded border-border text-brand" />
              Featured
            </label>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-ink-faint">
        A child is only publicly visible when it is <strong>Published</strong> <em>and</em> every parent above it is
        Published and visible on the same platform.
      </p>
    </div>
  );
}
