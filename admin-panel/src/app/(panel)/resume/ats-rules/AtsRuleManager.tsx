'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Textarea, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useToast } from '@/components/ui/toast';
import { ATS_SECTIONS, ATS_SECTION_LABEL, IMPORTANCE, IMPORTANCE_TONE } from '@/lib/resume/constants';
import { createAtsRule, updateAtsRule, toggleAtsRule, deleteAtsRule } from '../actions';

type Result = { ok: boolean; error?: string };
interface Rule {
  id: string;
  section: string;
  rule: string;
  guideline: string;
  importance: string;
  is_active: boolean;
  sort_order: number;
}

function useSaveToast(state: Result, reset?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      reset?.();
      router.refresh();
    }
  }, [state, toast, router, reset]);
}

export function AtsRuleManager({ rules, perms }: { rules: Rule[]; perms: { add: boolean; edit: boolean; delete: boolean } }) {
  const bySection = ATS_SECTIONS.map((sec) => ({ sec, items: rules.filter((r) => r.section === sec) }));

  return (
    <div className="space-y-5">
      {perms.add ? <AddForm /> : null}
      {bySection.map(({ sec, items }) => (
        <Card key={sec}>
          <CardHeader title={ATS_SECTION_LABEL[sec]} description={`${items.length} rule${items.length === 1 ? '' : 's'}`} />
          {items.length === 0 ? (
            <p className="text-sm text-ink-faint">No rules in this section.</p>
          ) : (
            <div className="space-y-2">
              {items.map((r) => (
                <Row key={r.id} rule={r} perms={perms} />
              ))}
            </div>
          )}
        </Card>
      ))}
      {rules.length === 0 ? <EmptyState title="No ATS rules yet" description="Apply admin migration 006 for the starter set." /> : null}
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createAtsRule, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add rule" />
      <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="section">Section</Label>
          <Select id="section" name="section" defaultValue="general">
            {ATS_SECTIONS.map((s) => (
              <option key={s} value={s}>
                {ATS_SECTION_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="importance">Importance</Label>
          <Select id="importance" name="importance" defaultValue="medium">
            {IMPORTANCE.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="rule">Rule</Label>
          <Input id="rule" name="rule" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="guideline">Guideline</Label>
          <Textarea id="guideline" name="guideline" rows={2} />
        </div>
        <div className="w-24">
          <SubmitButton pendingLabel="…">Add</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function Row({ rule, perms }: { rule: Rule; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateAtsRule.bind(null, rule.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <form action={action} className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input name="rule" defaultValue={rule.rule} disabled={!perms.edit} className="min-w-[220px] flex-1" />
            <Select name="importance" defaultValue={rule.importance} disabled={!perms.edit} className="w-28">
              {IMPORTANCE.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
            <Select name="section" defaultValue={rule.section} disabled={!perms.edit} className="w-40">
              {ATS_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {ATS_SECTION_LABEL[s]}
                </option>
              ))}
            </Select>
            <Input name="sort_order" type="number" defaultValue={rule.sort_order} disabled={!perms.edit} className="w-16" />
          </div>
          <Textarea name="guideline" defaultValue={rule.guideline} rows={2} disabled={!perms.edit} />
          {perms.edit ? (
            <div className="w-20">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          ) : (
            <Badge label={rule.importance} tone={IMPORTANCE_TONE[rule.importance] ?? 'neutral'} />
          )}
        </form>
        <div className="flex flex-col items-end gap-2">
          {perms.edit ? (
            <ToggleSwitch checked={rule.is_active} action={toggleAtsRule.bind(null, rule.id)} labelOn="Active" labelOff="Off" />
          ) : (
            <Badge label={rule.is_active ? 'Active' : 'Off'} tone={rule.is_active ? 'success' : 'neutral'} />
          )}
          {perms.delete ? <DeleteButton action={() => deleteAtsRule(rule.id)} confirmMessage="Delete this rule?" /> : null}
        </div>
      </div>
    </div>
  );
}
