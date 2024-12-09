CREATE TYPE "public"."athletic_type" AS ENUM('primary', 'fellow');--> statement-breakpoint
ALTER TABLE "academic_athletic" ADD COLUMN "type" "athletic_type" DEFAULT 'primary';--> statement-breakpoint
ALTER TABLE "academic_athletic" ADD COLUMN "firstGuardianName" varchar(255) DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "academic_athletic" ADD COLUMN "firstGuardianRelationship" varchar(255) DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "academic_athletic" ADD COLUMN "secondGuardianName" varchar(255) DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "academic_athletic" ADD COLUMN "secondGuardianRelationship" varchar(255) DEFAULT NULL;