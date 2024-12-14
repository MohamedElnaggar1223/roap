ALTER TABLE "block_branches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "block_coaches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "block_packages" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "block_sports" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blocks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "block_branches" CASCADE;--> statement-breakpoint
DROP TABLE "block_coaches" CASCADE;--> statement-breakpoint
DROP TABLE "block_packages" CASCADE;--> statement-breakpoint
DROP TABLE "block_sports" CASCADE;--> statement-breakpoint
DROP TABLE "blocks" CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS "media_referable_type_referable_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_notifiable_type_notifiable_id_index";--> statement-breakpoint
ALTER TABLE "academic_athletic" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "academic_sport" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "academic_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "academics" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "booking_sessions" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "branch_facility" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "branch_sport" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "branch_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "city_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "coach_package" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "coach_program" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "coach_spoken_language" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "coach_sport" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "coaches" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "countries" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "country_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "facility_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "join_us" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "promo_codes" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "spoken_language_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "spoken_languages" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "sport_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "sports" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "state_translations" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "states" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "subscription_items" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
ALTER TABLE "wishlist" ALTER COLUMN "id" SET MAXVALUE 9223372036854776000;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_referable_type_referable_id_index" ON "media" USING btree ("referable_type" int8_ops,"referable_id" int8_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_notifiable_type_notifiable_id_index" ON "notifications" USING btree ("notifiable_type" int8_ops,"notifiable_id" int8_ops);--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "nationality";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "country";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "city";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "streetAddress";--> statement-breakpoint
DROP TYPE "public"."block_scope";