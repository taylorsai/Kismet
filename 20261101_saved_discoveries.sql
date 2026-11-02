-- Run in Supabase SQL Editor or apply as a migration.
create table if not exists public.saved_discoveries (
 user_id uuid not null references auth.users(id) on delete cascade,
 block_id text not null,
 item_data jsonb not null,
 saved_at timestamptz not null default now(),
 primary key (user_id, block_id)
);
create index if not exists saved_discoveries_user_saved_at_idx on public.saved_discoveries(user_id, saved_at desc);
alter table public.saved_discoveries enable row level security;
revoke all on public.saved_discoveries from anon;
grant select, insert, update, delete on public.saved_discoveries to authenticated;
drop policy if exists "Users read their own discoveries" on public.saved_discoveries;
create policy "Users read their own discoveries" on public.saved_discoveries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users save their own discoveries" on public.saved_discoveries;
create policy "Users save their own discoveries" on public.saved_discoveries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their own discoveries" on public.saved_discoveries;
create policy "Users update their own discoveries" on public.saved_discoveries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users delete their own discoveries" on public.saved_discoveries;
create policy "Users delete their own discoveries" on public.saved_discoveries for delete to authenticated using ((select auth.uid()) = user_id);
