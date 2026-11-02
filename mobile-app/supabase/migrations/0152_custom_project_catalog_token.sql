-- Keep the existing per-type token contract while allowing admin catalog edits.
-- Invoker security preserves the caller's existing grants and RLS.
create or replace function public.sync_custom_project_catalog_token()
returns trigger language plpgsql set search_path = public as $$
begin
  update public.custom_project_pricing
     set token_amount = new.token_amount
   where project_type = new.project_type
     and project_level <> new.project_level
     and token_amount is distinct from new.token_amount;
  return new;
end;
$$;
revoke all on function public.sync_custom_project_catalog_token() from public, anon;
drop trigger if exists custom_project_catalog_token_sync on public.custom_project_pricing;
create trigger custom_project_catalog_token_sync
  after update of token_amount on public.custom_project_pricing
  for each row execute function public.sync_custom_project_catalog_token();
