alter table public.lead_submissions
  drop constraint if exists lead_submissions_lead_type_check;

alter table public.lead_submissions
  add constraint lead_submissions_lead_type_check
  check (
    lead_type in (
      'account',
      'valuation',
      'contact',
      'saved_search',
      'seller',
      'buyer',
      'buyer_seller',
      'investor',
      'lease',
      'other'
    )
  );
