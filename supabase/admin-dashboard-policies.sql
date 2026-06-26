grant usage on schema public to service_role;
grant select on public.lead_submissions to service_role;
grant select, update on public.team_members to service_role;
grant select, update on public.site_banners to service_role;
grant select, update on public.testimonials to service_role;
grant select on public.lead_submissions to authenticated;

drop policy if exists "Authenticated users can view leads" on public.lead_submissions;
drop policy if exists "Service role can update site banners" on public.site_banners;
drop policy if exists "Service role can update team members" on public.team_members;
drop policy if exists "Service role can view testimonials" on public.testimonials;
drop policy if exists "Service role can update testimonials" on public.testimonials;

create policy "Authenticated users can view leads"
  on public.lead_submissions for select
  using (auth.role() = 'authenticated');

create policy "Service role can update site banners"
  on public.site_banners for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can update team members"
  on public.team_members for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can view testimonials"
  on public.testimonials for select
  using (auth.role() = 'service_role');

create policy "Service role can update testimonials"
  on public.testimonials for update
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
