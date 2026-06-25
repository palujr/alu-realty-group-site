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
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  brand_accent
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
  '#d9784f'
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
  updated_at = now();
