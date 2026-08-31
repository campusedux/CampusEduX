import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getFaqs } from '@/lib/cms/queries';
import { FaqManager } from './FaqManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'FAQ · CampusEduX Admin' };

export default async function FaqsPage() {
  const admin = await requireModule('cms');
  const faqs = await getFaqs();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/cms" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Banner & CMS
        </Link>
        <PageHeader title="FAQ" subtitle="Help-centre questions, grouped by category." />
      </div>
      <FaqManager faqs={faqs} perms={admin.perms.cms} />
    </div>
  );
}
