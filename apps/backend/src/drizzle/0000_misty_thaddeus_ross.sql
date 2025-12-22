-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `Portfolio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	`schemaVersion` varchar(191) NOT NULL,
	`schema` json NOT NULL,
	CONSTRAINT `Portfolio_id` PRIMARY KEY(`id`),
	CONSTRAINT `Portfolio_uuid_key` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `YahooPrice` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(191) NOT NULL,
	`currency` varchar(191) NOT NULL,
	`datetime` datetime(3) NOT NULL,
	`open` double NOT NULL,
	`high` double NOT NULL,
	`low` double NOT NULL,
	`close` double NOT NULL,
	`close_adj` double NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updatedAt` datetime(3) NOT NULL,
	CONSTRAINT `YahooPrice_id` PRIMARY KEY(`id`),
	CONSTRAINT `YahooPrice_symbol_datetime_key` UNIQUE(`symbol`,`datetime`)
);
--> statement-breakpoint
CREATE TABLE `_prisma_migrations` (
	`id` varchar(36) NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`finished_at` datetime(3),
	`migration_name` varchar(255) NOT NULL,
	`logs` text,
	`rolled_back_at` datetime(3),
	`started_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`applied_steps_count` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `_prisma_migrations_id` PRIMARY KEY(`id`)
);

*/