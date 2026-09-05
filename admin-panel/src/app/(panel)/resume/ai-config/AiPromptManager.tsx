'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Textarea, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { Badge } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { updateAiPrompt, toggleAiPrompt } from '../actions';

type Result = { ok: boolean; error?: string };
interface AiPrompt {
  id: string;
  section: string;
  system_prompt: string;
  max_tokens: number;
  is_active: boolean;
  updated_at: string;
}

const SECTION_LABEL: Record<string, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  projects: 'Projects',
  skills: 'Skills',
};

function useSaveToast(state: Result) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);
}

export function AiPromptManager({ prompts, perms }: { prompts: AiPrompt[]; perms: { edit: boolean } }) {
  if (prompts.length === 0) {
    return <EmptyState title="No AI prompts yet" description="Apply admin migration 034 for the starter set." />;
  }
  return (
    <div className="space-y-4">
      {prompts.map((p) => (
        <PromptCard key={p.id} prompt={p} perms={perms} />
      ))}
    </div>
  );
}

function PromptCard({ prompt, perms }: { prompt: AiPrompt; perms: { edit: boolean } }) {
  const [state, action] = useFormState(updateAiPrompt.bind(null, prompt.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <Card>
      <CardHeader
        title={SECTION_LABEL[prompt.section] ?? prompt.section}
        description="System prompt sent to Claude for this section's AI-assist suggestions"
      />
      <form action={action} className="space-y-3">
        <div>
          <Label htmlFor={`prompt-${prompt.id}`}>System prompt</Label>
          <Textarea id={`prompt-${prompt.id}`} name="system_prompt" defaultValue={prompt.system_prompt} rows={6} disabled={!perms.edit} />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-32">
            <Label htmlFor={`tokens-${prompt.id}`}>Max tokens</Label>
            <Input id={`tokens-${prompt.id}`} name="max_tokens" type="number" defaultValue={prompt.max_tokens} disabled={!perms.edit} />
          </div>
          <div className="flex items-center gap-3">
            {perms.edit ? (
              <ToggleSwitch checked={prompt.is_active} action={toggleAiPrompt.bind(null, prompt.id)} labelOn="Active" labelOff="Off" />
            ) : (
              <Badge label={prompt.is_active ? 'Active' : 'Off'} tone={prompt.is_active ? 'success' : 'neutral'} />
            )}
            {perms.edit && (
              <div className="w-20">
                <SubmitButton pendingLabel="…">Save</SubmitButton>
              </div>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}
