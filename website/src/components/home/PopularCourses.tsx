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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}
      </div>
    </section>
  );
}

export default PopularCourses;
