/** True when `now` is inside an optional [starts_at, ends_at] window. */
export function inWindow(startsAt: string | null, endsAt: string | null, now = Date.now()): boolean {
  if (startsAt && new Date(startsAt).getTime() > now) return false;
  if (endsAt && new Date(endsAt).getTime() < now) return false;
  return true;
}
