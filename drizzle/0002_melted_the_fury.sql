CREATE TABLE `avatars` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`art_id` text NOT NULL,
	`video_id` text,
	`mode` text NOT NULL,
	`template_id` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `avatars_owner` ON `avatars` (`owner`);--> statement-breakpoint
ALTER TABLE `media` ADD `digest` text;--> statement-breakpoint
ALTER TABLE `reel_jobs` ADD `credit_cost` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `reel_jobs` ADD `project_id` text;--> statement-breakpoint
ALTER TABLE `reel_jobs` ADD `generation_key` text;--> statement-breakpoint
CREATE UNIQUE INDEX `generation_cache` ON `reel_jobs` (`owner`,`generation_key`);