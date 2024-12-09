CREATE TABLE IF NOT EXISTS "media" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "media_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1000 CACHE 1),
	"referable_type" varchar(255) NOT NULL,
	"referable_id" bigint NOT NULL,
	"url" varchar(255) NOT NULL,
	"type" varchar(255) DEFAULT '0' NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_referable_type_referable_id_index" ON "media" USING btree ("referable_type","referable_id");