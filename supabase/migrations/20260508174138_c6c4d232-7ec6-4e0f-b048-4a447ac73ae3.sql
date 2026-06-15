create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  smart_suggestions boolean not null default true,
  frequency text not null default 'daily',
  last_digest_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users manage own prefs" on public.notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger trg_notif_prefs_updated
  before update on public.notification_preferences
  for each row execute function public.update_updated_at_column();

create extension if not exists pg_cron;
create extension if not exists pg_net;