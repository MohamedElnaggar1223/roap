CREATE TABLE `accounts` (
	`id` varchar(255) NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`userId` bigint NOT NULL,
	`accessToken` text DEFAULT ('NULL'),
	`refreshToken` text DEFAULT ('NULL'),
	`idToken` text DEFAULT ('NULL'),
	`expiresAt` timestamp DEFAULT 'NULL',
	`password` text DEFAULT ('NULL')
);
--> statement-breakpoint
CREATE TABLE `usersAuth` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` boolean NOT NULL,
	`image` text,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `usersAuth_id` PRIMARY KEY(`id`),
	CONSTRAINT `usersAuth_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
DROP TABLE `account`;--> statement-breakpoint
ALTER TABLE `session` DROP FOREIGN KEY `session_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `session` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `verification` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `ipAddress` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `userAgent` text DEFAULT ('NULL');--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `userId` bigint NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `identifier` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `value` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `image` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_usersAuth_id_fk` FOREIGN KEY (`userId`) REFERENCES `usersAuth`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX `userId` ON `accounts` (`userId`);--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_usersAuth_id_fk` FOREIGN KEY (`userId`) REFERENCES `usersAuth`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX `userId` ON `session` (`userId`);