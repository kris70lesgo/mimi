create table public.shop_items (
  sku text primary key,
  title text not null,
  description text not null,
  gem_cost integer not null check (gem_cost >= 0),
  item_kind text not null check (item_kind in ('heart_refill', 'streak_shield', 'model_pack')),
  created_at timestamptz not null default now()
);

alter table public.shop_items enable row level security;
create policy "Anyone can read shop items" on public.shop_items for select to anon, authenticated using (true);
grant select on public.shop_items to anon, authenticated;

insert into public.shop_items (sku, title, description, gem_cost, item_kind) values
  ('streak-shield', 'Streak shield', 'Protect one missed study day.', 180, 'streak_shield'),
  ('heart-refill', 'Heart refill', 'Restore three practice hearts.', 120, 'heart_refill'),
  ('cardio-model-pack', 'Cardio model pack', 'Unlock guided heart structures.', 240, 'model_pack'),
  ('neuro-model-pack', 'Neuro model pack', 'Unlock brain pathway challenges.', 260, 'model_pack'),
  ('breathing-model-pack', 'Breathing lab pack', 'Unlock respiratory review drills.', 220, 'model_pack')
on conflict (sku) do update set title = excluded.title, description = excluded.description, gem_cost = excluded.gem_cost, item_kind = excluded.item_kind;

-- The browser never chooses its own price or balance. This transaction protects both.
create or replace function public.purchase_shop_item(p_sku text)
returns table (xp integer, hearts smallint, item_quantity integer)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost integer;
  v_kind text;
  v_xp integer;
  v_hearts smallint;
  v_quantity integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  select gem_cost, item_kind into v_cost, v_kind from public.shop_items where sku = p_sku;
  if not found then
    raise exception 'Unknown shop item';
  end if;
  update public.learning_progress
  set xp = xp - v_cost,
      hearts = case when v_kind = 'heart_refill' then least(5, hearts + 3) else hearts end
  where user_id = v_user_id and xp >= v_cost
  returning learning_progress.xp, learning_progress.hearts into v_xp, v_hearts;
  if not found then
    raise exception 'Not enough gems';
  end if;
  insert into public.inventory_items (user_id, sku, quantity)
  values (v_user_id, p_sku, 1)
  on conflict (user_id, sku) do update set quantity = public.inventory_items.quantity + 1
  returning quantity into v_quantity;
  insert into public.purchase_history (user_id, sku, gem_cost) values (v_user_id, p_sku, v_cost);
  return query select v_xp, v_hearts, v_quantity;
end;
$$;

revoke all on function public.purchase_shop_item(text) from public;
grant execute on function public.purchase_shop_item(text) to authenticated;
