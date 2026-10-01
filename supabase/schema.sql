-- ════════════════════════════════════════════════════════════════════════
--  Story Maker — Supabase / PostgreSQL schema  (PRD v1.0 §4 + v1.0 extensions)
--  Run in Supabase → SQL Editor, or let Drizzle manage it: `npx drizzle-kit push`
--  (src/db/schema.ts is the source of truth and mirrors this file 1:1).
-- ════════════════════════════════════════════════════════════════════════
create extension if not exists "pgcrypto";

-- ── ENUM kategori babak & status ────────────────────────────────────────
do $$ begin
  create type story_act_type as enum ('ACT_1_HOOK', 'ACT_2_SOMATIC', 'ACT_3_CLINICAL_AI', 'ACT_4_ANCHOR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type post_status as enum ('DRAFT', 'SCHEDULED', 'POSTED', 'FAILED');
exception when duplicate_object then null; end $$;

-- ── Rencana story harian / flash promo ──────────────────────────────────
create table if not exists daily_campaigns (
  id                 uuid primary key default gen_random_uuid(),
  campaign_date      date not null,
  campaign_type      text not null default 'DAILY_AUTONOMOUS', -- 'DAILY_AUTONOMOUS' | 'FLASH_PROMO'
  theme_topic        text not null,
  raw_input_notes    text,
  core_insight       text,                          -- ext: insight pemersatu 4 babak
  generation_source  text not null default 'gemini', -- ext: 'gemini' | 'offline'
  generation_model   text,                          -- ext: model yang menang di cascade
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists daily_campaigns_campaign_date_idx on daily_campaigns (campaign_date);
create index if not exists daily_campaigns_campaign_type_idx on daily_campaigns (campaign_type);

-- ── Detail slide per babak ──────────────────────────────────────────────
create table if not exists story_slides (
  id                 uuid primary key default gen_random_uuid(),
  campaign_id        uuid not null references daily_campaigns(id) on delete cascade,
  act                story_act_type not null,
  target_time        time not null,
  headline           text not null,
  body_text          text not null,
  call_to_action     text,
  caption            text,                          -- ext: caption WA/IG
  visual_theme       text not null default 'Neuro-Dark',
  rendered_image_url text,
  status             post_status not null default 'DRAFT',
  scheduled_at       timestamptz,                   -- ext: campaign_date + target_time @ APP_TIMEZONE
  post_to_whatsapp   boolean not null default true, -- ext
  post_to_instagram  boolean not null default false,-- ext
  wa_posted_at       timestamptz,
  ig_posted_at       timestamptz,
  ig_media_id        text,                          -- ext
  wa_lock_at         timestamptz,                   -- ext: lease anti double-post (daemon)
  ig_lock_at         timestamptz,                   -- ext: lease anti double-post (IG)
  last_error         text,                          -- ext
  meta               jsonb not null default '{}'::jsonb, -- ext: technique, key_element, storage path, etag
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index if not exists story_slides_campaign_act_uq on story_slides (campaign_id, act);
create index if not exists story_slides_dispatch_idx on story_slides (status, scheduled_at);

-- ── Fallback penyimpanan PNG (dipakai bila Supabase Storage belum dikonfigurasi) ──
create table if not exists story_assets (
  id           uuid primary key default gen_random_uuid(),
  slide_id     uuid unique references story_slides(id) on delete cascade,
  content_type text not null default 'image/png',
  data         bytea not null,
  byte_size    integer not null,
  etag         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Telemetry model Gemini untuk Quota Guard ────────────────────────────
create table if not exists gemini_model_telemetry (
  id            uuid primary key default gen_random_uuid(),
  model_name    text not null,
  status_code   int not null,
  latency_ms    int,
  error_message text,
  request_id    text,                               -- ext: mengelompokkan percobaan cascade per request
  "timestamp"   timestamptz not null default now()
);
create index if not exists gemini_telemetry_ts_idx on gemini_model_telemetry ("timestamp");
create index if not exists gemini_telemetry_model_ts_idx on gemini_model_telemetry (model_name, "timestamp");

-- ── Key/value state (persona, heartbeat daemon) ─────────────────────────
create table if not exists app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────
-- The app talks to Postgres through DATABASE_URL (table owner) and to Storage
-- with the service-role key, both of which bypass RLS. Enabling RLS with NO
-- policies means the public anon key can read/write nothing (deny by default).
alter table daily_campaigns        enable row level security;
alter table story_slides           enable row level security;
alter table story_assets           enable row level security;
alter table gemini_model_telemetry enable row level security;
alter table app_state              enable row level security;

-- ── Storage bucket & policies (Public Read, Authenticated Write) ─────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-assets', 'story-assets', true, 10485760, array['image/png', 'image/jpeg'])
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/png', 'image/jpeg'];

-- Policy: Siapapun dapat membaca gambar rendered secara publik
do $$ begin
  create policy "Public Read story-assets"
  on storage.objects for select
  using (bucket_id = 'story-assets');
exception when duplicate_object then null; end $$;

-- Policy: Hanya service_role / authenticated yang dapat upload & mengelola gambar
do $$ begin
  create policy "Auth / Service Upload story-assets"
  on storage.objects for insert
  to authenticated, service_role
  with check (bucket_id = 'story-assets');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth / Service Update story-assets"
  on storage.objects for update
  to authenticated, service_role
  using (bucket_id = 'story-assets');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth / Service Delete story-assets"
  on storage.objects for delete
  to authenticated, service_role
  using (bucket_id = 'story-assets');
exception when duplicate_object then null; end $$;
