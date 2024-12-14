ALTER TABLE "block_branches" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_branches" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_coaches" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_coaches" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_packages" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_packages" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_sports" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_sports" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "block_branches" ADD CONSTRAINT "block_branches_unique" UNIQUE("block_id","branch_id");--> statement-breakpoint
ALTER TABLE "block_coaches" ADD CONSTRAINT "block_coaches_unique" UNIQUE("block_id","coach_id");--> statement-breakpoint
ALTER TABLE "block_packages" ADD CONSTRAINT "block_packages_unique" UNIQUE("block_id","package_id");--> statement-breakpoint
ALTER TABLE "block_sports" ADD CONSTRAINT "block_sports_unique" UNIQUE("block_id","sport_id");