-- Rabalata Rides starter schema. Run in Supabase SQL Editor.
-- Keep ID documents in a PRIVATE storage bucket. Never expose raw ID numbers to other users.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer','driver','admin')) default 'customer',
  full_name text,
  email text,
  phone text,
  id_number text,
  id_verified boolean not null default false,
  kyc_provider_reference text,
  avatar_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  colour text not null,
  registration_number text not null,
  year integer,
  photo_paths text[] not null default '{}',
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now(),
  unique(registration_number)
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  driver_id uuid references public.profiles(id),
  vehicle_id uuid references public.vehicles(id),
  pickup_text text not null,
  destination_text text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  destination_lat double precision,
  destination_lng double precision,
  customer_offer_cents bigint not null check (customer_offer_cents > 0),
  agreed_fare_cents bigint,
  payment_method text not null check (payment_method in ('cash','card')),
  status text not null default 'requested' check (status in ('requested','negotiating','accepted','driver_arriving','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ride_offers (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  driver_id uuid not null references public.profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  message text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now()
);

create table if not exists public.driver_locations (
  driver_id uuid primary key references public.profiles(id) on delete cascade,
  ride_id uuid references public.rides(id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  heading double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id),
  ride_id uuid references public.rides(id),
  entry_type text not null check (entry_type in ('ride_credit','withdrawal','adjustment','fee','refund')),
  amount_cents bigint not null,
  currency text not null default 'ZAR',
  provider_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  bank_account_token text,
  status text not null default 'pending' check (status in ('pending','processing','paid','rejected')),
  provider_reference text,
  created_at timestamptz not null default now()
);


create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id),
  customer_id uuid not null references public.profiles(id),
  driver_id uuid not null references public.profiles(id),
  provider text not null default 'paystack',
  provider_reference text not null unique,
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'ZAR',
  status text not null default 'initialized' check (status in ('initialized','success','failed','refunded')),
  provider_event jsonb,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create policy "customer reads own payments" on public.payments for select to authenticated using (customer_id = auth.uid());
create policy "driver reads own payments" on public.payments for select to authenticated using (driver_id = auth.uid());

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_offers enable row level security;
alter table public.driver_locations enable row level security;
alter table public.wallet_ledger enable row level security;
alter table public.withdrawal_requests enable row level security;

-- Users can read/update only their own profile. Admin policies must be added only after
-- securely provisioning admin role server-side; never let users self-assign admin.
create policy "profile self read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profile self insert" on public.profiles for insert to authenticated with check (id = auth.uid() and role <> 'admin');
create policy "profile self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role <> 'admin');

create policy "driver reads own vehicles" on public.vehicles for select to authenticated using (driver_id = auth.uid());
create policy "driver submits own vehicle" on public.vehicles for insert to authenticated with check (driver_id = auth.uid());
create policy "customer reads own rides" on public.rides for select to authenticated using (customer_id = auth.uid());
create policy "driver reads assigned rides" on public.rides for select to authenticated using (driver_id = auth.uid());
create policy "customer creates own ride" on public.rides for insert to authenticated with check (customer_id = auth.uid());
create policy "driver reads own offers" on public.ride_offers for select to authenticated using (driver_id = auth.uid());
create policy "driver creates own offer" on public.ride_offers for insert to authenticated with check (driver_id = auth.uid());
create policy "driver manages own location" on public.driver_locations for all to authenticated using (driver_id = auth.uid()) with check (driver_id = auth.uid());
create policy "driver reads own wallet" on public.wallet_ledger for select to authenticated using (driver_id = auth.uid());
create policy "driver reads own withdrawals" on public.withdrawal_requests for select to authenticated using (driver_id = auth.uid());
create policy "driver requests withdrawal" on public.withdrawal_requests for insert to authenticated with check (driver_id = auth.uid());

-- IMPORTANT: this schema is a starting point, not a completed production security review.
-- Add transactional RPCs for ride acceptance, offer acceptance, wallet crediting and payout.
-- Those operations must run server-side and must never trust client-supplied wallet amounts.

-- Approved drivers may view unassigned ride requests and claim them.
create policy "approved drivers view open requests" on public.rides for select to authenticated using (status = 'requested' and exists (select 1 from public.vehicles v where v.driver_id = auth.uid() and v.approval_status = 'approved'));
create policy "approved drivers accept open requests" on public.rides for update to authenticated using (status = 'requested' and exists (select 1 from public.vehicles v where v.driver_id = auth.uid() and v.approval_status = 'approved')) with check (driver_id = auth.uid() and status in ('accepted','driver_arriving','in_progress','completed'));
create policy "customer sees assigned driver location" on public.driver_locations for select to authenticated using (exists (select 1 from public.rides r where r.customer_id = auth.uid() and r.driver_id = driver_locations.driver_id and r.id = driver_locations.ride_id and r.status in ('accepted','driver_arriving','in_progress')));

create policy "driver updates assigned trips" on public.rides for update to authenticated using (driver_id = auth.uid() and status in ('accepted','driver_arriving','in_progress')) with check (driver_id = auth.uid() and status in ('accepted','driver_arriving','in_progress','completed'));

