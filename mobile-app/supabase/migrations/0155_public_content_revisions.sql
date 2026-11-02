-- PREPARED ONLY. Canonical remote owner: mobile 0155; admin 123 is a harness twin.
-- Intended staging executor: Supabase CLI 2.54.11 migration up, an isolated
-- reviewed bundle with ONLY 0155 pending. ExecBatch includes its ledger insert
-- in one implicit transaction. Do not add BEGIN/COMMIT or run statement-by-statement.
-- Local failure tests use psql -X --single-transaction -v ON_ERROR_STOP=1.
-- Exact staging bundle/ledger preflight: docs/performance/scalability-phase-2.md.
-- Existing content RLS/RPCs/grants are unchanged. These rows contain no content.
create table if not exists public.public_content_revisions (
  scope text primary key check (scope in ('learning', 'blog', 'home')),
  revision uuid not null default gen_random_uuid()
);
alter table public.public_content_revisions enable row level security;
revoke all on public.public_content_revisions from public, anon, authenticated, service_role;
insert into public.public_content_revisions(scope) values ('learning'), ('blog'), ('home')
  on conflict (scope) do nothing;

-- Statement triggers cover admin, SQL imports, cascades and TRUNCATE atomically.
-- UUIDs avoid timestamp collisions and token reuse following re-creation.
create or replace function public.bump_public_content_revision()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  update public.public_content_revisions set revision = gen_random_uuid()
    where scope = TG_ARGV[0];
  if not found then raise exception 'Public content revision contract is missing'; end if;
  return null;
end;
$$;
revoke all on function public.bump_public_content_revision() from public, anon, authenticated, service_role;

create or replace function public.public_content_revision(p_scope text)
returns uuid language plpgsql stable security definer set search_path = pg_catalog as $$
declare token uuid;
begin
  if p_scope not in ('learning', 'blog', 'home') or p_scope is null then
    raise exception 'Invalid public content scope' using errcode = '22023';
  end if;
  select revision into token from public.public_content_revisions where scope = p_scope;
  if token is null then raise exception 'Public content revision contract is missing'; end if;
  return token;
end;
$$;
revoke all on function public.public_content_revision(text) from public, anon, authenticated, service_role;
grant execute on function public.public_content_revision(text) to anon;

do $$
declare item record;
begin
  for item in select * from (values
    ('learning', 'learning_grids'), ('learning', 'learning_sections'),
    ('learning', 'learning_topics'), ('learning', 'learning_contents'),
    ('learning', 'practice_tests'), ('learning', 'dsa_problems'),
    ('blog', 'blog_posts'), ('blog', 'blog_categories'),
    ('home', 'projects'), ('home', 'testimonials'), ('home', 'faqs'), ('home', 'banners')
  ) as dependencies(scope, relation)
  loop
    execute format('drop trigger if exists public_revision_%I on public.%I', item.scope, item.relation);
    execute format('create trigger public_revision_%I after insert or update or delete or truncate on public.%I
      for each statement execute function public.bump_public_content_revision(%L)',
      item.scope, item.relation, item.scope);
  end loop;
end;
$$;

-- Reapplication/twins rotate tokens, preserving safety across reinstallation.
-- Future RPC/RLS/grant changes must rotate affected revisions in their transaction.
update public.public_content_revisions set revision = gen_random_uuid();
notify pgrst, 'reload schema';
