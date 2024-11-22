CREATE TYPE "public"."discount_type" AS ENUM('fixed', 'percentage');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promo_codes" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "promo_codes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"code" varchar(50) NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discountValue" double precision NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"academic_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "promo_codes_code_academic_unique" UNIQUE("code","academic_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "join_us" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "join_us" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "spoken_languages" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "spoken_languages" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "spoken_language_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "spoken_language_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "countries" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "countries" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "country_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "country_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "states" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "states" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "state_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "state_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "cities" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "city_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "city_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "facilities" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "facility_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "facility_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "sports" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "sports" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "sport_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "sport_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "academics" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "academics" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "academic_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "academic_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "branch_translations" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "branch_translations" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "branch_facility" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "branch_facility" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "branch_sport" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "branch_sport" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "academic_sport" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "academic_sport" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "academic_athletic" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "academic_athletic" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "coaches" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "coaches" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "booking_sessions" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "booking_sessions" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "coach_package" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "coach_package" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "coach_program" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "coach_program" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "coach_spoken_language" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "coach_spoken_language" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "coach_sport" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "coach_sport" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "subscription_items" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "subscription_items" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "wishlist" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "wishlist" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET GENERATED ALWAYS;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET START WITH 1000;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
