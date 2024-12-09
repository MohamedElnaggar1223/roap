ALTER TABLE "packages" ADD COLUMN "entry_fees" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "entry_fees_explanation" text;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "entry_fees_applied_until" date;