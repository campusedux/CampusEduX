import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getAtsRules } from '@/lib/resume/queries';
import { AtsRuleManager } from './AtsRuleManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'ATS Rules · CampusEduX Admin' };

export default async function AtsRulesPage() {
  const admin = await requireModule('resume');
  const rules = await getAtsRules();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="ATS Rules & Guidelines"
        subtitle="What the resume builder checks a student’s resume against, grouped by section."
      />
      <AtsRuleManager rules={rules} perms={admin.perms.resume} />
    </div>
  );
}
