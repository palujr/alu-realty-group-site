alter table public.lead_activities
  add column if not exists follow_up_at timestamptz,
  add column if not exists updated_by_name text,
  add column if not exists updated_at timestamptz;

create index if not exists lead_activities_follow_up_at_idx
  on public.lead_activities(follow_up_at)
  where follow_up_at is not null;
