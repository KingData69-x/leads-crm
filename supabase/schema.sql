-- Run this in your Supabase project's SQL Editor

create type lead_status as enum ('new', 'called', 'interested', 'not_interested', 'closed');

create table leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  phone text not null,
  address text,
  category text,
  city text,
  status lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_idx on leads(status);
create index leads_category_idx on leads(category);
create index leads_city_idx on leads(city);
create index leads_created_at_idx on leads(created_at desc);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row
  execute function set_updated_at();

-- Row-level security: allow anyone with the anon key to read + update
-- For production, replace with auth-gated policies.
alter table leads enable row level security;

create policy "public read" on leads for select using (true);
create policy "public insert" on leads for insert with check (true);
create policy "public update" on leads for update using (true);
create policy "public delete" on leads for delete using (true);
