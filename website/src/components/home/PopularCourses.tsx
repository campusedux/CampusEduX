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
    <section className="container-page pt-10 md:pt-14 max-md:pt-8" aria-labelledby="home-courses-title">
      <SectionHeader
        id="home-courses-title"
        title="Featured courses"
        viewAllHref="/learning"
        viewAllLabel="All courses"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-md:-mx-4 max-md:!flex max-md:snap-x max-md:snap-mandatory max-md:gap-3 max-md:overflow-x-auto max-md:px-4 mobile-scrollbar-hide">
        {ordered.map((c) => (
          <CourseCard key={c.id} course={c} variant="featured" />
        ))}
      </div>
    </section>
  );
}

export default PopularCourses;
