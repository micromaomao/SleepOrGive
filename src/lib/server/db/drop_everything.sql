drop table if exists db_migration_state cascade;
drop table if exists rate_limit_state;
drop table if exists sessions;
drop table if exists users;

drop extension if exists ulid;
