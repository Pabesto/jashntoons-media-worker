CREATE TABLE `invitation_links` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`slug` text NOT NULL,
	`draft_data` text NOT NULL,
	`published_data` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitation_links_slug` ON `invitation_links` (`slug`);--> statement-breakpoint
CREATE INDEX `invitation_links_owner` ON `invitation_links` (`owner`,`updated`);