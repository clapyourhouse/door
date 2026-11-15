-- Door Travel: M1 schema
-- Clients may only read cities, read their own handoffs, and insert pass_interest.
-- Quota tables (usage, passes) and all counters are reachable only through the service role.

create table public.cities (
  id text primary key,
  name_ja text not null,
  name_en text not null,
  lat double precision not null,
  lng double precision not null,
  intro_ja text not null,
  intro_en text not null,
  guide_notes text not null default '',
  active boolean not null default true,
  sort int not null default 0
);
alter table public.cities enable row level security;
create policy cities_read on public.cities for select using (active);

create table public.usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_used int not null default 0,
  day date,
  day_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.usage enable row level security;

create table public.passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source text not null default 'manual',
  purchase_token text unique,
  created_at timestamptz not null default now()
);
create index passes_user_expires_idx on public.passes (user_id, expires_at desc);
alter table public.passes enable row level security;

create table public.handoffs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city_id text references public.cities(id),
  lang text not null default 'en',
  question text not null,
  context jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open','answered','closed')),
  reply text,
  created_at timestamptz not null default now(),
  replied_at timestamptz
);
create index handoffs_user_created_idx on public.handoffs (user_id, created_at desc);
alter table public.handoffs enable row level security;
create policy handoffs_read_own on public.handoffs for select using (user_id = auth.uid());

-- Writing a reply in the table editor marks the handoff answered.
create or replace function public.handoffs_mark_answered() returns trigger
language plpgsql as $$
begin
  if new.reply is not null and new.reply is distinct from old.reply then
    new.replied_at := now();
    if new.status = 'open' then new.status := 'answered'; end if;
  end if;
  return new;
end $$;
create trigger handoffs_answered before update on public.handoffs
  for each row execute function public.handoffs_mark_answered();

create table public.pass_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  city_id text,
  lang text,
  created_at timestamptz not null default now()
);
alter table public.pass_interest enable row level security;
create policy pass_interest_insert_own on public.pass_interest
  for insert with check (user_id = auth.uid());

