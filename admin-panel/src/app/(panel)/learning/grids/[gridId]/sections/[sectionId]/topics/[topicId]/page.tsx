import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill, Badge } from '@/components/ui/primitives';
import { getAcademicOptions } from '@/lib/academic-targeting';
import {
  getLearningGrid,
  getLearningSection,
  getLearningTopic,
  getTopicContents,
  getTopicMockTests,
  getTopicCodingProblems,
} from '@/lib/learning/queries';
import { targetingSummary } from '@/lib/learning/constants';
import { learningTopicUrl } from '@/lib/learning/site';
import { PreviewLink } from '@/app/(panel)/learning/_components/shared';
import { TopicForm } from './TopicForm';
import { ContentManager } from './ContentManager';
import { PracticeManager } from './PracticeManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { topicId: string } }) {
  const topic = await getLearningTopic(params.topicId);
  return { title: topic ? `${topic.title} · Learning · CampusEduX Admin` : 'Learning · CampusEduX Admin' };
}

export default async function TopicDetailPage({
  params,
}: {
  params: { gridId: string; sectionId: string; topicId: string };
}) {
  const admin = await requireModule('learning');
  const [grid, section, topic] = await Promise.all([
    getLearningGrid(params.gridId),
    getLearningSection(params.sectionId),
    getLearningTopic(params.topicId),
  ]);
  if (!grid || !section || !topic || section.grid_id !== grid.id || topic.section_id !== section.id) {
    notFound();
  }
  const [contents, options, mockTests, codingProblems] = await Promise.all([
    getTopicContents(topic.id),
    getAcademicOptions(),
    getTopicMockTests(topic.id),
    getTopicCodingProblems(topic.id),
  ]);
  const path = `/learning/grids/${grid.id}/sections/${section.id}/topics/${topic.id}`;
  const published =
    topic.status === 'published' && section.status === 'published' && grid.status === 'published';

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href={`/learning/grids/${grid.id}/sections/${section.id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> {section.name}
        </Link>
        <PageHeader
          title={topic.title}
          subtitle={`${grid.name} → ${section.name} · /learning/${grid.slug}/${topic.slug}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {topic.is_premium ? <Badge label="Premium" tone="warning" /> : null}
              {topic.target_type && topic.target_type !== 'global' ? (
                <Badge label={targetingSummary(topic)} tone="neutral" />
              ) : null}
              <StatusPill status={topic.status} />
              {published && topic.show_on_website && grid.show_on_website && section.show_on_website ? (
                <PreviewLink href={learningTopicUrl(grid.slug, topic.slug)} label="Preview on site" />
              ) : null}
            </div>
          }
        />
      </div>

      {!published ? (
        <p className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-[#B77A1B]">
          This topic is not publicly visible yet. It appears on the Website / Mobile app only when the topic, its
          section and its grid are all <strong>Published</strong> and visible on that platform. Academic targeting and
          premium are enforced by the database on top of that.
        </p>
      ) : null}

      <TopicForm topic={topic} canEdit={admin.perms.learning.edit} options={options} />
      <ContentManager topicId={topic.id} path={path} contents={contents} perms={admin.perms.learning} options={options} />

      <PracticeManager
        topicId={topic.id}
        gridId={grid.id}
        path={path}
        mockTests={mockTests}
        codingProblems={codingProblems}
        perms={admin.perms.learning}
      />
    </div>
  );
}
