import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getAiPrompts } from '@/lib/resume/queries';
import { AiPromptManager } from './AiPromptManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'AI Assist Config · CampusEduX Admin' };

export default async function AiConfigPage() {
  const admin = await requireModule('resume');
  const prompts = await getAiPrompts();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="AI Writing-Assist Config"
        subtitle="The system prompt sent to Claude for each resume section's AI suggestions — edit anytime, no app redeploy needed."
      />
      <AiPromptManager prompts={prompts} perms={admin.perms.resume} />
    </div>
  );
}
