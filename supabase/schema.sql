create extension if not exists pgcrypto;

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  status text not null default 'new'
);

create index if not exists form_submissions_form_type_idx on public.form_submissions(form_type);
create index if not exists form_submissions_created_at_idx on public.form_submissions(created_at desc);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  amount_kobo bigint not null,
  currency text not null default 'NGN',
  cause text,
  donor_name text,
  donor_email text,
  donor_phone text,
  status text not null default 'initiated',
  gateway text not null default 'paystack',
  gateway_response jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists donations_created_at_idx on public.donations(created_at desc);
create index if not exists donations_status_idx on public.donations(status);

alter table public.form_submissions enable row level security;
alter table public.donations enable row level security;

-- No public INSERT/SELECT policies are intentionally created.
-- The VOTREM Edge Function writes through the server-side secret key.
