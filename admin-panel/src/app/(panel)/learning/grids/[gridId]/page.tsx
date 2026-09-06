import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill, Badge } from '@/components/ui/primitives';
import { getAcademicOptions } from '@/lib/academic-targeting';
import { getLearningGrid, getGridSections } from '@/lib/learning/queries';
import { GRID_TYPE_LABEL, targetingSummary } from '@/lib/learning/constants';
import { learningGridUrl } from '@/lib/learning/site';
import { PreviewLink } from '@/app/(panel)/learning/_components/shared';
import { GridForm } from './GridForm';
import { SectionManager } from './SectionManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { gridId: string } }) {
  const grid = await getLearningGrid(params.gridId);
  return { title: grid ? `${grid.name} · Learning · CampusEduX Admin` : 'Learning · CampusEduX Admin' };
}

export default async function GridDetailPage({ params }: { params: { gridId: string } }) {
  const admin = await requireModule('learning');
  const grid = await getLearningGrid(params.gridId);
  if (!grid) notFound();

  const [sections, options] = await Promise.all([getGridSections(grid.id), getAcademicOptions()]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/learning" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Learning
        </Link>
        <PageHeader
          title={grid.name}
          subtitle={`${GRID_TYPE_LABEL[grid.grid_type]} grid · /learning/${grid.slug}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={GRID_TYPE_LABEL[grid.grid_type]} tone="info" />
              {grid.is_premium ? <Badge label="Premium" tone="warning" /> : null}
              <Badge label={targetingSummary(grid)} tone="neutral" />
              <StatusPill status={grid.status} />
              {grid.status === 'published' && grid.show_on_website ? (
                <PreviewLink href={learningGridUrl(grid.slug)} label="Preview on site" />
              ) : null}
            </div>
          }
        />
      </div>

      <GridForm grid={grid} canEdit={admin.perms.learning.edit} options={options} />

      <SectionManager gridId={grid.id} gridSlug={grid.slug} sections={sections} perms={admin.perms.learning} />
    </div>
  );
}
