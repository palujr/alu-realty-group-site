alter table public.broker_sites
  add column if not exists footer_logo_display text not null default 'broker';

update public.broker_sites
set footer_logo_display = coalesce(footer_logo_display, 'broker')
where slug = 'alu-realty-group';