-- Create a private profile row automatically when a phone/password account is created.
-- The ID number remains visible only to the account owner under the profile RLS policy.
create or replace function public.handle_new_rabalata_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, phone, id_number)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'driver' then 'driver' else 'customer' end,
    new.phone,
    new.raw_user_meta_data->>'id_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rabalata on auth.users;
create trigger on_auth_user_created_rabalata
after insert on auth.users
for each row execute procedure public.handle_new_rabalata_user();

-- Additional production foundations for private driver onboarding and admin operations.
alter table public.profiles add column if not exists selfie_path text;
alter table public.profiles add column if not exists id_document_path text;
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
alter table public.platform_settings enable row level security;

-- Customers may see offers belonging to their own ride; offers are accepted through a server API.
create policy "customer reads offers on own rides" on public.ride_offers for select to authenticated
using (exists (select 1 from public.rides r where r.id = ride_offers.ride_id and r.customer_id = auth.uid()));

-- Driver onboarding files live in a private bucket. Files are stored under the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('driver-private', 'driver-private', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
create policy "driver uploads own private files" on storage.objects for insert to authenticated
with check (bucket_id = 'driver-private' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "driver reads own private files" on storage.objects for select to authenticated
using (bucket_id = 'driver-private' and (storage.foldername(name))[1] = auth.uid()::text);

-- Idempotent payment settlement: wallet credit is created only once, after server-side verification.
create or replace function public.settle_paystack_payment(
  p_reference text,
  p_amount_cents bigint,
  p_currency text,
  p_event jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare payment_row public.payments%rowtype;
begin
  select * into payment_row from public.payments where provider_reference = p_reference for update;
  if not found then return false; end if;
  if payment_row.amount_cents <> p_amount_cents or payment_row.currency <> p_currency then return false; end if;
  if payment_row.status = 'success' then return true; end if;
  update public.payments set status = 'success', provider_event = p_event where id = payment_row.id;
  insert into public.wallet_ledger (driver_id, ride_id, entry_type, amount_cents, currency, provider_reference)
  values (payment_row.driver_id, payment_row.ride_id, 'ride_credit', payment_row.amount_cents, payment_row.currency, p_reference)
  on conflict do nothing;
  return true;
end;
$$;
revoke all on function public.settle_paystack_payment(text,bigint,text,jsonb) from public, anon, authenticated;
grant execute on function public.settle_paystack_payment(text,bigint,text,jsonb) to service_role;

-- Prevent duplicate wallet credits even if a payment webhook is delivered more than once.
create unique index if not exists wallet_ledger_provider_reference_unique
on public.wallet_ledger(provider_reference) where provider_reference is not null and entry_type = 'ride_credit';

-- Update open-ride visibility and acceptance for price negotiation.
drop policy if exists "approved drivers view open requests" on public.rides;
create policy "approved drivers view open requests" on public.rides for select to authenticated
using (status in ('requested','negotiating') and exists (select 1 from public.vehicles v where v.driver_id = auth.uid() and v.approval_status = 'approved'));

-- Prevent account owners from promoting themselves to admin or marking their own KYC as verified.
drop policy if exists "profile self insert" on public.profiles;
revoke update (role, id_number, id_verified, kyc_provider_reference, id_document_path, selfie_path) on public.profiles from authenticated;
grant update (full_name, phone, avatar_path) on public.profiles to authenticated;

-- Atomic withdrawal request creation; prevents two concurrent requests spending the same balance.
create or replace function public.create_driver_withdrawal(p_driver_id uuid, p_amount_cents bigint)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  verified boolean;
  driver_role text;
  ledger_balance bigint;
  reserved_balance bigint;
  request_id uuid;
begin
  select id_verified, role into verified, driver_role from public.profiles where id = p_driver_id for update;
  if driver_role <> 'driver' or verified is distinct from true then raise exception 'Verified driver identity is required.'; end if;
  if p_amount_cents < 1000 then raise exception 'Minimum withdrawal is R10.00.'; end if;
  select coalesce(sum(amount_cents),0) into ledger_balance from public.wallet_ledger where driver_id = p_driver_id;
  select coalesce(sum(amount_cents),0) into reserved_balance from public.withdrawal_requests where driver_id = p_driver_id and status in ('pending','processing');
  if p_amount_cents > ledger_balance - reserved_balance then raise exception 'Insufficient available wallet balance.'; end if;
  insert into public.withdrawal_requests(driver_id, amount_cents, status)
  values (p_driver_id, p_amount_cents, 'pending') returning id into request_id;
  return request_id;
end;
$$;
revoke all on function public.create_driver_withdrawal(uuid,bigint) from public, anon, authenticated;
grant execute on function public.create_driver_withdrawal(uuid,bigint) to service_role;
drop policy if exists "driver requests withdrawal" on public.withdrawal_requests;
create policy "public reads maintenance flag only" on public.platform_settings for select to anon, authenticated
using (key = 'maintenance_mode');
