CREATE TABLE IF NOT EXISTS "block_branches" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "block_branches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"block_id" bigint NOT NULL,
	"branch_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "block_coaches" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "block_coaches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"block_id" bigint NOT NULL,
	"coach_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "block_packages" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "block_packages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"block_id" bigint NOT NULL,
	"package_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "block_sports" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "block_sports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"block_id" bigint NOT NULL,
	"sport_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "blocks" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blocks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"academic_id" bigint NOT NULL,
	"date" date NOT NULL,
	"startTime" time NOT NULL,
	"endTime" time NOT NULL,
	"branchScope" "block_scope" DEFAULT 'all',
	"sportScope" "block_scope" DEFAULT 'all',
	"packageScope" "block_scope" DEFAULT 'all',
	"coachScope" "block_scope" DEFAULT 'all',
	"note" varchar(255) DEFAULT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_notifiable_type_notifiable_id_index";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_branches" ADD CONSTRAINT "block_branches_block_id_foreign" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_branches" ADD CONSTRAINT "block_branches_branch_id_foreign" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_coaches" ADD CONSTRAINT "block_coaches_block_id_foreign" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_coaches" ADD CONSTRAINT "block_coaches_coach_id_foreign" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_packages" ADD CONSTRAINT "block_packages_block_id_foreign" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_packages" ADD CONSTRAINT "block_packages_package_id_foreign" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_sports" ADD CONSTRAINT "block_sports_block_id_foreign" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "block_sports" ADD CONSTRAINT "block_sports_sport_id_foreign" FOREIGN KEY ("sport_id") REFERENCES "public"."sports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "blocks" ADD CONSTRAINT "blocks_academic_id_foreign" FOREIGN KEY ("academic_id") REFERENCES "public"."academics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_branches_block_branch_unique" ON "block_branches" USING btree ("block_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_coaches_block_coach_unique" ON "block_coaches" USING btree ("block_id","coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_packages_block_package_unique" ON "block_packages" USING btree ("block_id","package_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_sports_block_sport_unique" ON "block_sports" USING btree ("block_id","sport_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_notifiable_type_notifiable_id_index" ON "notifications" USING btree ("notifiable_type" text_ops,"notifiable_id" int8_ops);