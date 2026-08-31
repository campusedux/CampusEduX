import Link from 'next/link';
import { Image as ImageIcon, Megaphone, Send, HelpCircle, FileText, Mail } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/primitives';
import { BANNER_PLACEMENTS, BANNER_PLACEMENT_LABEL } from '@/lib/cms/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Banner & CMS · CampusEduX Admin' };

const OTHER = [
  { href: '/cms/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/cms/notifications', label: 'Push Notifications', icon: Send },
  { href: '/cms/faqs', label: 'FAQ', icon: HelpCircle },
  { href: '/cms/pages', label: 'Terms & Privacy', icon: FileText },
  { href: '/cms/contact', label: 'Contact Messages', icon: Mail },
];

export default async function CmsHub() {
  await requireModule('cms');

  return (
    <div className="space-y-6">
      <PageHeader title="Banner & CMS" subtitle="Banners, announcements, push notifications, FAQs and legal pages." />

      <Card>
        <h3 className="mb-3 text-base font-semibold text-ink">Banners</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BANNER_PLACEMENTS.map((p) => (
            <Link
              key={p}
              href={`/cms/banners/${p}`}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink hover:border-brand hover:bg-brand-light/40"
            >
              <ImageIcon size={15} className="text-ink-faint" />
              {BANNER_PLACEMENT_LABEL[p]}
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-base font-semibold text-ink">Content</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OTHER.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-ink hover:border-brand hover:bg-brand-light/40"
            >
              <Icon size={15} className="text-ink-faint" />
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
