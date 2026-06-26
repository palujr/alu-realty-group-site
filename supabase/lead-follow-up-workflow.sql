alter table public.lead_submissions
  add column if not exists lead_priority text not null default 'normal',
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists lead_source_detail text;

alter table public.lead_submissions
  drop constraint if exists lead_submissions_lead_priority_check;

alter table public.lead_submissions
  add constraint lead_submissions_lead_priority_check
  check (lead_priority in ('low', 'normal', 'high', 'urgent'));

create index if not exists lead_submissions_next_follow_up_at_idx
  on public.lead_submissions(next_follow_up_at);

create index if not exists lead_submissions_lead_priority_idx
  on public.lead_submissions(lead_priority);
