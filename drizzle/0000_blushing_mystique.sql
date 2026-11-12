CREATE TABLE `ai_usage` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `media_owner` ON `media` (`owner`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`payload` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_owner` ON `projects` (`owner`);