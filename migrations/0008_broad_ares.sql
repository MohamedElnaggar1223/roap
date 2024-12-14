ALTER TABLE "packages" ALTER COLUMN "entry_fees_applied_until" SET DATA TYPE text[];--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "entry_fees_start_date" date;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "entry_fees_end_date" date;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "color" text;