create extension if not exists pgcrypto;

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null references public.broker_sites(slug) on delete cascade,
  campaign_name text not null,
  eyebrow text,
  headline text not null,
  body text,
  theme text not null default 'patriotic',
  priority integer not null default 100,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_banners enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.site_banners to anon, authenticated;

drop policy if exists "Active site banners are public" on public.site_banners;

create policy "Active site banners are public"
  on public.site_banners for select
  using (is_active = true);

insert into public.site_banners (
  site_slug,
  campaign_name,
  eyebrow,
  headline,
  body,
  theme,
  priority,
  start_date,
  end_date,
  is_active
)
select
  'alu-realty-group',
  'America 250 Fourth of July',
  'Celebrating America''s 250th',
  'Home. Freedom. Future.',
  'Honoring the spirit of July 4th and the communities we call home.',
  'patriotic',
  10,
  '2026-06-01',
  '2026-07-10',
  true
where not exists (
  select 1
  from public.site_banners
  where site_slug = 'alu-realty-group'
    and campaign_name = 'America 250 Fourth of July'
);
