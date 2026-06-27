alter table public.lead_submissions
  add column if not exists lead_source_category text not null default 'website';

alter table public.lead_submissions
  drop constraint if exists lead_submissions_lead_source_category_check;

alter table public.lead_submissions
  add constraint lead_submissions_lead_source_category_check
  check (
    lead_source_category in (
      'website',
      'referral',
      'phone_call',
      'sign_call',
      'open_house',
      'social_media',
      'email',
      'direct_mail',
      'past_client',
      'agent_network',
      'manual',
      'import',
      'other'
    )
  );

update public.lead_submissions
set lead_source_category = 'manual'
where source_page = 'admin_manual'
  and lead_source_category = 'website';

update public.lead_submissions
set lead_source_category = 'website'
where source_page is not null
  and source_page <> 'admin_manual'
  and lead_source_category = 'website';

create index if not exists lead_submissions_lead_source_category_idx
  on public.lead_submissions(lead_source_category);
