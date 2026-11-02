-- SEC-05 admission pause. Preserve all periods, payment claims and integrity
-- guards. Never restore the date-less webhook. Reapply 0159/127 to resume.
lock table public.premium_subscriptions in share row exclusive mode;
revoke execute on function public.activate_premium_subscription(uuid,uuid,text,text,text,text,bigint,text)
  from public, anon, authenticated, service_role;
notify pgrst, 'reload schema';
