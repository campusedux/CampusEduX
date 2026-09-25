import { SectionHeader } from "@/components/ui";
import { CourseCard, type CourseCardData } from "@/components/learning/CourseCard";

/**
 * Home "Popular courses" — published, website-visible Learning grids from the
 * admin panel (`learning_grids_list` RPC), featured ones first, otherwise in
 * the admin's sort order. Renders nothing when there are none.
 */
export function PopularCourses({ courses }: { courses: CourseCardData[] }) {
  if (courses.length === 0) return null;
  const ordered = [...courses].sort((a, b) => Number(b.is_featured) - Number(a.is_featured)).slice(0, 6);
  return (
    <section className="container-page pt-14 sm:pt-20" aria-labelledby="home-courses-title">
      <SectionHeader
        id="home-courses-title"
        eyebrow="Learning"
        title="Popular courses"
        description="Step-by-step tutorials with practice questions and mock tests built in."
        viewAllHref="/learning"
        viewAllLabel="All courses"
      />
      {/* Phone: horizontal snap row (a peek of the next card invites the swipe); sm+: grid. */}
      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {ordered.map((c) => (
          <CourseCard key={c.id} course={c} className="w-[82%] flex-shrink-0 snap-start sm:w-auto" />
        ))}
      </div>
    </section>
  );
}

export default PopularCourses;
