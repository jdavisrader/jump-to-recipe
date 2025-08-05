ALTER TABLE "comments" ADD COLUMN "is_private_note" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "comments_enabled" boolean DEFAULT true NOT NULL;