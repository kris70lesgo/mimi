-- Account-backed hearts, XP, and paid one-day heart passes.
-- Browser clients can read their records but must use the RPCs below to mutate learning balances.

alter table public.learning_progress
  add column if not exists daily_heart_grant_date date not null default current_date;

create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  event_type text not null check (event_type in ('correct_activity', 'lesson_completion', 'bonus')),
  amount integer not null check (amount > 0),
  lesson_id text,
  activity_id text,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);
create index xp_events_user_created_idx on public.xp_events(user_id, created_at desc);

create table public.heart_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  event_type text not null check (event_type in ('daily_grant', 'mistake', 'mistake_protected', 'pass_activated')),
  change smallint not null check (change between -5 and 5),
  hearts_after smallint not null check (hearts_after between 0 and 5),
  lesson_id text,
  activity_id text,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);
create index heart_events_user_created_idx on public.heart_events(user_id, created_at desc);

create table public.heart_pass_products (
  sku text primary key,
  title text not null,
  duration_hours smallint not null check (duration_hours between 1 and 168),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd' check (currency = lower(currency)),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_sku text not null references public.heart_pass_products(sku),
  provider text not null check (provider in ('stripe')),
  provider_checkout_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd' check (currency = lower(currency)),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'expired')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index payment_orders_user_created_idx on public.payment_orders(user_id, created_at desc);

create table public.heart_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_sku text not null references public.heart_pass_products(sku),
  payment_order_id uuid unique references public.payment_orders(id) on delete set null,
  source text not null check (source in ('stripe', 'admin_grant')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index heart_entitlements_active_idx on public.heart_entitlements(user_id, ends_at desc);

alter table public.xp_events enable row level security;
alter table public.heart_events enable row level security;
alter table public.heart_pass_products enable row level security;
alter table public.payment_orders enable row level security;
alter table public.heart_entitlements enable row level security;

create policy "Users read own XP events" on public.xp_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read own heart events" on public.heart_events for select to authenticated using ((select auth.uid()) = user_id);
create policy "Anyone reads active heart pass products" on public.heart_pass_products for select to anon, authenticated using (active);
create policy "Users read own payment orders" on public.payment_orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users read own heart entitlements" on public.heart_entitlements for select to authenticated using ((select auth.uid()) = user_id);

-- Disable client-controlled economics. The RPCs below run with narrowly scoped, authenticated checks.
drop policy if exists "Users update own progress" on public.learning_progress;
drop policy if exists "Users add own attempts" on public.lesson_attempts;
drop policy if exists "Users manage own completions" on public.lesson_completions;
revoke update on public.learning_progress from authenticated;
revoke insert on public.lesson_attempts from authenticated;
revoke insert, update, delete on public.lesson_completions from authenticated;

create or replace function public.refresh_daily_hearts()
returns table (hearts smallint, unlimited_hearts_until timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_hearts smallint;
  v_unlimited_until timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;

  select max(ends_at) into v_unlimited_until
  from public.heart_entitlements
  where user_id = v_user_id and starts_at <= now() and ends_at > now();

  update public.learning_progress
  set hearts = 5,
      daily_heart_grant_date = current_date
  where user_id = v_user_id and daily_heart_grant_date < current_date
  returning hearts into v_hearts;

  if found then
    insert into public.heart_events (user_id, event_key, event_type, change, hearts_after)
    values (v_user_id, 'daily:' || current_date::text, 'daily_grant', 5, v_hearts)
    on conflict (user_id, event_key) do nothing;
  else
    select p.hearts into v_hearts from public.learning_progress p where p.user_id = v_user_id;
  end if;

  return query select v_hearts, v_unlimited_until;
end;
$$;

create or replace function public.record_learning_result(
  p_lesson_id text,
  p_activity_id text,
  p_activity_kind text,
  p_correct boolean,
  p_answer jsonb default null,
  p_concept text default null,
  p_is_final boolean default false,
  p_score smallint default null
)
returns table (
  xp integer,
  hearts smallint,
  daily_xp integer,
  completed_lessons jsonb,
  mastery jsonb,
  unlimited_hearts_until timestamptz,
  awarded_xp integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_unlimited_until timestamptz;
  v_award integer := 0;
  v_activity_award integer := 0;
  v_completion_award integer := 0;
  v_heart_event_created boolean := false;
  v_current_hearts smallint;
begin
  if v_user_id is null then
    raise exception 'Authentication is required';
  end if;
  if coalesce(trim(p_lesson_id), '') = '' or coalesce(trim(p_activity_id), '') = '' then
    raise exception 'A lesson and activity id are required';
  end if;
  if p_score is not null and (p_score < 0 or p_score > 100) then
    raise exception 'Score must be between 0 and 100';
  end if;

  perform public.refresh_daily_hearts();
  select max(ends_at) into v_unlimited_until
  from public.heart_entitlements
  where user_id = v_user_id and starts_at <= now() and ends_at > now();
  select p.hearts into v_current_hearts from public.learning_progress p where p.user_id = v_user_id for update;

  if not p_correct and v_current_hearts = 0 and v_unlimited_until is null then
    raise exception 'No hearts remaining';
  end if;

  insert into public.lesson_attempts (user_id, lesson_id, activity_id, activity_kind, correct, answer)
  values (v_user_id, p_lesson_id, p_activity_id, p_activity_kind, p_correct, p_answer);

  if p_correct then
    insert into public.xp_events (user_id, event_key, event_type, amount, lesson_id, activity_id)
    values (v_user_id, 'activity:' || p_activity_id || ':correct', 'correct_activity', 10, p_lesson_id, p_activity_id)
    on conflict (user_id, event_key) do nothing
    returning amount into v_activity_award;
    v_award := v_award + coalesce(v_activity_award, 0);
  else
    insert into public.heart_events (user_id, event_key, event_type, change, hearts_after, lesson_id, activity_id)
    values (
      v_user_id,
      'mistake:' || p_activity_id,
      case when v_unlimited_until is null then 'mistake' else 'mistake_protected' end,
      case when v_unlimited_until is null then -1 else 0 end,
      case when v_unlimited_until is null then greatest(v_current_hearts - 1, 0) else v_current_hearts end,
      p_lesson_id,
      p_activity_id
    )
    on conflict (user_id, event_key) do nothing
    returning true into v_heart_event_created;
  end if;

  if p_is_final then
    insert into public.xp_events (user_id, event_key, event_type, amount, lesson_id)
    values (v_user_id, 'lesson:' || p_lesson_id || ':completion', 'lesson_completion', 50, p_lesson_id)
    on conflict (user_id, event_key) do nothing
    returning amount into v_completion_award;
    v_award := v_award + coalesce(v_completion_award, 0);

    insert into public.lesson_completions (user_id, lesson_id, best_score, completed_at)
    values (v_user_id, p_lesson_id, coalesce(p_score, 0), now())
    on conflict (user_id, lesson_id) do update
    set best_score = greatest(public.lesson_completions.best_score, excluded.best_score),
        completed_at = now();
  end if;

  update public.learning_progress
  set xp = xp + v_award,
      daily_xp = daily_xp + v_award,
      hearts = case when not p_correct and v_unlimited_until is null and coalesce(v_heart_event_created, false) then greatest(hearts - 1, 0) else hearts end,
      mastery = case
        when p_correct and coalesce(trim(p_concept), '') <> '' then jsonb_set(
          mastery,
          array[p_concept],
          to_jsonb(least(100, coalesce((mastery ->> p_concept)::integer, 0) + 12)),
          true
        )
        else mastery
      end,
      completed_lessons = case
        when p_is_final and not (completed_lessons @> jsonb_build_array(p_lesson_id)) then completed_lessons || jsonb_build_array(p_lesson_id)
        else completed_lessons
      end
  where user_id = v_user_id
  returning learning_progress.xp, learning_progress.hearts, learning_progress.daily_xp, learning_progress.completed_lessons, learning_progress.mastery
  into xp, hearts, daily_xp, completed_lessons, mastery;

  insert into public.daily_activity (user_id, activity_date, xp_earned, lessons_completed)
  values (v_user_id, current_date, v_award, case when p_is_final then 1 else 0 end)
  on conflict (user_id, activity_date) do update
  set xp_earned = public.daily_activity.xp_earned + excluded.xp_earned,
      lessons_completed = public.daily_activity.lessons_completed + excluded.lessons_completed;

  unlimited_hearts_until := v_unlimited_until;
  awarded_xp := v_award;
  return next;
end;
$$;

grant select on public.xp_events, public.heart_events, public.heart_pass_products, public.payment_orders, public.heart_entitlements to authenticated;
grant select on public.heart_pass_products to anon;
grant execute on function public.refresh_daily_hearts() to authenticated;
grant execute on function public.record_learning_result(text, text, text, boolean, jsonb, text, boolean, smallint) to authenticated;
revoke all on function public.refresh_daily_hearts() from public;
revoke all on function public.record_learning_result(text, text, text, boolean, jsonb, text, boolean, smallint) from public;
grant execute on function public.refresh_daily_hearts() to authenticated;
grant execute on function public.record_learning_result(text, text, text, boolean, jsonb, text, boolean, smallint) to authenticated;

insert into public.heart_pass_products (sku, title, duration_hours, amount_cents, currency)
values ('unlimited-hearts-day', 'Unlimited hearts for 24 hours', 24, 100, 'usd')
on conflict (sku) do update
set title = excluded.title,
    duration_hours = excluded.duration_hours,
    amount_cents = excluded.amount_cents,
    currency = excluded.currency,
    active = true;
