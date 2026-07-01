create table if not exists public.broker_sites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  site_name text not null,
  brokerage_name text,
  primary_domain text,
  broker_logo_url text,
  team_logo_url text,
  footer_logo_display text not null default 'broker',
  fair_housing_logo_url text,
  fair_housing_text text,
  fair_housing_show_text boolean not null default true,
  realtor_logo_url text,
  hero_image_url text,
  contact_email text,
  contact_phone text,
  time_zone text not null default 'America/Phoenix',
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
  brand_header_footer text,
  brand_section_background text,
  homepage_sections jsonb not null default '{}',
  lead_routing jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.broker_sites
  add column if not exists homepage_sections jsonb not null default '{}';

alter table public.broker_sites
  add column if not exists lead_routing jsonb not null default '{}';

alter table public.broker_sites
  add column if not exists time_zone text not null default 'America/Phoenix';

alter table public.broker_sites
  add column if not exists hero_image_url text;

alter table public.broker_sites
  add column if not exists brand_header_footer text;

alter table public.broker_sites
  add column if not exists brand_section_background text;

alter table public.broker_sites
  add column if not exists footer_logo_display text not null default 'broker';

alter table public.broker_sites
  add column if not exists fair_housing_logo_url text;

alter table public.broker_sites
  add column if not exists fair_housing_text text;

alter table public.broker_sites
  add column if not exists fair_housing_show_text boolean not null default true;

alter table public.broker_sites
  add column if not exists realtor_logo_url text;

alter table public.broker_sites enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.broker_sites to anon, authenticated;

drop policy if exists "Active broker sites are public" on public.broker_sites;
create policy "Active broker sites are public"
  on public.broker_sites for select
  using (is_active = true);

insert into public.broker_sites (
  slug,
  site_name,
  brokerage_name,
  primary_domain,
  broker_logo_url,
  team_logo_url,
  footer_logo_display,
  fair_housing_logo_url,
  fair_housing_text,
  fair_housing_show_text,
  realtor_logo_url,
  hero_image_url,
  contact_email,
  contact_phone,
  time_zone,
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
  brand_header_footer,
  brand_section_background,
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
  'broker',
  '/assets/equal-housing-opportunity.gif',
  'Equal Housing Opportunity',
  true,
  '/assets/realtor-logo-black.jpg',
  '/assets/desert-home-hero.png',
  'phil@alurealtygroup.com',
  null,
  'America/Phoenix',
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
  '#1d2b27',
  '#f5f1e8',
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
    "testimonialsShowSaleDate": false,
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
  homepage_sections = public.broker_sites.homepage_sections || excluded.homepage_sections,
  lead_routing = public.broker_sites.lead_routing || excluded.lead_routing,
  footer_logo_display = coalesce(public.broker_sites.footer_logo_display, excluded.footer_logo_display),
  fair_housing_logo_url = coalesce(public.broker_sites.fair_housing_logo_url, excluded.fair_housing_logo_url),
  fair_housing_text = coalesce(public.broker_sites.fair_housing_text, excluded.fair_housing_text),
  fair_housing_show_text = coalesce(public.broker_sites.fair_housing_show_text, excluded.fair_housing_show_text),
  realtor_logo_url = coalesce(public.broker_sites.realtor_logo_url, excluded.realtor_logo_url),
  brand_header_footer = coalesce(public.broker_sites.brand_header_footer, excluded.brand_header_footer),
  brand_section_background = coalesce(public.broker_sites.brand_section_background, excluded.brand_section_background),
  updated_at = now();
