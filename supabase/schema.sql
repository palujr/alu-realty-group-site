create extension if not exists pgcrypto;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  full_name text not null,
  title text not null,
  phone text,
  email text,
  bio text,
  photo_url text,
  specialties text[] not null default '{}',
  display_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  created_at timestamptz not null default now()
);

create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_type text not null check (lead_type in ('account', 'valuation', 'contact', 'saved_search')),
  full_name text,
  email text not null,
  phone text,
  property_address text,
  message text,
  source_page text,
  assigned_team_member_id uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_listings (
  id uuid primary key default gen_random_uuid(),
  listing_source text not null default 'manual',
  external_listing_id text,
  status text not null check (status in ('for_sale', 'for_lease', 'sold', 'coming_soon')),
  badge text,
  address text not null,
  city text,
  state text default 'AZ',
  postal_code text,
  neighborhood text,
  list_price numeric,
  lease_price numeric,
  beds numeric,
  baths numeric,
  sqft integer,
  hero_image_url text,
  image_position text default 'center center',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  search_name text not null default 'Saved search',
  criteria jsonb not null default '{}',
  alert_frequency text not null default 'instant' check (alert_frequency in ('instant', 'daily', 'weekly', 'off')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references public.manual_listings(id) on delete cascade,
  external_listing_id text,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id),
  unique(user_id, external_listing_id)
);

alter table public.team_members enable row level security;
alter table public.testimonials enable row level security;
alter table public.lead_submissions enable row level security;
alter table public.manual_listings enable row level security;
alter table public.saved_searches enable row level security;
alter table public.favorite_listings enable row level security;

create policy "Published team members are public"
  on public.team_members for select
  using (is_active = true);

create policy "Published testimonials are public"
  on public.testimonials for select
  using (is_published = true);

create policy "Published listings are public"
  on public.manual_listings for select
  using (is_published = true);

create policy "Anyone can submit a lead"
  on public.lead_submissions for insert
  with check (true);

create policy "Users can view their saved searches"
  on public.saved_searches for select
  using (auth.uid() = user_id);

create policy "Users can create their saved searches"
  on public.saved_searches for insert
  with check (auth.uid() = user_id);

create policy "Users can update their saved searches"
  on public.saved_searches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their favorite listings"
  on public.favorite_listings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into public.team_members (slug, full_name, title, phone, email, bio, specialties, display_order)
values
  (
    'phil-alu',
    'Phil Alu',
    'Realtor | Alu Realty Group',
    '(480) 555-0124',
    'phil@whatmovesyou.com',
    'Phil helps Arizona buyers and sellers make confident decisions with practical market guidance, clear communication, and a steady process from first conversation to closing.',
    array['Buyers', 'Sellers', 'Relocation', 'Market strategy'],
    10
  ),
  (
    'denise-alu',
    'Denise Alu',
    'Realtor | Alu Realty Group',
    '(480) 555-0125',
    'denise@whatmovesyou.com',
    'Denise brings warmth, detail, and follow-through to the client experience, helping people feel informed and cared for through each step of the move.',
    array['Client care', 'Home preparation', 'Buyer guidance', 'Follow-up'],
    20
  )
on conflict (slug) do nothing;
