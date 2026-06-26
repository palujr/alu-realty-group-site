alter table public.broker_sites
  add column if not exists hero_image_url text;

update public.broker_sites
set
  hero_image_url = coalesce(nullif(hero_image_url, ''), '/assets/desert-home-hero.png'),
  updated_at = now()
where slug = 'alu-realty-group';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-hero-images',
  'site-hero-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view site hero images" on storage.objects;

create policy "Public can view site hero images"
  on storage.objects for select
  using (bucket_id = 'site-hero-images');
