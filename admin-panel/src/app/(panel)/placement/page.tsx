import { redirect } from 'next/navigation';

/**
 * The standalone "Placement (legacy)" section was retired together with the
 * specialised Learning grids (migration 036/0064). What survives under
 * `/placement/*` — the mock-test list, its question editor and attempt results —
 * exists only to serve Learning topic practice and is reached from a topic's
 * "Manage questions" link, not from navigation. This index just bounces to the
 * Learning CMS.
 */
export default function PlacementIndexRedirect() {
  redirect('/learning');
}
