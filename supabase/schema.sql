create extension if not exists pgcrypto;

create table if not exists public.broker_sites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  site_name text not null,
  brokerage_name text,
  primary_domain text,
  broker_logo_url text,
  team_logo_url text,
  contact_email text,
  contact_phone text,
  lead_notification_emails text[] not null default '{}',
  resend_from_email text,
  lead_reply_to_email text,
  hero_eyebrow text,
  hero_headline text,
  hero_subheadline text,
  promo_enabled boolean not null default false,
  promo_eyebrow text,
  promo_headline text,
  promo_body text,
  brand_primary text,
  brand_accent text,
  homepage_sections jsonb not null default '{}',
  lead_routing jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.broker_sites enable row level security;
alter table public.site_banners enable row level security;
alter table public.team_members enable row level security;
alter table public.testimonials enable row level security;
alter table public.lead_submissions enable row level security;
alter table public.manual_listings enable row level security;
alter table public.saved_searches enable row level security;
alter table public.favorite_listings enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.broker_sites to anon, authenticated;
grant select on public.site_banners to anon, authenticated;
grant insert on public.lead_submissions to anon, authenticated;
grant select on public.team_members to anon, authenticated;
grant select on public.testimonials to anon, authenticated;
grant select on public.manual_listings to anon, authenticated;

create policy "Active broker sites are public"
  on public.broker_sites for select
  using (is_active = true);

create policy "Active site banners are public"
  on public.site_banners for select
  using (is_active = true);

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

insert into public.broker_sites (
  slug,
  site_name,
  brokerage_name,
  primary_domain,
  broker_logo_url,
  team_logo_url,
  contact_email,
  contact_phone,
  lead_notification_emails,
  resend_from_email,
  lead_reply_to_email,
  hero_eyebrow,
  hero_headline,
  hero_subheadline,
  promo_enabled,
  promo_eyebrow,
  promo_headline,
  promo_body,
  brand_primary,
  brand_accent,
  homepage_sections,
  lead_routing
)
values (
  'alu-realty-group',
  'Alu Realty Group',
  'Fathom Realty Elite',
  'alurealtygroup.com',
  '/assets/fathom-realty-elite-logo.png',
  '/assets/alu-realty-group-logo.png',
  'phil@alurealtygroup.com',
  null,
  array['phil@alurealtygroup.com'],
  'Alu Realty Group <noreply@contact.alurealtygroup.com>',
  'phil@alurealtygroup.com',
  'SCOTTSDALE · PARADISE VALLEY · PHOENIX',
  'Find the place
that feels like yours.',
  'Local insight, real-time listings, and smart guidance for your next move in the Valley.',
  true,
  'Celebrating America''s 250th',
  'Home. Freedom. Future.',
  'Honoring the spirit of July 4th and the communities we call home.',
  '#17221f',
  '#d9784f',
  '{
    "propertiesEyebrow": "CURATED FOR YOU",
    "propertiesHeadline": "Homes worth a closer look.",
    "ratesEyebrow": "TODAY''S MORTGAGE SNAPSHOT",
    "ratesHeadline": "Know your buying power.",
    "ratesBody": "Rates move quickly. See national mortgage-market data from Mortgage News Daily and estimate a monthly payment before you tour.",
    "ratesStatus": "Prepared for live Mortgage News Daily widget data",
    "teamEyebrow": "MEET THE TEAM",
    "teamHeadline": "Personal guidance, built to scale.",
    "teamBody": "Start with Phil and Denise today, then add future agents with photos, contact details, bios, specialties, and reviews from the same database structure.",
    "testimonialsEyebrow": "CLIENT FEEDBACK",
    "testimonialsHeadline": "Stories from the people we serve.",
    "insightsEyebrow": "THE MARKET, MADE CLEAR",
    "insightsHeadline": "News & local insight.",
    "savedSearchEyebrow": "DON''T MISS THE RIGHT ONE",
    "savedSearchHeadline": "Your search can keep working\nwhile you get on with your day.",
    "savedSearchBody": "Save your criteria and get a personal email when a new listing matches, a favorite changes price, or a property comes back on market.",
    "sellEyebrow": "THINKING OF SELLING?",
    "sellHeadline": "Start with a clearer\npicture of your home.",
    "sellBody": "Get a thoughtful market estimate informed by recent sales, current competition, and the details that make your property different.",
    "sellButtonText": "Request a home valuation"
  }'::jsonb,
  '{
    "defaultNotificationEmails": ["phil@alurealtygroup.com"],
    "valuationNotificationEmails": ["phil@alurealtygroup.com"],
    "defaultNotificationTeamMemberSlugs": [],
    "valuationNotificationTeamMemberSlugs": [],
    "defaultAssignedTeamMemberSlug": "",
    "valuationAssignedTeamMemberSlug": "",
    "sendClientConfirmation": true,
    "sendInternalNotification": true
  }'::jsonb
)
on conflict (slug) do update set
  site_name = excluded.site_name,
  brokerage_name = excluded.brokerage_name,
  primary_domain = excluded.primary_domain,
  broker_logo_url = excluded.broker_logo_url,
  team_logo_url = excluded.team_logo_url,
  hero_eyebrow = excluded.hero_eyebrow,
  hero_headline = excluded.hero_headline,
  hero_subheadline = excluded.hero_subheadline,
  promo_enabled = excluded.promo_enabled,
  promo_eyebrow = excluded.promo_eyebrow,
  promo_headline = excluded.promo_headline,
  promo_body = excluded.promo_body,
  brand_primary = excluded.brand_primary,
  brand_accent = excluded.brand_accent,
  homepage_sections = excluded.homepage_sections,
  lead_routing = excluded.lead_routing,
  updated_at = now();

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
