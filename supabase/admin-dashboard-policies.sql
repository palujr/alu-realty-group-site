grant select on public.lead_submissions to authenticated;

drop policy if exists "Authenticated users can view leads" on public.lead_submissions;

create policy "Authenticated users can view leads"
  on public.lead_submissions for select
  using (auth.role() = 'authenticated');
