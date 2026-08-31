import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getCmsPages } from '@/lib/cms/queries';
import { PageEditor } from './PageEditor';
import { saveCmsPage } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Terms & Privacy · CampusEduX Admin' };

export default async function CmsPagesPage() {
  const admin = await requireModule('cms');
  const pages = await getCmsPages();
  // Ensure both keys render even if the rows aren't seeded yet.
  const byKey = new Map(pages.map((p) => [p.key, p]));
  const ordered = ['terms', 'privacy'].map(
    (key) => byKey.get(key) ?? { key, title: key === 'terms' ? 'Terms & Conditions' : 'Privacy Policy', content: '', updated_at: '' },
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/cms" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Banner & CMS
        </Link>
        <PageHeader title="Terms & Privacy" subtitle="Legal content shown in the app’s Settings screens." />
      </div>
      {ordered.map((p) => (
        <PageEditor key={p.key} page={p} action={saveCmsPage.bind(null, p.key)} canEdit={admin.perms.cms.edit} />
      ))}
    </div>
  );
}
