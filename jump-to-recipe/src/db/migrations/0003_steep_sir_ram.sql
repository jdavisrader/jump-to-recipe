CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "difficulty" SET DATA TYPE "public"."difficulty" USING "difficulty"::"public"."difficulty";--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "visibility" SET DEFAULT 'private'::"public"."visibility";--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "visibility" SET DATA TYPE "public"."visibility" USING "visibility"::"public"."visibility";