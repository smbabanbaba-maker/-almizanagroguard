CREATE TABLE `aiAnalysisResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`crop` varchar(80) NOT NULL,
	`possibleCondition` varchar(255) NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`severity` varchar(80) NOT NULL,
	`recommendation` text NOT NULL,
	`expertRequired` int NOT NULL DEFAULT 0,
	`expertGuidance` text,
	`uncertaintyReason` text,
	`rawJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiAnalysisResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cropHealthScans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`farmId` int,
	`cropId` int,
	`cropType` varchar(80) NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` varchar(1024) NOT NULL,
	`status` enum('processing','complete','failed') NOT NULL DEFAULT 'processing',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cropHealthScans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`variety` varchar(120),
	`plantedAt` timestamp,
	`status` enum('active','harvested','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`location` varchar(255),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `farms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`scanId` int,
	`farmId` int,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`source` varchar(80) NOT NULL DEFAULT 'agroguard-ai',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
