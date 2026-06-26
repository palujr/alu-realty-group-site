alter table public.lead_submissions
  alter column email drop not null;

alter table public.lead_submissions
  add column if not exists contact_status text not null default 'new',
  add column if not exists preferred_contact_method text,
  add column if not exists contact_notes text,
  add column if not exists last_contacted_at timestamptz;
