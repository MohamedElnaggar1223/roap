-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('admin', 'user', 'academic');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(255) DEFAULT NULL,
	"email" varchar(255) DEFAULT NULL,
	"phone_number" varchar(255) DEFAULT NULL,
	"google_id" varchar(255) DEFAULT NULL,
	"apple_id" varchar(255) DEFAULT NULL,
	"is_athletic" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"password" varchar(255) DEFAULT NULL,
	"remember_token" varchar(100) DEFAULT NULL,
	"device_token" varchar(400) DEFAULT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"stripe_id" varchar(255) DEFAULT NULL,
	"pm_type" varchar(255) DEFAULT NULL,
	"pm_last_four" varchar(4) DEFAULT NULL,
	"trial_ends_at" timestamp,
	"deleted_at" timestamp,
	"role" "user_roles" DEFAULT 'user'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "join_us" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "join_us_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "join_us_phone_email_unique" UNIQUE("email","phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"gender" varchar(255) DEFAULT NULL,
	"birthday" date,
	"user_id" bigint NOT NULL,
	"image" varchar(255) DEFAULT NULL,
	"relationship" varchar(255) DEFAULT 'self' NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spoken_languages" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "spoken_languages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "spoken_language_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "spoken_language_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"spoken_language_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "countries" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "countries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "country_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "country_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"country_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "states" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "states_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"country_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "state_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "state_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"state_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cities" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "cities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"state_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "city_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "city_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"city_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addresses" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "addresses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"street_address" varchar(255) NOT NULL,
	"postal_code" varchar(255) DEFAULT NULL,
	"city_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "facilities" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "facilities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "facility_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "facility_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"facility_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sports" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "sports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(255) DEFAULT NULL,
	"image" varchar(255) DEFAULT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sport_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "sport_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"sport_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academics" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "academics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(255) NOT NULL,
	"entry_fees" double precision DEFAULT 0 NOT NULL,
	"user_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	"image" varchar(255) DEFAULT NULL,
	"policy" text,
	"extra" varchar(255) DEFAULT NULL,
	"status" "status" DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academic_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "academic_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"academic_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) DEFAULT NULL,
	"description" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branches" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "branches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" varchar(255) NOT NULL,
	"latitude" varchar(255) DEFAULT NULL,
	"longitude" varchar(255) DEFAULT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"rate" double precision,
	"reviews" integer,
	"academic_id" bigint,
	"created_at" timestamp,
	"updated_at" timestamp,
	"url" varchar(255) DEFAULT NULL,
	"place_id" varchar(255) DEFAULT NULL,
	"name_in_google_map" varchar(255) DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branch_translations" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "branch_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"branch_id" bigint NOT NULL,
	"locale" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branch_facility" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "branch_facility_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"branch_id" bigint NOT NULL,
	"facility_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branch_sport" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "branch_sport_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"branch_id" bigint NOT NULL,
	"sport_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programs" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "programs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"academic_id" bigint,
	"type" varchar(255),
	"number_of_seats" integer,
	"branch_id" bigint,
	"sport_id" bigint,
	"gender" varchar(255) DEFAULT NULL,
	"name" varchar(255) DEFAULT NULL,
	"description" varchar(255) DEFAULT NULL,
	"start_date_of_birth" date,
	"end_date_of_birth" date,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "programs_type_check" CHECK ((type)::text = ANY ((ARRAY['TEAM'::character varying, 'PRIVATE'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academic_sport" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "academic_sport_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"academic_id" bigint NOT NULL,
	"sport_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "academic_athletic" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "academic_athletic_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"academic_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"profile_id" bigint,
	"certificate" varchar(255) DEFAULT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coaches" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "coaches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"title" varchar(255) DEFAULT NULL,
	"image" varchar(255) DEFAULT NULL,
	"bio" text,
	"gender" varchar(255) DEFAULT NULL,
	"private_session_percentage" varchar(255) DEFAULT NULL,
	"academic_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"date_of_birth" date
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "packages" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "packages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(255) DEFAULT 'Assessment Package' NOT NULL,
	"price" double precision NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"session_per_week" integer DEFAULT 0 NOT NULL,
	"session_duration" integer,
	"program_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"memo" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "schedules_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"day" varchar(255) NOT NULL,
	"from" time NOT NULL,
	"to" time NOT NULL,
	"package_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"memo" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "bookings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"status" varchar(255) DEFAULT 'pending' NOT NULL,
	"coach_id" bigint,
	"profile_id" bigint,
	"package_id" bigint NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"academy_policy" boolean DEFAULT false NOT NULL,
	"roap_policy" boolean DEFAULT false NOT NULL,
	"package_price" double precision DEFAULT 0 NOT NULL,
	CONSTRAINT "bookings_status_check" CHECK ((status)::text = ANY ((ARRAY['success'::character varying, 'rejected'::character varying, 'pending'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "booking_sessions" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "booking_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"from" varchar(255) NOT NULL,
	"to" varchar(255) NOT NULL,
	"status" varchar(255) DEFAULT 'pending' NOT NULL,
	"booking_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "booking_sessions_status_check" CHECK ((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'upcoming'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[]))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coach_package" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "coach_package_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"coach_id" bigint NOT NULL,
	"package_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coach_program" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "coach_program_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"coach_id" bigint NOT NULL,
	"program_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coach_spoken_language" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "coach_spoken_language_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"spoken_language_id" bigint NOT NULL,
	"coach_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "coach_sport" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "coach_sport_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"coach_id" bigint NOT NULL,
	"sport_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"type" varchar(255) NOT NULL,
	"stripe_id" varchar(255) NOT NULL,
	"stripe_status" varchar(255) NOT NULL,
	"stripe_price" varchar(255) DEFAULT NULL,
	"quantity" integer,
	"trial_ends_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_items" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "subscription_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"subscription_id" bigint NOT NULL,
	"stripe_id" varchar(255) NOT NULL,
	"stripe_product" varchar(255) NOT NULL,
	"stripe_price" varchar(255) NOT NULL,
	"quantity" integer,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlist" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "wishlist_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"academic_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" bigint PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"resourceable_type" varchar(255) NOT NULL,
	"resourceable_id" bigint NOT NULL,
	"price" double precision NOT NULL,
	"payment_method" varchar(255) DEFAULT NULL,
	"merchant_reference_number" varchar(255) DEFAULT NULL,
	"status" varchar(255) DEFAULT 'pending' NOT NULL,
	"referable_type" varchar(255) NOT NULL,
	"referable_id" bigint NOT NULL,
	"reference_number" uuid NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "spoken_language_translations" ADD CONSTRAINT "spoken_language_translations_spoken_language_id_foreign" FOREIGN KEY ("spoken_language_id") REFERENCES "public"."spoken_languages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "country_translations" ADD CONSTRAINT "country_translations_country_id_foreign" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "states" ADD CONSTRAINT "states_country_id_foreign" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "state_translations" ADD CONSTRAINT "state_translations_state_id_foreign" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_foreign" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "city_translations" ADD CONSTRAINT "city_translations_city_id_foreign" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_foreign" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "facility_translations" ADD CONSTRAINT "facility_translations_facility_id_foreign" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sport_translations" ADD CONSTRAINT "sport_translations_sport_id_foreign" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academics" ADD CONSTRAINT "academics_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academic_translations" ADD CONSTRAINT "academic_translations_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branches" ADD CONSTRAINT "branches_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_translations" ADD CONSTRAINT "branch_translations_branch_id_foreign" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_facility" ADD CONSTRAINT "branch_facility_branch_id_foreign" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_facility" ADD CONSTRAINT "branch_facility_facility_id_foreign" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_sport" ADD CONSTRAINT "branch_sport_branch_id_foreign" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_sport" ADD CONSTRAINT "branch_sport_sport_id_foreign" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_branch_id_foreign" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_sport_id_foreign" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academic_sport" ADD CONSTRAINT "academic_sport_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academic_sport" ADD CONSTRAINT "academic_sport_sport_id_foreign" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academic_athletic" ADD CONSTRAINT "academic_athletic_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "academic_athletic" ADD CONSTRAINT "academic_athletic_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coaches" ADD CONSTRAINT "coaches_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "packages" ADD CONSTRAINT "packages_program_id_foreign" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_package_id_foreign" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_coach_id_foreign" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_foreign" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_profile_id_foreign" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booking_sessions" ADD CONSTRAINT "booking_sessions_booking_id_foreign" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_package" ADD CONSTRAINT "coach_package_coach_id_foreign" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_package" ADD CONSTRAINT "coach_package_package_id_foreign" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_program" ADD CONSTRAINT "coach_program_coach_id_foreign" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_program" ADD CONSTRAINT "coach_program_program_id_foreign" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_spoken_language" ADD CONSTRAINT "coach_spoken_language_coach_id_foreign" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_spoken_language" ADD CONSTRAINT "coach_spoken_language_spoken_language_id_foreign" FOREIGN KEY ("spoken_language_id") REFERENCES "public"."spoken_languages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_sport" ADD CONSTRAINT "coach_sport_coach_id_foreign" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coach_sport" ADD CONSTRAINT "coach_sport_sport_id_foreign" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_items" ADD CONSTRAINT "subscription_items_subscription_id_foreign" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_foreign" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email" text_ops) WHERE (email IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_number_unique" ON "users" USING btree ("phone_number" text_ops) WHERE (phone_number IS NOT NULL);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_stripe_id_index" ON "users" USING btree ("stripe_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profiles_user_id_name_unique" ON "profiles" USING btree ("user_id" int8_ops,"name" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "spoken_language_translations_spoken_language_id_locale_unique" ON "spoken_language_translations" USING btree ("spoken_language_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "country_translations_country_id_locale_unique" ON "country_translations" USING btree ("country_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "state_translations_state_id_locale_unique" ON "state_translations" USING btree ("state_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "city_translations_city_id_locale_unique" ON "city_translations" USING btree ("city_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "addresses_user_id_unique" ON "addresses" USING btree ("user_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "facility_translations_facility_id_locale_unique" ON "facility_translations" USING btree ("facility_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sports_slug_unique" ON "sports" USING btree ("slug" text_ops) WHERE (slug IS NOT NULL);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sport_translations_sport_id_locale_unique" ON "sport_translations" USING btree ("sport_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "academics_slug_unique" ON "academics" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "academic_translations_academic_id_locale_unique" ON "academic_translations" USING btree ("academic_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "branches_slug_unique" ON "branches" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "branch_translations_branch_id_locale_unique" ON "branch_translations" USING btree ("branch_id" int8_ops,"locale" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripe_id_unique" ON "subscriptions" USING btree ("stripe_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_stripe_status_index" ON "subscriptions" USING btree ("user_id" int8_ops,"stripe_status" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_items_stripe_id_unique" ON "subscription_items" USING btree ("stripe_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_items_subscription_id_stripe_price_index" ON "subscription_items" USING btree ("subscription_id" int8_ops,"stripe_price" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_user_id_academic_id_unique" ON "wishlist" USING btree ("user_id" int8_ops,"academic_id" int8_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_referable_type_referable_id_index" ON "payments" USING btree ("referable_type" int8_ops,"referable_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_resourceable_type_resourceable_id_index" ON "payments" USING btree ("resourceable_type" text_ops,"resourceable_id" int8_ops);
*/