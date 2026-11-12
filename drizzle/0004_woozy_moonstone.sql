CREATE TABLE `creator_bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`creator` text NOT NULL,
	`caption` text NOT NULL,
	`items` text NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `creator_bundles_owner` ON `creator_bundles` (`owner`);--> statement-breakpoint
CREATE INDEX `creator_bundles_public` ON `creator_bundles` (`published`,`created`);--> statement-breakpoint
CREATE TABLE `creator_likes` (
	`bundle_id` text NOT NULL,
	`owner` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creator_like_once` ON `creator_likes` (`bundle_id`,`owner`);