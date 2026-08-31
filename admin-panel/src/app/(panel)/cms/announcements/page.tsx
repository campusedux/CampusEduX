import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getAnnouncements } from '@/lib/cms/queries';
import { AnnouncementManager } from './AnnouncementManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Announcements · CampusEduX Admin' };

export default async function AnnouncementsPage() {
  const admin = await requireModule('cms');
  const items = await getAnnouncements();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/cms" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Banner & CMS
        </Link>
        <PageHeader title="Announcements" subtitle="In-app announcements shown to a target audience." />
      </div>
      <AnnouncementManager items={items} perms={admin.perms.cms} />
    </div>
  );
}
