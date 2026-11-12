CREATE TABLE `reel_delivery` (
	`id` text PRIMARY KEY NOT NULL,
	`reel_id` text NOT NULL,
	`owner` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lease` text,
	`lease_until` integer,
	`size` integer,
	`error` text,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reel_delivery_once` ON `reel_delivery` (`reel_id`);--> statement-breakpoint
CREATE INDEX `reel_delivery_queue` ON `reel_delivery` (`status`,`updated`);