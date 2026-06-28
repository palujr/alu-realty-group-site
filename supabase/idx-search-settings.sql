alter table public.broker_sites
  add column if not exists idx_enabled boolean not null default false,
  add column if not exists idx_provider_name text,
  add column if not exists idx_embed_url text,
  add column if not exists idx_embed_code text,
  add column if not exists idx_search_url text,
  add column if not exists idx_fallback_message text;

update public.broker_sites
set
  idx_provider_name = coalesce(idx_provider_name, 'FlexMLS SmartFrame'),
  idx_fallback_message = coalesce(
    idx_fallback_message,
    'IDX search is being connected. In the meantime, contact us and we will send live property matches directly to you.'
  ),
  updated_at = now()
where slug = 'alu-realty-group';
