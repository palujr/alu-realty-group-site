create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead_submissions(id) on delete cascade,
  activity_type text not null default 'note' check (
    activity_type in ('note', 'call', 'email', 'text', 'meeting', 'task', 'status_update')
  ),
  activity_at timestamptz not null default now(),
  summary text not null,
  outcome text not null,
  created_by_name text,
  created_at timestamptz not null default now()
);

alter table public.lead_activities enable row level security;

grant select, insert, update, delete on public.lead_activities to service_role;

create index if not exists lead_activities_lead_id_activity_at_idx
  on public.lead_activities(lead_id, activity_at desc);
