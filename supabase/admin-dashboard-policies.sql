grant select on public.lead_submissions to service_role;
grant select on public.team_members to service_role;
grant select on public.lead_submissions to authenticated;

drop policy if exists "Authenticated users can view leads" on public.lead_submissions;

create policy "Authenticated users can view leads"
  on public.lead_submissions for select
  using (auth.role() = 'authenticated');
