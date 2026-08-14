create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_employees_status on public.employees(status);
create index if not exists idx_employees_name on public.employees(name);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  identification text not null,
  plate text,
  model text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Inativo')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicles_status on public.vehicles(status);
create index if not exists idx_vehicles_identification on public.vehicles(identification);

create table if not exists public.loadings (
  id uuid primary key default gen_random_uuid(),
  operation_date date not null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  volumes integer not null check (volumes > 0),
  mover_employee_id uuid references public.employees(id) on delete set null,
  loader_employee_id uuid references public.employees(id) on delete set null,
  organizer_employee_id uuid references public.employees(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_loadings_operation_date on public.loadings(operation_date);
create index if not exists idx_loadings_vehicle_id on public.loadings(vehicle_id);
create index if not exists idx_loadings_mover on public.loadings(mover_employee_id);
create index if not exists idx_loadings_loader on public.loadings(loader_employee_id);
create index if not exists idx_loadings_organizer on public.loadings(organizer_employee_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  entity text not null,
  record_id uuid,
  action text not null,
  previous_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_employees_updated_at on public.employees;
create trigger handle_employees_updated_at
before update on public.employees
for each row execute procedure public.update_updated_at_column();

drop trigger if exists handle_vehicles_updated_at on public.vehicles;
create trigger handle_vehicles_updated_at
before update on public.vehicles
for each row execute procedure public.update_updated_at_column();

drop trigger if exists handle_loadings_updated_at on public.loadings;
create trigger handle_loadings_updated_at
before update on public.loadings
for each row execute procedure public.update_updated_at_column();

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.vehicles enable row level security;
alter table public.loadings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_are_viewable_by_owners" on public.profiles;
create policy "profiles_are_viewable_by_owners" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_are_insertable_by_owners" on public.profiles;
create policy "profiles_are_insertable_by_owners" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "employees_are_viewable_authenticated" on public.employees;
create policy "employees_are_viewable_authenticated" on public.employees
for select using (auth.role() = 'authenticated');

drop policy if exists "employees_are_manageable_authenticated" on public.employees;
create policy "employees_are_manageable_authenticated" on public.employees
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "vehicles_are_viewable_authenticated" on public.vehicles;
create policy "vehicles_are_viewable_authenticated" on public.vehicles
for select using (auth.role() = 'authenticated');

drop policy if exists "vehicles_are_manageable_authenticated" on public.vehicles;
create policy "vehicles_are_manageable_authenticated" on public.vehicles
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "loadings_are_viewable_authenticated" on public.loadings;
create policy "loadings_are_viewable_authenticated" on public.loadings
for select using (auth.role() = 'authenticated');

drop policy if exists "loadings_are_manageable_authenticated" on public.loadings;
create policy "loadings_are_manageable_authenticated" on public.loadings
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "audit_logs_are_viewable_authenticated" on public.audit_logs;
create policy "audit_logs_are_viewable_authenticated" on public.audit_logs
for select using (auth.role() = 'authenticated');

drop policy if exists "audit_logs_are_insertable_authenticated" on public.audit_logs;
create policy "audit_logs_are_insertable_authenticated" on public.audit_logs
for insert with check (auth.role() = 'authenticated');

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
