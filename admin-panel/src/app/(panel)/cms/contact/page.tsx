import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getContactSubmissions } from '@/lib/cms/queries';
import { ContactList } from './ContactList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Contact Messages · CampusEduX Admin' };

export default async function ContactMessagesPage() {
  const admin = await requireModule('cms');
  const submissions = await getContactSubmissions();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/cms" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Banner & CMS
        </Link>
        <PageHeader
          title="Contact Messages"
          subtitle="Submissions from the marketing website's /contact form."
        />
      </div>
      <ContactList submissions={submissions} canEdit={admin.perms.cms.edit} />
    </div>
  );
}
