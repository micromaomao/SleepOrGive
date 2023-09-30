create extension if not exists ulid;

-- Used to track database version, to aid automatic migrations in the future.
create table db_migration_state (
  -- Incremented every time an incompatible change is made to the schema
  db_compat_version integer not null
);
insert into db_migration_state (db_compat_version) values (1);
