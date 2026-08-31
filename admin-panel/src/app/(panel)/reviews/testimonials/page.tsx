import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getTestimonials } from '@/lib/reviews/queries';
import { TestimonialManager } from './TestimonialManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Testimonials · CampusEduX Admin' };

export default async function TestimonialsPage() {
  const admin = await requireModule('reviews');
  const items = await getTestimonials();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/reviews" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Reviews & Ratings
        </Link>
        <PageHeader title="Testimonials" subtitle="Curated quotes shown on marketing pages in the app." />
      </div>
      <TestimonialManager items={items} perms={admin.perms.reviews} />
    </div>
  );
}
