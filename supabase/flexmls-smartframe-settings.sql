alter table if exists public.broker_sites
  add column if not exists idx_enabled boolean not null default false,
  add column if not exists idx_provider_name text not null default 'Provider flexible',
  add column if not exists idx_embed_url text,
  add column if not exists idx_embed_code text,
  add column if not exists idx_search_url text,
  add column if not exists idx_fallback_message text;

update public.broker_sites
set
  idx_enabled = true,
  idx_provider_name = 'FlexMLS SmartFrame',
  idx_embed_url = 'https://link.flexmls.com/1dcdpp6s7mwo,12',
  idx_embed_code = '<iframe src="https://link.flexmls.com/1dcdpp6s7mwo,12" title="FlexMLS SmartFrame property search"></iframe>',
  idx_search_url = 'https://link.flexmls.com/1dcdpp6s7mwo,12',
  idx_fallback_message = 'Search Greater Phoenix listings with the FlexMLS SmartFrame search experience.'
where slug = 'alu-realty-group'
   or primary_domain in ('alurealtygroup.com', 'www.alurealtygroup.com')
   or site_name = 'Alu Realty Group';

select
  site_name,
  primary_domain,
  idx_enabled,
  idx_provider_name,
  idx_embed_url,
  idx_embed_code,
  idx_search_url
from public.broker_sites;