-- Atomically spend one AI question. Day boundaries are Japan time.
create or replace function public.consume_question(p_user uuid, p_free_limit int, p_daily_limit int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u public.usage%rowtype;
  today date := (now() at time zone 'Asia/Tokyo')::date;
  pass_exp timestamptz;
begin
  insert into public.usage(user_id) values (p_user) on conflict (user_id) do nothing;
  select * into u from public.usage where user_id = p_user for update;
  select max(expires_at) into pass_exp from public.passes where user_id = p_user and expires_at > now();
  if u.day is distinct from today then
    u.day := today; u.day_used := 0;
  end if;

  if pass_exp is not null then
    if u.day_used >= p_daily_limit then
      update public.usage set day = u.day, day_used = u.day_used, updated_at = now() where user_id = p_user;
      return jsonb_build_object('allowed', false, 'reason', 'daily_limit', 'mode', 'pass',
        'pass_expires', pass_exp, 'daily_remaining', 0);
    end if;
    update public.usage set day = u.day, day_used = u.day_used + 1, updated_at = now() where user_id = p_user;
    return jsonb_build_object('allowed', true, 'mode', 'pass',
      'pass_expires', pass_exp, 'daily_remaining', p_daily_limit - (u.day_used + 1));
  end if;

  if u.free_used >= p_free_limit then
    return jsonb_build_object('allowed', false, 'reason', 'free_limit', 'mode', 'free', 'free_remaining', 0);
  end if;
  update public.usage set free_used = free_used + 1, updated_at = now() where user_id = p_user;
  return jsonb_build_object('allowed', true, 'mode', 'free', 'free_remaining', p_free_limit - (u.free_used + 1));
end $$;

-- Give back a question when the AI call failed.
create or replace function public.refund_question(p_user uuid, p_mode text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_mode = 'pass' then
    update public.usage set day_used = greatest(day_used - 1, 0), updated_at = now() where user_id = p_user;
  else
    update public.usage set free_used = greatest(free_used - 1, 0), updated_at = now() where user_id = p_user;
  end if;
end $$;

-- Check the human-handoff allowance and insert the handoff in one transaction.
-- Free users: p_free_limit handoffs in total. Pass holders: p_pass_daily_limit per Japan day.
create or replace function public.register_handoff(
  p_user uuid, p_city text, p_lang text, p_question text, p_context jsonb,
  p_free_limit int, p_pass_daily_limit int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  pass_exp timestamptz;
  used int;
  new_id uuid;
  day_start timestamptz := (date_trunc('day', now() at time zone 'Asia/Tokyo')) at time zone 'Asia/Tokyo';
begin
  insert into public.usage(user_id) values (p_user) on conflict (user_id) do nothing;
  perform 1 from public.usage where user_id = p_user for update;
  select max(expires_at) into pass_exp from public.passes where user_id = p_user and expires_at > now();

  if pass_exp is not null then
    select count(*) into used from public.handoffs where user_id = p_user and created_at >= day_start;
    if used >= p_pass_daily_limit then
      return jsonb_build_object('allowed', false, 'reason', 'handoff_daily_limit');
    end if;
  else
    select count(*) into used from public.handoffs where user_id = p_user;
    if used >= p_free_limit then
      return jsonb_build_object('allowed', false, 'reason', 'handoff_free_limit');
    end if;
  end if;

  insert into public.handoffs(user_id, city_id, lang, question, context)
  values (p_user, p_city, p_lang, p_question, coalesce(p_context, '[]'::jsonb))
  returning id into new_id;
  return jsonb_build_object('allowed', true, 'id', new_id, 'handoff_remaining',
    case when pass_exp is not null then p_pass_daily_limit - (used + 1) else p_free_limit - (used + 1) end);
end $$;

revoke all on function public.consume_question(uuid, int, int) from public, anon, authenticated;
revoke all on function public.refund_question(uuid, text) from public, anon, authenticated;
revoke all on function public.register_handoff(uuid, text, text, text, jsonb, int, int) from public, anon, authenticated;
grant execute on function public.consume_question(uuid, int, int) to service_role;
grant execute on function public.refund_question(uuid, text) to service_role;
grant execute on function public.register_handoff(uuid, text, text, text, jsonb, int, int) to service_role;

-- Initial cities (editable in the table editor; no app release needed to add more).
insert into public.cities (id, name_ja, name_en, lat, lng, intro_ja, intro_en, guide_notes, sort) values
 ('tokyo-shibuya','東京・渋谷','Tokyo · Shibuya',35.6595,139.7005,
  '渋谷へようこそ。駅前のスクランブル交差点は、青信号のたびに大勢が一斉に渡ります。',
  'Welcome to Shibuya. The famous scramble crossing in front of the station fills with people every time the light turns green.',
  'Shibuya Scramble Crossing, Hachiko statue, Shibuya Sky observation deck, shopping and nightlife, Meiji Shrine and Yoyogi Park are a walk or short train ride away. The station is a large, confusing complex.',10),
 ('tokyo-asakusa','東京・浅草','Tokyo · Asakusa',35.7111,139.7964,
  '浅草へようこそ。雷門から仲見世通りを抜けると浅草寺に着きます。',
  'Welcome to Asakusa. Walk through Kaminarimon gate and down Nakamise street to reach Senso-ji temple.',
  'Kaminarimon, Nakamise shopping street, Senso-ji temple, Sumida River and Tokyo Skytree views, traditional snacks and rickshaw rides. Crowded in the daytime; calmer early morning and evening.',20),
 ('kyoto-gion','京都・祇園','Kyoto · Gion',35.0035,135.7751,
  '京都の祇園へようこそ。このあたりでは町家が並ぶ通りを歩けます。',
  'Welcome to Gion in Kyoto. Streets here are lined with traditional machiya townhouses.',
  'Gion district, Hanamikoji street, Yasaka Shrine, Kiyomizu-dera and Higashiyama are nearby. Be respectful of residents and of geiko and maiko; photography rules apply on private lanes. Buses are crowded; walking and trains are often better.',30),
 ('osaka-dotonbori','大阪・道頓堀','Osaka · Dotonbori',34.6687,135.5014,
  '大阪の道頓堀へようこそ。戎橋の周りには看板が並び、川沿いも歩けます。',
  'Welcome to Dotonbori in Osaka. Signs light up the area around Ebisu Bridge, and you can walk along the canal.',
  'Dotonbori canal, Glico sign, Ebisu Bridge, street food such as takoyaki and okonomiyaki, Namba and Shinsaibashi shopping. Very busy in the evening. Osaka Castle and Universal Studios Japan are reachable by train.',40),
 ('sapporo-odori','北海道・札幌','Hokkaido · Sapporo',43.0605,141.3564,
  '札幌へようこそ。大通公園の東端にはさっぽろテレビ塔があります。',
  'Welcome to Sapporo. The Sapporo TV Tower stands at the east end of Odori Park.',
  'Odori Park, Sapporo TV Tower, Susukino nightlife, ramen and seafood, Nijo Market, Otaru and Jozankei are day-trip options. Winters are very cold and snowy; check transport conditions.',50),
 ('fukuoka-nakasu','福岡・中洲','Fukuoka · Nakasu',33.5917,130.4058,
  '福岡の中洲へようこそ。那珂川沿いには夜になると屋台が並びます。',
  'Welcome to Nakasu in Fukuoka. Food stalls (yatai) line the Naka River in the evening.',
  'Nakasu yatai stalls, Hakata ramen and mentaiko, Canal City, Tenjin shopping, Dazaifu Tenmangu is a day trip. The airport is very close to the city center by subway.',60),
 ('hiroshima-peace-park','広島・平和記念公園','Hiroshima · Peace Memorial Park',34.3955,132.4536,
  '広島の平和記念公園へようこそ。近くに原爆ドームがあります。',
  'Welcome to Hiroshima Peace Memorial Park. The Atomic Bomb Dome is nearby.',
  'Peace Memorial Park and Museum, Atomic Bomb Dome, Hiroshima Castle, okonomiyaki Hiroshima style, Miyajima and Itsukushima Shrine are reachable by tram and ferry. Be respectful at memorial sites.',70),
 ('naha-kokusai-dori','沖縄・那覇 国際通り','Okinawa · Naha Kokusai-dori',26.2146,127.6859,
  '那覇の国際通りへようこそ。お土産店や飲食店が並ぶ、にぎやかな通りです。',
  'Welcome to Kokusai-dori in Naha, a lively street of souvenir shops and restaurants.',
  'Kokusai-dori, Makishi Public Market, Shuri Castle area, Okinawan food such as soki soba and goya champuru, beaches and Churaumi Aquarium need a car or bus. Typhoon season can disrupt transport.',80)
on conflict (id) do update set
  name_ja = excluded.name_ja, name_en = excluded.name_en, lat = excluded.lat, lng = excluded.lng,
  intro_ja = excluded.intro_ja, intro_en = excluded.intro_en, guide_notes = excluded.guide_notes, sort = excluded.sort;
