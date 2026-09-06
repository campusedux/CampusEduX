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
        <PageHeader title="Terms & Privacy" subtitle="Legacy free-text CMS pages." />
      </div>

      <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-ink">
        <p className="font-medium">The full legal policies are no longer edited here.</p>
        <p className="mt-1 text-ink-muted">
          Privacy Policy, Terms, Refund Policy, Disclaimer, Project License, Community Guidelines, Data &amp; Permissions,
          Cookie Policy, Grievance, Contact and Delete Account are now maintained as versioned content in the codebase
          (<code>mobile-app/src/legal/</code>), so the website and the mobile app always show identical text. A
          consistency test fails if they drift. To change a policy or an owner detail (address, grievance officer,
          jurisdiction, refund window), edit <code>mobile-app/src/legal/legal.config.json</code> / the relevant
          <code> content/*.json</code>, bump its version, and ship a release. The fields below are kept only for
          reference and are not shown to users.
        </p>
      </div>
      {ordered.map((p) => (
        <PageEditor key={p.key} page={p} action={saveCmsPage.bind(null, p.key)} canEdit={admin.perms.cms.edit} />
      ))}
    </div>
  );
}
