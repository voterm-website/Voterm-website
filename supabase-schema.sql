
-- VOTREM fresh website schema
create extension if not exists pgcrypto;
create table if not exists public.teachings (
 id uuid primary key default gen_random_uuid(), title text not null, category text, summary text, video_url text, published boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.programmes (
 id uuid primary key default gen_random_uuid(), title text not null, programme_date text, location text, details text, published boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.books (
 id uuid primary key default gen_random_uuid(), title text not null, description text, cover_url text, file_url text, published boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.prayer_requests (
 id uuid primary key default gen_random_uuid(), name text not null, contact text, category text, request text not null, confidential boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.membership_applications (
 id uuid primary key default gen_random_uuid(), name text not null, contact text, department text, message text, created_at timestamptz not null default now()
);
create table if not exists public.worker_applications (
 id uuid primary key default gen_random_uuid(), name text not null, contact text, department text, message text, created_at timestamptz not null default now()
);
create table if not exists public.volunteer_applications (
 id uuid primary key default gen_random_uuid(), name text not null, contact text, department text, message text, created_at timestamptz not null default now()
);

alter table public.teachings enable row level security;
alter table public.programmes enable row level security;
alter table public.books enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.membership_applications enable row level security;
alter table public.worker_applications enable row level security;
alter table public.volunteer_applications enable row level security;

-- Public visitors can read only published public content.
create policy "public read teachings" on public.teachings for select to anon, authenticated using (published=true);
create policy "public read programmes" on public.programmes for select to anon, authenticated using (published=true);
create policy "public read books" on public.books for select to anon, authenticated using (published=true);

-- Public visitors can submit forms but cannot read submissions.
create policy "public insert prayer" on public.prayer_requests for insert to anon, authenticated with check (true);
create policy "public insert membership" on public.membership_applications for insert to anon, authenticated with check (true);
create policy "public insert worker" on public.worker_applications for insert to anon, authenticated with check (true);
create policy "public insert volunteer" on public.volunteer_applications for insert to anon, authenticated with check (true);

-- Authenticated administrators can manage public content.
create policy "auth manage teachings" on public.teachings for all to authenticated using (true) with check (true);
create policy "auth manage programmes" on public.programmes for all to authenticated using (true) with check (true);
create policy "auth manage books" on public.books for all to authenticated using (true) with check (true);

-- NOTE: For a real production deployment, replace broad authenticated content policies with an admin role/profile check.
