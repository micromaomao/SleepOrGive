create extension if not exists ulid;

-- Used to track database version, to aid automatic migrations in the future.
create table db_migration_state (
  -- Incremented every time an incompatible change is made to the schema
  db_compat_version integer not null
);
insert into db_migration_state (db_compat_version) values (1);

-- A simple table to track rate limiting
create table rate_limit_state (
  key text not null primary key,
  last_reset timestamptz not null,
  count int not null
);

create table users (
  user_id text not null primary key default gen_ulid(),
  username text default null unique nulls distinct,
  primary_email text default null unique nulls distinct,
  timezone text not null, -- IEEE tz identifier, e.g. "Europe/London"
  target time default null,
  is_public boolean default null, -- null means not asked
  last_monthly_process_time timestamptz default null
);

create table email_verification (
  id text not null primary key default gen_ulid(),
  hashed_ticket bytea not null unique,
  code text default null,
  purpose text not null -- e.g. "signup", "login"
);

create table auth_attempts (
  id text not null primary key default gen_ulid(),
  user_id text not null references users(user_id),
  completed_stages text[] not null default '{}',
  ip_addr inet not null,
  success_at timestamptz default null,
  email_verification_id text default null references email_verification(id)
);

create table sessions (
  hashed_bearer bytea not null primary key,
  hashed_cookie bytea default null unique nulls distinct,
  created_at timestamptz not null default now(),
  user_id text not null references users(user_id),
  granted_from text not null references auth_attempts(id)
);

create table user_auth_methods (
  id text not null primary key default gen_ulid(),
  user_id text not null references users(user_id),
  primary_email_verification boolean not null default false,
  oauth_provider text default null,
  oauth_refresh_token bytea default null, -- encrypted
  oauth_remote_user_id text default null,
  two_factor_webauthn_data jsonb default null
);

create index on user_auth_methods (user_id);
create unique index user_auth_methods_oauth on user_auth_methods (oauth_provider, oauth_remote_user_id) where oauth_provider is not null and oauth_remote_user_id is not null;

create table user_notices (
  id text not null primary key default gen_ulid(),
  user_id text not null references users(user_id),
  kind text not null, -- General type of notices, e.g. "privacy_policy_change"
  "text" text not null,
  link_text text default null,
  link_href text default null,
  shown_at timestamptz default null,
  dismissed_at timestamptz default null
);

create table sleep_records (
  user_id text not null references users(user_id),
  "date" date not null,
  timezone text not null,
  target time not null, -- The sleep target setting on this day
  target_utc timestamptz not null, -- The target time on this particular day
  actual_sleep_time timestamptz not null,
  primary key (user_id, "date")
);

create table notification_subscriptions (
  id text not null primary key default gen_ulid(),
  user_id text not null references users(user_id),
  platform_data jsonb not null,
  success_count bigint not null default 0,
  failure_count bigint not null default 0
);

create table sleep_notifications (
  id text not null primary key default gen_ulid(),
  scheduled_time timestamptz not null,
  subscription_id text not null references notification_subscriptions(id),
  status int not null default 0, -- 0 = pending, 1 = delivered, 2 = delivery failed
  retry_count int not null default 0
);

create table outgoing_mails (
  id text not null primary key default gen_ulid(),
  user_id text default null references users(user_id),
  address text not null,
  content text not null,
  content_plain text not null,
  status int not null default 0, -- 0 = pending, 1 = delivered, 2 = delivery failed
  retry_count int not null default 0,
  purpose text not null, -- e.g. "email_verification/signup"
  bounced_at timestamptz default null,
  spam_reported_at timestamptz default null,
  opened_at timestamptz default null
);

-- Use row-level-lock on sleep_notification and outgoing_mails during delivery

create index email_suppressed_address_due_to_bounce on outgoing_mails (address, bounced_at) where bounced_at is not null;
create index email_suppressed_address_due_to_spam_report on outgoing_mails (address, spam_reported_at) where spam_reported_at is not null;

-- Temporary table to track signup progress and store data like username / email
-- before it is confirmed. Will be deleted after user is completely signed up.
create table signup_flow (
  user_id text not null references users(user_id) primary key,
  email_verification_id text default null references email_verification(id),

  -- Stored settings to be set after successful signup, or not change if null
  username text default null,
  email text default null
)
