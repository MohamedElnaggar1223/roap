ALTER TABLE "block_branches" DROP CONSTRAINT "block_branches_unique";--> statement-breakpoint
ALTER TABLE "block_coaches" DROP CONSTRAINT "block_coaches_unique";--> statement-breakpoint
ALTER TABLE "block_packages" DROP CONSTRAINT "block_packages_unique";--> statement-breakpoint
ALTER TABLE "block_sports" DROP CONSTRAINT "block_sports_unique";--> statement-breakpoint
ALTER TABLE "block_branches" ADD CONSTRAINT "block_branches_block_id_branch_id_unique" UNIQUE("block_id","branch_id");--> statement-breakpoint
ALTER TABLE "block_coaches" ADD CONSTRAINT "block_coaches_block_id_coach_id_unique" UNIQUE("block_id","coach_id");--> statement-breakpoint
ALTER TABLE "block_packages" ADD CONSTRAINT "block_packages_block_id_package_id_unique" UNIQUE("block_id","package_id");--> statement-breakpoint
ALTER TABLE "block_sports" ADD CONSTRAINT "block_sports_block_id_sport_id_unique" UNIQUE("block_id","sport_id");