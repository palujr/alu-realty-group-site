alter table public.lead_submissions
  add column if not exists lead_stage text not null default 'new';

alter table public.lead_submissions
  drop constraint if exists lead_submissions_lead_stage_check;

alter table public.lead_submissions
  add constraint lead_submissions_lead_stage_check
  check (lead_stage in ('new', 'attempting_contact', 'consult_scheduled', 'active_client', 'nurture', 'closed_lost'));

update public.lead_submissions
set lead_stage = case
  when contact_status = 'archived' then 'closed_lost'
  when contact_status = 'completed' then 'active_client'
  when contact_status in ('assigned', 'contacted', 'verified', 'in_progress') then 'attempting_contact'
  else 'new'
end
where lead_stage = 'new';

create index if not exists lead_submissions_lead_stage_idx
  on public.lead_submissions(lead_stage);
