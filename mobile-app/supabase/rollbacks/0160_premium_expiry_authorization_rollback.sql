-- SEC-06 safe admission pause: deny premium access rather than restore the
-- stale-flag bypass. Existing independent admin permissions remain in place.
-- Preserve all subscriptions, dates, payments, claims, SEC-05 guards and the
-- non-authoritative mirror. Reapply 0160/128 transactionally to resume access.
create or replace function public.current_user_is_premium()
returns boolean
language sql stable security definer set search_path = pg_catalog, public
as $$ select false; $$;
revoke all on function public.current_user_is_premium()
  from public, anon, authenticated, service_role;
grant execute on function public.current_user_is_premium() to anon, authenticated;
notify pgrst, 'reload schema';
