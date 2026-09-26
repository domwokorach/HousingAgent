-- Real (Postgres-backed) property listings, created by landlords/agents in-app.
-- Applied once against DATABASE_URL (the Neon app database) — see
-- src/lib/properties-db.ts for the query layer and README.md for how to (re)apply.
--
-- Separate from `sold_properties` (src/lib/sold-properties.ts), which lives in
-- RDS_DATABASE_URL and is a read-only monthly import from HM Land Registry.

create extension if not exists pgcrypto;

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  intent text not null check (intent in ('rent', 'buy')),
  price integer not null,
  address_line1 text not null,
  address_line2 text,
  town text not null,
  postcode text not null,
  lat double precision not null,
  lng double precision not null,
  type text not null,
  bedrooms integer not null,
  bathrooms integer not null,
  size_sq_ft integer not null,
  description text not null,
  available_from date not null,
  furnished text,
  energy_rating text,
  tenure text,
  council_tax_band text,
  deposit_weeks integer,
  agent_id text not null,
  owner_email text,
  featured boolean not null default false,
  listed_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  position integer not null,
  src text not null,
  category text not null,
  alt text not null,
  unique (property_id, position)
);

create index if not exists property_images_property_id_idx on property_images (property_id);
