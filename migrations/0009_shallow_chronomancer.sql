ALTER TABLE "programs" ADD COLUMN "color" varchar(255) DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN IF EXISTS "color";