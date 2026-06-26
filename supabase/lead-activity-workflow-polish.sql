alter table public.broker_sites
  add column if not exists time_zone text not null default 'America/Phoenix';

update public.broker_sites
  set time_zone = 'America/Phoenix'
  where time_zone is null or time_zone = '';

update public.lead_activities
  set outcome = 'Not specified'
  where outcome is null or trim(outcome) = '';

alter table public.lead_activities
  alter column outcome set not null;
