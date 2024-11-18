-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `academics` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`entry_fees` double NOT NULL DEFAULT 0,
	`user_id` bigint(20) unsigned DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	`image` varchar(255) DEFAULT 'NULL',
	`policy` longtext DEFAULT 'NULL',
	CONSTRAINT `academics_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `academic_athletic` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`academic_id` bigint(20) unsigned NOT NULL,
	`user_id` bigint(20) unsigned NOT NULL,
	`profile_id` bigint(20) unsigned DEFAULT 'NULL',
	`sport_id` bigint(20) unsigned DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `academic_sport` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`academic_id` bigint(20) unsigned NOT NULL,
	`sport_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `academic_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`academic_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) DEFAULT 'NULL',
	`description` text DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `academic_translations_academic_id_locale_unique` UNIQUE(`academic_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`street_address` varchar(255) NOT NULL,
	`postal_code` varchar(255) DEFAULT 'NULL',
	`city_id` bigint(20) unsigned NOT NULL,
	`user_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `addresses_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`status` enum('success','rejected','pending') NOT NULL DEFAULT '''pending''',
	`coach_id` bigint(20) unsigned NOT NULL,
	`profile_id` bigint(20) unsigned DEFAULT 'NULL',
	`package_id` bigint(20) unsigned NOT NULL,
	`price` double NOT NULL DEFAULT 0,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	`academy_policy` tinyint(1) NOT NULL DEFAULT 0,
	`roap_policy` tinyint(1) NOT NULL DEFAULT 0,
	`package_price` double NOT NULL DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `booking_sessions` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`from` varchar(255) NOT NULL,
	`to` varchar(255) NOT NULL,
	`status` enum('pending','accepted','upcoming','rejected','cancelled') NOT NULL DEFAULT '''pending''',
	`booking_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`latitude` varchar(255) DEFAULT 'NULL',
	`longitude` varchar(255) DEFAULT 'NULL',
	`is_default` tinyint(1) NOT NULL DEFAULT 0,
	`rate` double DEFAULT 'NULL',
	`reviews` int(11) DEFAULT 'NULL',
	`academic_id` bigint(20) unsigned DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	`url` varchar(255) DEFAULT 'NULL',
	`place_id` varchar(255) DEFAULT 'NULL',
	`name_in_google_map` varchar(255) DEFAULT 'NULL',
	CONSTRAINT `branches_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `branch_facility` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`branch_id` bigint(20) unsigned NOT NULL,
	`facility_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `branch_sport` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`branch_id` bigint(20) unsigned NOT NULL,
	`sport_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `branch_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`branch_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `branch_translations_branch_id_locale_unique` UNIQUE(`branch_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `cache` (
	`key` varchar(255) NOT NULL,
	`value` mediumtext NOT NULL,
	`expiration` int(11) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cache_locks` (
	`key` varchar(255) NOT NULL,
	`owner` varchar(255) NOT NULL,
	`expiration` int(11) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`state_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `city_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`city_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `city_translations_city_id_locale_unique` UNIQUE(`city_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `coaches` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`image` varchar(255) DEFAULT 'NULL',
	`bio` text DEFAULT 'NULL',
	`gender` varchar(255) DEFAULT 'NULL',
	`private_session_percentage` varchar(255) DEFAULT 'NULL',
	`academic_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	`date_of_birth` date DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `coach_package` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`coach_id` bigint(20) unsigned NOT NULL,
	`package_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `coach_program` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`coach_id` bigint(20) unsigned NOT NULL,
	`program_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `coach_spoken_language` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`spoken_language_id` bigint(20) unsigned NOT NULL,
	`coach_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `coach_sport` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`coach_id` bigint(20) unsigned NOT NULL,
	`sport_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `country_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`country_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `country_translations_country_id_locale_unique` UNIQUE(`country_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `facility_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`facility_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `facility_translations_facility_id_locale_unique` UNIQUE(`facility_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `failed_jobs` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`uuid` varchar(255) NOT NULL,
	`connection` text NOT NULL,
	`queue` text NOT NULL,
	`payload` longtext NOT NULL,
	`exception` longtext NOT NULL,
	`failed_at` timestamp NOT NULL DEFAULT 'current_timestamp()',
	CONSTRAINT `failed_jobs_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`queue` varchar(255) NOT NULL,
	`payload` longtext NOT NULL,
	`attempts` tinyint(3) unsigned NOT NULL,
	`reserved_at` int(10) unsigned DEFAULT 'NULL',
	`available_at` int(10) unsigned NOT NULL,
	`created_at` int(10) unsigned NOT NULL
);
--> statement-breakpoint
CREATE TABLE `job_batches` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`total_jobs` int(11) NOT NULL,
	`pending_jobs` int(11) NOT NULL,
	`failed_jobs` int(11) NOT NULL,
	`failed_job_ids` longtext NOT NULL,
	`options` mediumtext DEFAULT 'NULL',
	`cancelled_at` int(11) DEFAULT 'NULL',
	`created_at` int(11) NOT NULL,
	`finished_at` int(11) DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `join_us` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `join_us_phone_email_unique` UNIQUE(`phone`,`email`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`referable_type` varchar(255) NOT NULL,
	`referable_id` bigint(20) unsigned NOT NULL,
	`url` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL DEFAULT '''0''',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `migrations` (
	`id` int(10) unsigned AUTO_INCREMENT NOT NULL,
	`migration` varchar(255) NOT NULL,
	`batch` int(11) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `model_has_permissions` (
	`permission_id` bigint(20) unsigned NOT NULL,
	`model_type` varchar(255) NOT NULL,
	`model_id` bigint(20) unsigned NOT NULL
);
--> statement-breakpoint
CREATE TABLE `model_has_roles` (
	`role_id` bigint(20) unsigned NOT NULL,
	`model_type` varchar(255) NOT NULL,
	`model_id` bigint(20) unsigned NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` uuid NOT NULL,
	`type` varchar(255) NOT NULL,
	`notifiable_type` varchar(255) NOT NULL,
	`notifiable_id` bigint(20) unsigned NOT NULL,
	`data` text NOT NULL,
	`read_at` timestamp DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `otp_verifications` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`otp` varchar(255) NOT NULL,
	`phone_number` varchar(255) NOT NULL,
	`user_id` bigint(20) unsigned DEFAULT 'NULL',
	`expired_at` timestamp DEFAULT 'NULL',
	`verified_at` timestamp DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `otp_verifications_phone_number_unique` UNIQUE(`phone_number`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`price` double NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`session_per_week` int(11) NOT NULL DEFAULT 0,
	`session_duration` int(11) DEFAULT 'NULL',
	`program_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`order_by` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	`image` varchar(255) DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `page_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`page_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`title` varchar(255) DEFAULT 'NULL',
	`content` text DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `page_translations_page_id_locale_unique` UNIQUE(`page_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`resourceable_type` varchar(255) NOT NULL,
	`resourceable_id` bigint(20) unsigned NOT NULL,
	`price` double NOT NULL,
	`payment_method` varchar(255) DEFAULT 'NULL',
	`merchant_reference_number` varchar(255) DEFAULT 'NULL',
	`status` varchar(255) NOT NULL DEFAULT '''pending''',
	`referable_type` varchar(255) NOT NULL,
	`referable_id` bigint(20) unsigned NOT NULL,
	`reference_number` uuid NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`guard_name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	`label` varchar(255) DEFAULT 'NULL',
	CONSTRAINT `permissions_name_guard_name_unique` UNIQUE(`name`,`guard_name`)
);
--> statement-breakpoint
CREATE TABLE `personal_access_tokens` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`tokenable_type` varchar(255) NOT NULL,
	`tokenable_id` bigint(20) unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`token` varchar(64) NOT NULL,
	`abilities` text DEFAULT 'NULL',
	`last_used_at` timestamp DEFAULT 'NULL',
	`expires_at` timestamp DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `personal_access_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`gender` varchar(255) DEFAULT 'NULL',
	`birthday` date DEFAULT 'NULL',
	`user_id` bigint(20) unsigned NOT NULL,
	`image` varchar(255) DEFAULT 'NULL',
	`relationship` varchar(255) NOT NULL DEFAULT '''primer''',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `profiles_relationship_birthday_name_user_id_unique` UNIQUE(`relationship`,`birthday`,`name`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`type` enum('TEAM','PRIVATE') NOT NULL,
	`number_of_seats` int(11) DEFAULT 'NULL',
	`branch_id` bigint(20) unsigned NOT NULL,
	`sport_id` bigint(20) unsigned NOT NULL,
	`gender` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(255) DEFAULT 'NULL',
	`start_date_of_birth` date NOT NULL,
	`end_date_of_birth` date NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`guard_name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `roles_name_guard_name_unique` UNIQUE(`name`,`guard_name`)
);
--> statement-breakpoint
CREATE TABLE `role_has_permissions` (
	`permission_id` bigint(20) unsigned NOT NULL,
	`role_id` bigint(20) unsigned NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`day` varchar(255) NOT NULL,
	`from` time NOT NULL,
	`to` time NOT NULL,
	`package_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` bigint(20) unsigned DEFAULT 'NULL',
	`ip_address` varchar(45) DEFAULT 'NULL',
	`user_agent` text DEFAULT 'NULL',
	`payload` longtext NOT NULL,
	`last_activity` int(11) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` longtext NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `spoken_languages` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `spoken_language_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`spoken_language_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `spoken_language_translations_spoken_language_id_locale_unique` UNIQUE(`spoken_language_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `sports` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) DEFAULT 'NULL',
	`image` varchar(255) DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `sports_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sport_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`sport_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `sport_translations_sport_id_locale_unique` UNIQUE(`sport_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `states` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`country_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL'
);
--> statement-breakpoint
CREATE TABLE `state_translations` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`state_id` bigint(20) unsigned NOT NULL,
	`locale` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `state_translations_state_id_locale_unique` UNIQUE(`state_id`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint(20) unsigned NOT NULL,
	`type` varchar(255) NOT NULL,
	`stripe_id` varchar(255) NOT NULL,
	`stripe_status` varchar(255) NOT NULL,
	`stripe_price` varchar(255) DEFAULT 'NULL',
	`quantity` int(11) DEFAULT 'NULL',
	`trial_ends_at` timestamp DEFAULT 'NULL',
	`ends_at` timestamp DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `subscriptions_stripe_id_unique` UNIQUE(`stripe_id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_items` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`subscription_id` bigint(20) unsigned NOT NULL,
	`stripe_id` varchar(255) NOT NULL,
	`stripe_product` varchar(255) NOT NULL,
	`stripe_price` varchar(255) NOT NULL,
	`quantity` int(11) DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `subscription_items_stripe_id_unique` UNIQUE(`stripe_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) DEFAULT 'NULL',
	`email` varchar(255) DEFAULT 'NULL',
	`phone_number` varchar(255) DEFAULT 'NULL',
	`google_id` varchar(255) DEFAULT 'NULL',
	`apple_id` varchar(255) DEFAULT 'NULL',
	`is_athletic` tinyint(1) NOT NULL DEFAULT 0,
	`email_verified_at` timestamp DEFAULT 'NULL',
	`password` varchar(255) DEFAULT 'NULL',
	`remember_token` varchar(100) DEFAULT 'NULL',
	`device_token` varchar(400) DEFAULT 'NULL',
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	`stripe_id` varchar(255) DEFAULT 'NULL',
	`pm_type` varchar(255) DEFAULT 'NULL',
	`pm_last_four` varchar(4) DEFAULT 'NULL',
	`trial_ends_at` timestamp DEFAULT 'NULL',
	`deleted_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_number_unique` UNIQUE(`phone_number`)
);
--> statement-breakpoint
CREATE TABLE `wishlist` (
	`id` bigint(20) unsigned AUTO_INCREMENT NOT NULL,
	`academic_id` bigint(20) unsigned NOT NULL,
	`user_id` bigint(20) unsigned NOT NULL,
	`created_at` timestamp DEFAULT 'NULL',
	`updated_at` timestamp DEFAULT 'NULL',
	CONSTRAINT `wishlist_user_id_academic_id_unique` UNIQUE(`user_id`,`academic_id`)
);
--> statement-breakpoint
ALTER TABLE `academics` ADD CONSTRAINT `academics_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `academic_athletic` ADD CONSTRAINT `academic_athletic_academic_id_foreign` FOREIGN KEY (`academic_id`) REFERENCES `academics`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `academic_athletic` ADD CONSTRAINT `academic_athletic_profile_id_foreign` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `academic_athletic` ADD CONSTRAINT `academic_athletic_sport_id_foreign` FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `academic_athletic` ADD CONSTRAINT `academic_athletic_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `academic_sport` ADD CONSTRAINT `academic_sport_academic_id_foreign` FOREIGN KEY (`academic_id`) REFERENCES `academics`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `academic_sport` ADD CONSTRAINT `academic_sport_sport_id_foreign` FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `academic_translations` ADD CONSTRAINT `academic_translations_academic_id_foreign` FOREIGN KEY (`academic_id`) REFERENCES `academics`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_city_id_foreign` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_coach_id_foreign` FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_profile_id_foreign` FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `booking_sessions` ADD CONSTRAINT `booking_sessions_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branches` ADD CONSTRAINT `branches_academic_id_foreign` FOREIGN KEY (`academic_id`) REFERENCES `academics`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branch_facility` ADD CONSTRAINT `branch_facility_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branch_facility` ADD CONSTRAINT `branch_facility_facility_id_foreign` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branch_sport` ADD CONSTRAINT `branch_sport_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branch_sport` ADD CONSTRAINT `branch_sport_sport_id_foreign` FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `branch_translations` ADD CONSTRAINT `branch_translations_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `cities` ADD CONSTRAINT `cities_state_id_foreign` FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `city_translations` ADD CONSTRAINT `city_translations_city_id_foreign` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coaches` ADD CONSTRAINT `coaches_academic_id_foreign` FOREIGN KEY (`academic_id`) REFERENCES `academics`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_package` ADD CONSTRAINT `coach_package_coach_id_foreign` FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_package` ADD CONSTRAINT `coach_package_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_program` ADD CONSTRAINT `coach_program_coach_id_foreign` FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_program` ADD CONSTRAINT `coach_program_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_spoken_language` ADD CONSTRAINT `coach_spoken_language_coach_id_foreign` FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_spoken_language` ADD CONSTRAINT `coach_spoken_language_spoken_language_id_foreign` FOREIGN KEY (`spoken_language_id`) REFERENCES `spoken_languages`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_sport` ADD CONSTRAINT `coach_sport_coach_id_foreign` FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `coach_sport` ADD CONSTRAINT `coach_sport_sport_id_foreign` FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `country_translations` ADD CONSTRAINT `country_translations_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `facility_translations` ADD CONSTRAINT `facility_translations_facility_id_foreign` FOREIGN KEY (`facility_id`) REFERENCES `facilities`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `otp_verifications` ADD CONSTRAINT `otp_verifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `packages` ADD CONSTRAINT `packages_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `page_translations` ADD CONSTRAINT `page_translations_page_id_foreign` FOREIGN KEY (`page_id`) REFERENCES `pages`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `programs` ADD CONSTRAINT `programs_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `programs` ADD CONSTRAINT `programs_sport_id_foreign` FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `schedules` ADD CONSTRAINT `schedules_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `spoken_language_translations` ADD CONSTRAINT `spoken_language_translations_spoken_language_id_foreign` FOREIGN KEY (`spoken_language_id`) REFERENCES `spoken_languages`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `sport_translations` ADD CONSTRAINT `sport_translations_sport_id_foreign` FOREIGN KEY (`sport_id`) REFERENCES `sports`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `states` ADD CONSTRAINT `states_country_id_foreign` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `state_translations` ADD CONSTRAINT `state_translations_state_id_foreign` FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `wishlist` ADD CONSTRAINT `wishlist_academic_id_foreign` FOREIGN KEY (`academic_id`) REFERENCES `academics`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE `wishlist` ADD CONSTRAINT `wishlist_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX `jobs_queue_index` ON `jobs` (`queue`);--> statement-breakpoint
CREATE INDEX `media_referable_type_referable_id_index` ON `media` (`referable_type`,`referable_id`);--> statement-breakpoint
CREATE INDEX `model_has_permissions_model_id_model_type_index` ON `model_has_permissions` (`model_id`,`model_type`);--> statement-breakpoint
CREATE INDEX `model_has_roles_model_id_model_type_index` ON `model_has_roles` (`model_id`,`model_type`);--> statement-breakpoint
CREATE INDEX `notifications_notifiable_type_notifiable_id_index` ON `notifications` (`notifiable_type`,`notifiable_id`);--> statement-breakpoint
CREATE INDEX `payments_resourceable_type_resourceable_id_index` ON `payments` (`resourceable_type`,`resourceable_id`);--> statement-breakpoint
CREATE INDEX `payments_referable_type_referable_id_index` ON `payments` (`referable_type`,`referable_id`);--> statement-breakpoint
CREATE INDEX `personal_access_tokens_tokenable_type_tokenable_id_index` ON `personal_access_tokens` (`tokenable_type`,`tokenable_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_last_activity_index` ON `sessions` (`last_activity`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_id_stripe_status_index` ON `subscriptions` (`user_id`,`stripe_status`);--> statement-breakpoint
CREATE INDEX `subscription_items_subscription_id_stripe_price_index` ON `subscription_items` (`subscription_id`,`stripe_price`);--> statement-breakpoint
CREATE INDEX `users_stripe_id_index` ON `users` (`stripe_id`);
*/