-- AI infrastructure: inbound rate limiting + per-call AI usage/cost logging.
-- Additive only — no existing data mutated. Service-role only (RLS on, no
-- client policies). Requires owner sign-off before `supabase db push` (prod, no staging).

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed-window token bucket)
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  bucket_key   text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (bucket_key, window_start)
);

alter table public.rate_limits enable row level security;
-- No policies: only the service role (which bypasses RLS) may read/write.

-- Atomic increment + check. Called from edge functions via the service role.
-- Returns whether the request is allowed, how many remain, and seconds to reset.
create or replace function public.rate_limit_hit(
  p_key text,
  p_limit integer,
  p_window_sec integer
)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_sec) * p_window_sec
  );

  insert into public.rate_limits (bucket_key, window_start, count)
  values (p_key, v_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  retry_after := ceil(
    extract(epoch from (v_window_start + make_interval(secs => p_window_sec) - now()))
  )::integer;
  return next;
end;
$$;

-- Opportunistic cleanup helper (call from a cron if desired).
create or replace function public.rate_limits_prune()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;

-- ---------------------------------------------------------------------------
-- AI usage / cost log
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage_log (
  id            uuid primary key default gen_random_uuid(),
  fn            text        not null,
  provider      text        not null,
  model         text        not null,
  input_tokens  integer     not null default 0,
  output_tokens integer     not null default 0,
  cost_usd      numeric,
  user_id       uuid,
  created_at    timestamptz not null default now()
);

create index if not exists idx_ai_usage_log_created_at on public.ai_usage_log (created_at desc);
create index if not exists idx_ai_usage_log_fn on public.ai_usage_log (fn);

alter table public.ai_usage_log enable row level security;

-- Admins may read the usage log; only the service role writes to it.
drop policy if exists ai_usage_log_admin_read on public.ai_usage_log;
create policy ai_usage_log_admin_read on public.ai_usage_log
  for select
  using (
    exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    )
  );
