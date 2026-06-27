alter table public.broker_sites
  add column if not exists fair_housing_logo_url text;

alter table public.broker_sites
  add column if not exists fair_housing_text text;

alter table public.broker_sites
  add column if not exists fair_housing_show_text boolean not null default true;

alter table public.broker_sites
  add column if not exists realtor_logo_url text;

update public.broker_sites
set
  fair_housing_logo_url = coalesce(fair_housing_logo_url, '/assets/equal-housing-opportunity.gif'),
  fair_housing_text = coalesce(fair_housing_text, 'Equal Housing Opportunity'),
  fair_housing_show_text = coalesce(fair_housing_show_text, true),
  realtor_logo_url = coalesce(realtor_logo_url, '/assets/realtor-logo-black.jpg')
where slug = 'alu-realty-group';
