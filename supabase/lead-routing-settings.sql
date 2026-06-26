alter table public.broker_sites
  add column if not exists lead_routing jsonb not null default '{}';

update public.broker_sites
set
  lead_routing = lead_routing || '{
    "defaultNotificationEmails": ["phil@alurealtygroup.com"],
    "valuationNotificationEmails": ["phil@alurealtygroup.com"],
    "defaultNotificationTeamMemberSlugs": [],
    "valuationNotificationTeamMemberSlugs": [],
    "defaultAssignedTeamMemberSlug": "",
    "valuationAssignedTeamMemberSlug": "",
    "sendClientConfirmation": true,
    "sendInternalNotification": true
  }'::jsonb,
  updated_at = now()
where slug = 'alu-realty-group';
