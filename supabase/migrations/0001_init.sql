-- Consensus Capital - Supabase schema. Indexing and UX cache only.
-- GenLayer ConsensusCapital contract is the source of truth.

create table if not exists profiles (
  wallet text primary key,
  display_name text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists opportunities (
  opportunity_id text primary key,
  proposer_address text not null,
  title text not null,
  category text not null,
  summary text,
  market text,
  stage text,
  team_summary text,
  traction_summary text,
  thesis_text text,
  evidence_links jsonb default '[]'::jsonb,
  amount_sought text,
  currency text,
  status text not null default 'SUBMITTED',
  created_at timestamptz default now()
);

create table if not exists consensus_results (
  opportunity_id text primary key references opportunities(opportunity_id) on delete cascade,
  consensus_score numeric,
  confidence numeric,
  disagreement_index numeric,
  recommendation_band text,
  dimension_scores jsonb,
  summary text,
  strengths jsonb default '[]'::jsonb,
  weaknesses jsonb default '[]'::jsonb,
  unknowns jsonb default '[]'::jsonb,
  follow_up_questions jsonb default '[]'::jsonb,
  reasoning text,
  updated_at timestamptz default now()
);

create table if not exists model_reviews (
  id bigserial primary key,
  opportunity_id text references opportunities(opportunity_id) on delete cascade,
  model_id text not null,
  dimension_focus text,
  dimension_scores jsonb,
  recommendation_hint text,
  strengths jsonb,
  weaknesses jsonb,
  unknowns jsonb,
  reasoning text,
  confidence numeric,
  created_at timestamptz default now()
);

create table if not exists watchlists (
  watcher_address text not null,
  opportunity_id text not null references opportunities(opportunity_id) on delete cascade,
  created_at timestamptz default now(),
  primary key (watcher_address, opportunity_id)
);

create table if not exists updates (
  update_id text primary key,
  opportunity_id text references opportunities(opportunity_id) on delete cascade,
  note text,
  evidence_links jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists transactions (
  hash text primary key,
  wallet text not null,
  kind text not null,
  opportunity_id text,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id bigserial primary key,
  wallet text not null,
  kind text not null,
  payload jsonb,
  read boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table opportunities enable row level security;
alter table consensus_results enable row level security;
alter table model_reviews enable row level security;
alter table watchlists enable row level security;
alter table updates enable row level security;
alter table transactions enable row level security;
alter table notifications enable row level security;

create policy "profiles public read" on profiles for select using (true);
create policy "opportunities public read" on opportunities for select using (true);
create policy "consensus public read" on consensus_results for select using (true);
create policy "model_reviews public read" on model_reviews for select using (true);
create policy "updates public read" on updates for select using (true);

-- Grants for the service_role (server-side writes via SUPABASE_SERVICE_ROLE_KEY)
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- Read grants for the anon and authenticated roles
grant select on profiles, opportunities, consensus_results, model_reviews, updates to anon, authenticated;
