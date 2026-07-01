create extension if not exists pgcrypto;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid references public.team_members(id) on delete set null,
  scope text not null check (scope in ('team', 'individual')),
  client_name text not null,
  context text,
  quote text not null,
  rating integer check (rating between 1 and 5),
  is_featured boolean not null default false,
  is_published boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.testimonials
  add column if not exists deleted_at timestamptz;

alter table public.testimonials enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.testimonials to anon, authenticated;

drop policy if exists "Published testimonials are public" on public.testimonials;

create policy "Published testimonials are public"
  on public.testimonials for select
  using (is_published = true and deleted_at is null);

insert into public.testimonials (
  scope,
  client_name,
  context,
  quote,
  rating,
  is_featured,
  is_published
)
select
  'team',
  'Buyer Client',
  'Scottsdale purchase',
  'Phil and Denise made the process feel calm and organized from the first showing through closing.',
  5,
  true,
  true
where not exists (
  select 1 from public.testimonials
  where quote = 'Phil and Denise made the process feel calm and organized from the first showing through closing.'
);

insert into public.testimonials (
  team_member_id,
  scope,
  client_name,
  context,
  quote,
  rating,
  is_featured,
  is_published
)
select
  team_members.id,
  'individual',
  'Relocation Client',
  'North Scottsdale',
  'Phil explained the market clearly and helped us make a smart offer without feeling rushed.',
  5,
  true,
  true
from public.team_members
where team_members.slug = 'phil-alu'
  and not exists (
    select 1 from public.testimonials
    where quote = 'Phil explained the market clearly and helped us make a smart offer without feeling rushed.'
  );

insert into public.testimonials (
  team_member_id,
  scope,
  client_name,
  context,
  quote,
  rating,
  is_featured,
  is_published
)
select
  team_members.id,
  'individual',
  'Seller Client',
  'Phoenix sale',
  'Denise stayed on top of the details and made sure we always knew what came next.',
  5,
  true,
  true
from public.team_members
where team_members.slug = 'denise-alu'
  and not exists (
    select 1 from public.testimonials
    where quote = 'Denise stayed on top of the details and made sure we always knew what came next.'
  );
