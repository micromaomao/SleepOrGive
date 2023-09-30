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
  username text default null,
  notification_email text default null
);

create table sessions (
  hashed_bearer bytea not null primary key,
  hashed_cookie bytea default null,
  created_at timestamptz not null default now(),
  user_id text not null references users(user_id)
);

-- TODO: remove

insert into users (user_id, username, notification_email) values ('01HBJZFQNGZZ675MWV7BHN19CD', 'maowtm', 'm@maowtm.org');
