'use client';

import Link from 'next/link';
import { Pencil, Eye, Star, Copy, ExternalLink, Send, Undo2 } from 'lucide-react';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ActionButton } from '@/components/ui/ActionButton';
import { StatusPill } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { WEBSITE_URL } from '@/lib/learning/site';
import type { BlogPost } from '@/lib/blog/queries';
import { setPostStatus, setPostFeatured, duplicatePost, deletePost } from './actions';

type Perms = { add: boolean; edit: boolean; delete: boolean };

export function BlogTable({ rows, perms }: { rows: BlogPost[]; perms: Perms }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-faint">
            <th className="py-2 pr-3">Title</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Author</th>
            <th className="py-2 pr-3">Published</th>
            <th className="py-2 pr-1 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((p) => (
            <tr key={p.id} className="align-middle">
              <td className="py-2 pr-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/blog/${p.id}`} className="font-semibold text-ink hover:text-brand">
                        {p.title || 'Untitled'}
                      </Link>
                      {p.is_featured ? <Star size={13} className="flex-shrink-0 text-warning" fill="currentColor" /> : null}
                    </div>
                    <p className="truncate text-xs text-ink-faint">
                      /blog/{p.slug} · {p.reading_time} min
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-2 pr-3 text-ink-muted">{p.category_name || '—'}</td>
              <td className="py-2 pr-3">
                <StatusPill status={p.status} />
              </td>
              <td className="py-2 pr-3 text-ink-muted">{p.author_name}</td>
              <td className="py-2 pr-3 text-ink-muted">{p.published_at ? formatDate(p.published_at) : '—'}</td>
              <td className="py-2 pr-1">
                <div className="flex items-center justify-end gap-1">
                  {perms.edit ? (
                    <ActionButton
                      action={() => setPostFeatured(p.id, !p.is_featured)}
                      variant="ghost"
                      className="!h-8 !w-8 !px-0"
                      successToast={p.is_featured ? 'Removed from featured' : 'Marked as featured'}
                    >
                      <Star size={15} className={p.is_featured ? 'text-warning' : ''} fill={p.is_featured ? 'currentColor' : 'none'} />
                    </ActionButton>
                  ) : null}

                  {perms.edit && p.status !== 'published' ? (
                    <ActionButton action={() => setPostStatus(p.id, 'published')} variant="ghost" className="!h-8 !px-2" successToast="Published">
                      <Send size={14} /> Publish
                    </ActionButton>
                  ) : null}
                  {perms.edit && p.status === 'published' ? (
                    <ActionButton
                      action={() => setPostStatus(p.id, 'draft')}
                      variant="ghost"
                      className="!h-8 !px-2"
                      confirmMessage="Unpublish this post? It will disappear from the public blog immediately."
                      successToast="Unpublished"
                    >
                      <Undo2 size={14} /> Unpublish
                    </ActionButton>
                  ) : null}

                  <Link
                    href={`/blog/${p.id}/preview`}
                    target="_blank"
                    aria-label="Preview"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink"
                  >
                    <Eye size={15} />
                  </Link>

                  {p.status === 'published' ? (
                    <a
                      href={`${WEBSITE_URL}/blog/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View live"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink"
                    >
                      <ExternalLink size={15} />
                    </a>
                  ) : null}

                  <Link
                    href={`/blog/${p.id}`}
                    aria-label="Edit"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink"
                  >
                    <Pencil size={15} />
                  </Link>

                  {perms.add ? (
                    <ActionButton
                      action={() => duplicatePost(p.id)}
                      variant="ghost"
                      className="!h-8 !w-8 !px-0"
                      successToast="Duplicated as a draft"
                    >
                      <Copy size={15} />
                    </ActionButton>
                  ) : null}

                  {perms.delete ? (
                    <DeleteButton
                      action={() => deletePost(p.id)}
                      confirmMessage={`Delete "${p.title || 'Untitled'}"? This cannot be undone — consider Unpublishing or Archiving instead.`}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
