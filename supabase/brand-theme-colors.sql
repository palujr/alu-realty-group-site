alter table public.broker_sites
  add column if not exists brand_header_footer text;

alter table public.broker_sites
  add column if not exists brand_section_background text;

update public.broker_sites
set
  brand_header_footer = coalesce(brand_header_footer, brand_primary, '#1d2b27'),
  brand_section_background = coalesce(brand_section_background, '#f5f1e8'),
  updated_at = now()
where slug = 'alu-realty-group';
