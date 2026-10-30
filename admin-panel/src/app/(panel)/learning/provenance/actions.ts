'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit';

const TYPES = ['learning_contents', 'interview_questions', 'practice_tests', 'test_questions', 'dsa_problems'] as const;
const STATUSES = ['unverified', 'review_required', 'verified_original', 'verified_licensed', 'blocked'] as const;
const QUALITIES = ['unreviewed', 'review_required', 'reviewed'] as const;

export async function saveContentProvenance(fd: FormData): Promise<void> {
  const admin = await requireAdmin();
  if (admin.role !== 'super_admin') throw new Error('Only a super admin may record rights decisions.');
  const value = (key: string) => String(fd.get(key) ?? '').trim();
  const resource_type = value('resource_type');
  const resource_id = value('resource_id');
  const rights_status = value('rights_status');
  const quality_status = value('quality_status');
  if (!TYPES.includes(resource_type as typeof TYPES[number]) || !resource_id ||
      !STATUSES.includes(rights_status as typeof STATUSES[number]) ||
      !QUALITIES.includes(quality_status as typeof QUALITIES[number])) {
    throw new Error('Invalid content review request.');
  }
  const supabase = createClient();
  const { data: item, error: lookupError } = await supabase.from(resource_type).select('id').eq('id', resource_id).maybeSingle();
  if (lookupError || !item) throw new Error('Content item not found.');
  const payload = {
    resource_type, resource_id, rights_status, quality_status,
    creator: value('creator') || null,
    creation_method: value('creation_method') || null,
    source_dependencies: value('source_dependencies') || null,
    rights_basis: value('rights_basis') || null,
    license_evidence_ref: value('license_evidence_ref') || null,
    review_notes: value('review_notes') || null,
  };
  if (rights_status.startsWith('verified_') &&
      (!payload.creator || !payload.creation_method || !payload.rights_basis || !payload.license_evidence_ref)) {
    throw new Error('Creator, method, rights basis, and private evidence reference are required for verification.');
  }
  const { error } = await supabase.from('educational_content_provenance').upsert(payload, {
    onConflict: 'resource_type,resource_id',
  });
  if (error) throw new Error(error.message);
  await logActivity({ action: 'learning.provenance.review', module: 'learning', resourceType: resource_type, resourceId: resource_id });
  revalidatePath('/learning/provenance');
  redirect(`/learning/provenance?resource_type=${encodeURIComponent(resource_type)}&resource_id=${encodeURIComponent(resource_id)}&saved=1`);
}
