ALTER TABLE "recipes" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;