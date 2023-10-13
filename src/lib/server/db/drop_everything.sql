drop table if exists db_migration_state cascade;

drop table if exists users cascade;
drop table if exists auth_attempts cascade;
drop table if exists email_verification cascade;
drop table if exists notification_subscriptions cascade;
drop table if exists outgoing_mails cascade;
drop table if exists rate_limit_state cascade;
drop table if exists sessions cascade;
drop table if exists signup_flow cascade;
drop table if exists sleep_notifications cascade;
drop table if exists sleep_records cascade;
drop table if exists user_auth_methods cascade;
drop table if exists user_notices cascade;
drop table if exists users cascade;


drop extension if exists ulid;
