-- Mimi's learner data. Every user-owned record is protected by RLS.
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default 'Mimi learner',
  avatar_url text,
  bio text not null default '',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  hearts smallint not null default 5 check (hearts between 0 and 5),
  streak integer not null default 0 check (streak >= 0),
  daily_xp integer not null default 0 check (daily_xp >= 0),
  last_active date not null default current_date,
  completed_lessons jsonb not null default '[]'::jsonb,
  mastery jsonb not null default '{}'::jsonb,
  weak_topics jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  activity_id text,
  activity_kind text,
  score smallint check (score between 0 and 100),
  correct boolean not null,
  answer jsonb,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  attempted_at timestamptz not null default now()
);
create index lesson_attempts_user_lesson_idx on public.lesson_attempts(user_id, lesson_id, attempted_at desc);

create table public.lesson_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  best_score smallint not null default 0 check (best_score between 0 and 100),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.achievement_definitions (
  code text primary key,
  title text not null,
  description text not null,
  category text not null,
  target integer not null check (target > 0),
  icon_key text not null,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.achievement_definitions(code) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, achievement_code)
);

create table public.inventory_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  quantity integer not null default 0 check (quantity >= 0),
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, sku)
);

create table public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null,
  gem_cost integer not null check (gem_cost >= 0),
  purchased_at timestamptz not null default now()
);
create index purchase_history_user_idx on public.purchase_history(user_id, purchased_at desc);

create table public.study_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index study_sets_owner_idx on public.study_sets(owner_id, updated_at desc);

create table public.study_set_items (
  id uuid primary key default gen_random_uuid(),
  study_set_id uuid not null references public.study_sets(id) on delete cascade,
  concept_id text not null,
  prompt text,
  notes text not null default '',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique(study_set_id, concept_id)
);

create table public.daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  xp_earned integer not null default 0 check (xp_earned >= 0),
  minutes_studied integer not null default 0 check (minutes_studied >= 0),
  lessons_completed integer not null default 0 check (lessons_completed >= 0),
  primary key (user_id, activity_date)
);

-- Keeps private identity data out of the public API, while creating a safe learner row.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, private
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'Mimi learner'), '@', 1)),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  ) on conflict (id) do nothing;
  insert into public.learning_progress (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute procedure private.touch_updated_at();
create trigger progress_touch before update on public.learning_progress for each row execute procedure private.touch_updated_at();
create trigger completion_touch before update on public.lesson_completions for each row execute procedure private.touch_updated_at();
create trigger achievement_touch before update on public.user_achievements for each row execute procedure private.touch_updated_at();
create trigger inventory_touch before update on public.inventory_items for each row execute procedure private.touch_updated_at();
create trigger study_sets_touch before update on public.study_sets for each row execute procedure private.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.learning_progress enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.inventory_items enable row level security;
alter table public.purchase_history enable row level security;
alter table public.study_sets enable row level security;
alter table public.study_set_items enable row level security;
alter table public.daily_activity enable row level security;

create policy "Users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users read own progress" on public.learning_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users update own progress" on public.learning_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users read own attempts" on public.lesson_attempts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own attempts" on public.lesson_attempts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read own completions" on public.lesson_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users manage own completions" on public.lesson_completions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Anyone can read achievement definitions" on public.achievement_definitions for select to anon, authenticated using (true);
create policy "Users read own achievements" on public.user_achievements for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users manage own achievements" on public.user_achievements for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users read own inventory" on public.inventory_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users manage own inventory" on public.inventory_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users read own purchases" on public.purchase_history for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own purchases" on public.purchase_history for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners manage private study sets" on public.study_sets for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Anyone can read public study sets" on public.study_sets for select to anon, authenticated using (is_public);
create policy "Owners manage study set items" on public.study_set_items for all to authenticated using (exists (select 1 from public.study_sets s where s.id = study_set_id and s.owner_id = (select auth.uid()))) with check (exists (select 1 from public.study_sets s where s.id = study_set_id and s.owner_id = (select auth.uid())));
create policy "Anyone can read public study set items" on public.study_set_items for select to anon, authenticated using (exists (select 1 from public.study_sets s where s.id = study_set_id and s.is_public));
create policy "Users read own daily activity" on public.daily_activity for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users manage own daily activity" on public.daily_activity for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.achievement_definitions, public.study_sets, public.study_set_items to anon;
grant select, update on public.profiles, public.learning_progress to authenticated;
grant select, insert on public.lesson_attempts, public.purchase_history to authenticated;
grant select, insert, update, delete on public.lesson_completions, public.user_achievements, public.inventory_items, public.study_sets, public.study_set_items, public.daily_activity to authenticated;
revoke all on function private.handle_new_user() from public;
revoke all on function private.touch_updated_at() from public;

insert into public.achievement_definitions (code, title, description, category, target, icon_key) values
  ('first-steps', 'First steps', 'Finish your first anatomy lesson.', 'learning', 1, 'spark'),
  ('heart-scout', 'Heart scout', 'Master three heart activities.', 'mastery', 3, 'heart'),
  ('bone-builder', 'Bone builder', 'Complete a skeletal lab.', 'learning', 1, 'bone'),
  ('steady-learner', 'Steady learner', 'Build a seven-day study streak.', 'streak', 7, 'flame')
on conflict (code) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Avatar owners read" on storage.objects for select to authenticated using (bucket_id = 'avatars' and owner = (select auth.uid()));
create policy "Avatar owners upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and owner = (select auth.uid()));
create policy "Avatar owners update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and owner = (select auth.uid())) with check (bucket_id = 'avatars' and owner = (select auth.uid()));
create policy "Avatar owners delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and owner = (select auth.uid()));
