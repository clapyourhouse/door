-- Door Travel: growth tooling (events, survey, staff presence) and Stripe pass grants.

-- ---- events: funnel measurement (write-only for users) ----
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  ref text check (ref is null or char_length(ref) <= 40),
  campaign text check (campaign is null or char_length(campaign) <= 60),
  city_id text,
  lang text,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index events_name_created_idx on public.events (name, created_at);
create index events_ref_idx on public.events (ref);
alter table public.events enable row level security;
create policy events_insert_own on public.events for insert to authenticated
  with check (user_id = auth.uid());

-- ---- feedback: short survey ----
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  trip_when text check (trip_when is null or char_length(trip_when) <= 40),
  pain text check (pain is null or char_length(pain) <= 1000),
  would_pay text check (would_pay is null or would_pay in ('yes','maybe','no')),
  email text check (email is null or char_length(email) <= 200),
  android_tester boolean not null default false,
  lang text,
  ref text check (ref is null or char_length(ref) <= 40),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create policy feedback_insert_own on public.feedback for insert to authenticated
  with check (user_id = auth.uid());

-- ---- staff presence: one row, flipped by hand in the table editor ----
create table public.staff_status (
  id smallint primary key default 1 check (id = 1),
  online boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.staff_status (id, online) values (1, false);
alter table public.staff_status enable row level security;
create policy staff_status_read on public.staff_status for select to anon, authenticated using (true);

-- ---- Stripe: idempotent pass grant ----
create table public.stripe_events (
  id text primary key,
  created_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- p_ref is the Checkout Session id, so a retried or duplicated webhook never grants twice.
create or replace function public.grant_pass(p_user uuid, p_days int, p_ref text, p_source text default 'stripe')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  n int;
  base timestamptz;
  new_exp timestamptz;
begin
  insert into public.stripe_events (id) values (p_ref) on conflict do nothing;
  get diagnostics n = row_count;
  if n = 0 then
    return jsonb_build_object('granted', false, 'reason', 'duplicate');
  end if;
  select greatest(now(), coalesce(max(expires_at), now())) into base from public.passes where user_id = p_user;
  new_exp := base + make_interval(days => p_days);
  insert into public.passes (user_id, starts_at, expires_at, source, purchase_token)
    values (p_user, now(), new_exp, p_source, p_ref);
  return jsonb_build_object('granted', true, 'expires_at', new_exp);
exception when foreign_key_violation then
  return jsonb_build_object('granted', false, 'reason', 'unknown_user');
end $$;

revoke all on function public.grant_pass(uuid, int, text, text) from public, anon, authenticated;
grant execute on function public.grant_pass(uuid, int, text, text) to service_role;

-- ---- explicit grants (so the app also works when "automatically expose new tables" is off) ----
-- Row-level security still decides which rows each role can touch.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.cities to anon, authenticated;
grant select on public.handoffs to authenticated;
grant insert on public.pass_interest to authenticated;
grant insert on public.events to authenticated;
grant insert on public.feedback to authenticated;
grant select on public.staff_status to anon, authenticated;
grant all on all tables in schema public to service_role;
