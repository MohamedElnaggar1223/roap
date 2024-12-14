ALTER TABLE "block_branches" DROP CONSTRAINT "block_branches_block_id_branch_id_unique";--> statement-breakpoint
ALTER TABLE "block_coaches" DROP CONSTRAINT "block_coaches_block_id_coach_id_unique";--> statement-breakpoint
ALTER TABLE "block_packages" DROP CONSTRAINT "block_packages_block_id_package_id_unique";--> statement-breakpoint
ALTER TABLE "block_sports" DROP CONSTRAINT "block_sports_block_id_sport_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_branches_block_branch_unique" ON "block_branches" USING btree ("block_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_coaches_block_coach_unique" ON "block_coaches" USING btree ("block_id","coach_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_packages_block_package_unique" ON "block_packages" USING btree ("block_id","package_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "block_sports_block_sport_unique" ON "block_sports" USING btree ("block_id","sport_id");