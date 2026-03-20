-- PROFILES (extends auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  office_name text,
  cnpj text,
  phone text,
  address text,
  plan text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CLIENTS
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  cnpj text,
  regime text not null,
  sector text,
  revenue numeric default 0,
  tax_impact numeric default 0,
  status text default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- DOCUMENTS
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  type text not null,
  period text,
  status text default 'pending',
  due_date date,
  value numeric default 0,
  notes text,
  created_at timestamptz default now()
);

-- ALERTS
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  client_name text,
  type text not null,
  title text not null,
  description text,
  read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table clients enable row level security;
alter table documents enable row level security;
alter table alerts enable row level security;

create policy "own_profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own_clients" on clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_documents" on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_alerts" on alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SIMULATIONS
create table if not exists simulations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  company_name text not null,
  regime text not null,
  sector text not null,
  revenue numeric not null,
  state text,
  impact_percent numeric,
  impact_annual numeric,
  current_burden numeric,
  new_burden_2033 numeric,
  recommendation text,
  created_at timestamptz default now()
);
alter table simulations enable row level security;
create policy "own_simulations" on simulations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
