-- 2026-11-16: after the total free questions are used, allow p_free_daily more per Japan day
-- (free users only). Pass holders are unchanged. Default 0 keeps the old behaviour.
drop function if exists public.consume_question(uuid, int, int);
create or replace function public.consume_question(p_user uuid, p_free_limit int, p_daily_limit int, p_free_daily int default 0)
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
    if p_free_daily > 0 then
      if u.day_used >= p_free_daily then
        update public.usage set day = u.day, day_used = u.day_used, updated_at = now() where user_id = p_user;
        return jsonb_build_object('allowed', false, 'reason', 'free_daily_limit', 'mode', 'free_daily', 'daily_remaining', 0);
      end if;
      update public.usage set day = u.day, day_used = u.day_used + 1, updated_at = now() where user_id = p_user;
      return jsonb_build_object('allowed', true, 'mode', 'free_daily', 'daily_remaining', p_free_daily - (u.day_used + 1));
    end if;
    return jsonb_build_object('allowed', false, 'reason', 'free_limit', 'mode', 'free', 'free_remaining', 0);
  end if;
  update public.usage set free_used = free_used + 1, updated_at = now() where user_id = p_user;
  return jsonb_build_object('allowed', true, 'mode', 'free', 'free_remaining', p_free_limit - (u.free_used + 1));
end $$;

create or replace function public.refund_question(p_user uuid, p_mode text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_mode in ('pass', 'free_daily') then
    update public.usage set day_used = greatest(day_used - 1, 0), updated_at = now() where user_id = p_user;
  else
    update public.usage set free_used = greatest(free_used - 1, 0), updated_at = now() where user_id = p_user;
  end if;
end $$;

revoke all on function public.consume_question(uuid, int, int, int) from public, anon, authenticated;
grant execute on function public.consume_question(uuid, int, int, int) to service_role;
