CREATE TABLE `carts` (
	`owner` text PRIMARY KEY NOT NULL,
	`items` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credit_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`credits` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reel_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`status` text NOT NULL,
	`payload` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL,
	`media_id` text,
	`provider_task` text,
	`mime` text,
	`size` integer,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `reel_jobs_owner` ON `reel_jobs` (`owner`);