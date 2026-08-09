-- Destructive: removes only Baby Companion application tables from one database.
-- The schema is restored by importing the initial migration immediately afterward.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `growth_record_assets`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `media_assets`;
DROP TABLE IF EXISTS `growth_records`;
DROP TABLE IF EXISTS `family_invites`;
DROP TABLE IF EXISTS `family_members`;
DROP TABLE IF EXISTS `babies`;
DROP TABLE IF EXISTS `families`;
DROP TABLE IF EXISTS `idempotency_keys`;
DROP TABLE IF EXISTS `auth_refresh_tokens`;
DROP TABLE IF EXISTS `auth_sessions`;
DROP TABLE IF EXISTS `user_identities`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;
