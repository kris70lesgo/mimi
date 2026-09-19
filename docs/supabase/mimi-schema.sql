-- Run after creating a Supabase project and enabling Google + email magic-link Auth.
-- New public tables may require explicit Data API exposure in Project Settings.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Mimi learner',
  xp integer not null default 0 check (xp >= 0), hearts smallint not null default 5 check (hearts between 0 and 5),
  streak integer not null default 0 check (streak >= 0), daily_xp integer not null default 0 check (daily_xp >= 0),
  last_active date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null, completed_at timestamptz, best_score smallint not null default 0 check (best_score between 0 and 100),
  primary key (user_id,lesson_id)
);
create table public.concept_mastery (
  user_id uuid not null references public.profiles(id) on delete cascade,
  concept_key text not null, mastery smallint not null default 0 check (mastery between 0 and 100),
  due_at timestamptz, updated_at timestamptz not null default now(), primary key (user_id,concept_key)
);
create table public.achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_key text not null, earned_at timestamptz not null default now(), primary key (user_id,achievement_key)
);
alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.concept_mastery enable row level security;
alter table public.achievements enable row level security;
create policy "profile owner" on public.profiles for all to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy "lesson owner" on public.lesson_progress for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "mastery owner" on public.concept_mastery for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "achievement owner" on public.achievements for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
