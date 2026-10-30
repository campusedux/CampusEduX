-- Restore the Spring Boot Tutorial website visibility flag after the scoped staging update.
-- Run only against the verified staging project biktjhenbvnklmagmvav.
UPDATE public.learning_grids
SET show_on_website = false
WHERE id = '8ff43611-9144-4145-9869-816dff7209f3'
  AND slug = 'spring-boot-tutorial'
  AND source_kind = 'seed'
  AND source_ref = 'spring_boot_tutorial'
  AND status = 'published'
  AND show_on_website = true
RETURNING id, slug, show_on_website;
