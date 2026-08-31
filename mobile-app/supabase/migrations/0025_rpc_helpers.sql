-- Fixes: verify-razorpay-payment needs an atomic "sales_count = sales_count + 1"
--        that supabase-js cannot express directly (it would need a read-modify-
--        write round trip and could lose concurrent increments).
--
-- These helpers are called only by the Edge Functions with the service-role
-- key, so execute is granted to service_role only.
--
-- Apply with: supabase db push   (or Dashboard -> SQL Editor -> paste + Run)

create or replace function public.increment_project_sales_count(p_project_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.projects
     set sales_count = sales_count + 1
   where id = p_project_id;
$$;

revoke all on function public.increment_project_sales_count(text) from public, anon, authenticated;
grant execute on function public.increment_project_sales_count(text) to service_role;

notify pgrst, 'reload schema';
