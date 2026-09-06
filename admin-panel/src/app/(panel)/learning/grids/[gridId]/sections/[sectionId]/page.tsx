import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/primitives';
import { getLearningGrid, getLearningSection, getSectionTopics } from '@/lib/learning/queries';
import { SectionForm } from './SectionForm';
import { TopicManager } from './TopicManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { sectionId: string } }) {
  const section = await getLearningSection(params.sectionId);
  return { title: section ? `${section.name} · Learning · CampusEduX Admin` : 'Learning · CampusEduX Admin' };
}

export default async function SectionDetailPage({
  params,
}: {
  params: { gridId: string; sectionId: string };
}) {
  const admin = await requireModule('learning');
  const [grid, section] = await Promise.all([
    getLearningGrid(params.gridId),
    getLearningSection(params.sectionId),
  ]);
  if (!grid || !section || section.grid_id !== grid.id) notFound();
  const topics = await getSectionTopics(section.id);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href={`/learning/grids/${grid.id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> {grid.name}
        </Link>
        <PageHeader
          title={section.name}
          subtitle={`Section in ${grid.name} · /learning/${grid.slug}`}
          action={<StatusPill status={section.status} />}
        />
      </div>

      <SectionForm section={section} canEdit={admin.perms.learning.edit} />
      <TopicManager
        gridId={grid.id}
        sectionId={section.id}
        topics={topics}
        perms={admin.perms.learning}
      />
    </div>
  );
}
