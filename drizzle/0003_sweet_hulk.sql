CREATE TABLE `auth_accounts` (
	`provider_id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_states` (
	`id` text PRIMARY KEY NOT NULL,
	`nonce` text NOT NULL,
	`verifier` text NOT NULL,
	`link_owner` text,
	`expires` integer NOT NULL
);
