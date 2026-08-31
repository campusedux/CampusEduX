import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { TopicRowActions, TopicAddForm } from '@/app/placement/[key]/TopicManager';
import { QuestionRowActions, QuestionAddForm } from '@/app/placement/[key]/QuestionManager';
import { TestQuestionRowActions, TestQuestionAddForm } from '@/app/placement/[key]/TestQuestionManager';

export const dynamic = 'force-dynamic';

export default async function PlacementCategoryPage({ params }: { params: { key: string } }) {
  const supabase = createClient();

  const [
    { data: category },
    { data: topics, error: topicsError },
    { data: questions, error: questionsError },
    { data: testQuestions, error: testQuestionsError },
  ] = await Promise.all([
    supabase.from('placement_categories').select('*').eq('key', params.key).maybeSingle(),
    supabase.from('placement_topics').select('*').eq('category_key', params.key).order('sort_order'),
    supabase.from('placement_questions').select('*').eq('category_key', params.key).order('sort_order'),
    supabase.from('test_questions').select('*').eq('category_key', params.key).order('sort_order'),
  ]);
  if (topicsError) throw new Error(topicsError.message);
  if (questionsError) throw new Error(questionsError.message);
  if (testQuestionsError) throw new Error(testQuestionsError.message);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/placement" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Placement Preparation
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-ink">{category.label}</h1>
          <Badge label={category.is_active ? 'Active' : 'Inactive'} tone={category.is_active ? 'success' : 'neutral'} />
        </div>
        <p className="text-sm text-ink-muted">{category.sublabel} · route {category.route_key}</p>
      </div>

      <Card>
        <CardHeader title="Topics" description="Category tiles / list rows shown inside this screen (e.g. Aptitude's subject tiles, DSA's category rows, HR's company chips)." />
        {!topics || topics.length === 0 ? (
          <EmptyState title="No topics yet" />
        ) : (
          <div className="mb-4 divide-y divide-border">
            {topics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-ink">{topic.label}</span>
                  <span className="ml-2 text-xs text-ink-faint">
                    {topic.count_label}
                    {topic.difficulty ? ` · ${topic.difficulty}` : ''}
                    {topic.total_count ? ` · ${topic.solved_count ?? 0}/${topic.total_count}` : ''}
                  </span>
                </div>
                <TopicRowActions id={topic.id} categoryKey={params.key} isActive={topic.is_active} />
              </div>
            ))}
          </div>
        )}
        <TopicAddForm categoryKey={params.key} />
      </Card>

      <Card>
        <CardHeader title="Popular Questions" description="Accordion Q&A shown on this category's screen." />
        {!questions || questions.length === 0 ? (
          <EmptyState title="No questions yet" />
        ) : (
          <div className="mb-4 divide-y divide-border">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{q.question}</p>
                  <p className="mt-1 text-xs text-ink-faint">{q.answer}</p>
                </div>
                <QuestionRowActions id={q.id} categoryKey={params.key} isActive={q.is_active} />
              </div>
            ))}
          </div>
        )}
        <QuestionAddForm categoryKey={params.key} />
      </Card>

      <Card>
        <CardHeader
          title="MCQ Test Bank"
          description="Powers the Start Test → Question → Result flow (Aptitude practice tests, Company mock tests, and the general Mock Tests hub)."
        />
        {!testQuestions || testQuestions.length === 0 ? (
          <EmptyState title="No test questions yet" />
        ) : (
          <div className="mb-4 divide-y divide-border">
            {testQuestions.map((q) => (
              <div key={q.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{q.question_text}</p>
                    <Badge label={q.is_active ? 'Active' : 'Inactive'} tone={q.is_active ? 'success' : 'neutral'} />
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">
                    {q.options?.length ?? 0} options · correct: {q.options?.[q.correct_index]}
                    {q.company_name ? ` · ${q.company_name}` : ''}
                    {q.difficulty ? ` · ${q.difficulty}` : ''}
                  </p>
                </div>
                <TestQuestionRowActions id={q.id} categoryKey={params.key} isActive={q.is_active} />
              </div>
            ))}
          </div>
        )}
        <TestQuestionAddForm
          categoryKey={params.key}
          topics={(topics ?? []).map((t) => ({ id: t.id, label: t.label }))}
          usesCompanyName={params.key === 'company'}
        />
      </Card>
    </div>
  );
}
