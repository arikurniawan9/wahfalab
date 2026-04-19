-- WahfaLab Supabase Storage Setup
-- Jalankan di Supabase SQL Editor

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('company-assets', 'company-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']),
  ('travel-orders', 'travel-orders', true, 10485760, array['application/pdf']),
  ('sampling-photos', 'sampling-photos', true, 10485760, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']),
  ('lab-results', 'lab-results', true, 15728640, array['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']),
  ('payment-proofs', 'payment-proofs', true, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('content-media', 'content-media', true, 10485760, array['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "Public read company-assets" on storage.objects;
create policy "Public read company-assets"
on storage.objects for select
using (bucket_id = 'company-assets');

drop policy if exists "Public read travel-orders" on storage.objects;
create policy "Public read travel-orders"
on storage.objects for select
using (bucket_id = 'travel-orders');

drop policy if exists "Public read sampling-photos" on storage.objects;
create policy "Public read sampling-photos"
on storage.objects for select
using (bucket_id = 'sampling-photos');

drop policy if exists "Public read lab-results" on storage.objects;
create policy "Public read lab-results"
on storage.objects for select
using (bucket_id = 'lab-results');

drop policy if exists "Public read payment-proofs" on storage.objects;
create policy "Public read payment-proofs"
on storage.objects for select
using (bucket_id = 'payment-proofs');

drop policy if exists "Public read content-media" on storage.objects;
create policy "Public read content-media"
on storage.objects for select
using (bucket_id = 'content-media');

drop policy if exists "Authenticated upload company-assets" on storage.objects;
create policy "Authenticated upload company-assets"
on storage.objects for insert
with check (bucket_id = 'company-assets' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete company-assets" on storage.objects;
create policy "Authenticated delete company-assets"
on storage.objects for delete
using (bucket_id = 'company-assets' and auth.role() = 'authenticated');

drop policy if exists "Authenticated upload travel-orders" on storage.objects;
create policy "Authenticated upload travel-orders"
on storage.objects for insert
with check (bucket_id = 'travel-orders' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete travel-orders" on storage.objects;
create policy "Authenticated delete travel-orders"
on storage.objects for delete
using (bucket_id = 'travel-orders' and auth.role() = 'authenticated');

drop policy if exists "Authenticated upload sampling-photos" on storage.objects;
create policy "Authenticated upload sampling-photos"
on storage.objects for insert
with check (bucket_id = 'sampling-photos' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete sampling-photos" on storage.objects;
create policy "Authenticated delete sampling-photos"
on storage.objects for delete
using (bucket_id = 'sampling-photos' and auth.role() = 'authenticated');

drop policy if exists "Authenticated upload lab-results" on storage.objects;
create policy "Authenticated upload lab-results"
on storage.objects for insert
with check (bucket_id = 'lab-results' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete lab-results" on storage.objects;
create policy "Authenticated delete lab-results"
on storage.objects for delete
using (bucket_id = 'lab-results' and auth.role() = 'authenticated');

drop policy if exists "Authenticated upload payment-proofs" on storage.objects;
create policy "Authenticated upload payment-proofs"
on storage.objects for insert
with check (bucket_id = 'payment-proofs' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete payment-proofs" on storage.objects;
create policy "Authenticated delete payment-proofs"
on storage.objects for delete
using (bucket_id = 'payment-proofs' and auth.role() = 'authenticated');

drop policy if exists "Authenticated upload content-media" on storage.objects;
create policy "Authenticated upload content-media"
on storage.objects for insert
with check (bucket_id = 'content-media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated delete content-media" on storage.objects;
create policy "Authenticated delete content-media"
on storage.objects for delete
using (bucket_id = 'content-media' and auth.role() = 'authenticated');
