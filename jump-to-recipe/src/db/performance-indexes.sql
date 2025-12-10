-- Performance Optimization Indexes for Admin Recipe Management
-- These indexes should be added to improve query performance for admin operations

-- Index for recipes.author_id (already exists via foreign key, but explicit index for performance)
CREATE INDEX IF NOT EXISTS "idx_recipes_author_id" ON "recipes" USING btree ("author_id");

-- Index for recipes.created_at (for sorting by creation date)
CREATE INDEX IF NOT EXISTS "idx_recipes_created_at" ON "recipes" USING btree ("created_at");

-- Index for recipes.updated_at (for sorting by update date)
CREATE INDEX IF NOT EXISTS "idx_recipes_updated_at" ON "recipes" USING btree ("updated_at");

-- Index for recipes.visibility (for filtering by visibility)
CREATE INDEX IF NOT EXISTS "idx_recipes_visibility" ON "recipes" USING btree ("visibility");

-- Composite index for recipes.visibility + created_at (common filter + sort combination)
CREATE INDEX IF NOT EXISTS "idx_recipes_visibility_created_at" ON "recipes" USING btree ("visibility", "created_at");

-- Index for recipes.title (for search functionality)
CREATE INDEX IF NOT EXISTS "idx_recipes_title" ON "recipes" USING btree ("title");

-- GIN index for recipes.tags (for tag search functionality)
CREATE INDEX IF NOT EXISTS "idx_recipes_tags" ON "recipes" USING gin ("tags");

-- Index for users.name (for owner search in admin interface)
CREATE INDEX IF NOT EXISTS "idx_users_name" ON "users" USING btree ("name");

-- Index for users.email (for owner search in admin interface)
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");

-- Index for users.role (for admin role checks)
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");

-- Composite index for the admin recipes query (recipes with author info)
-- This supports the LEFT JOIN query used in admin recipe list
CREATE INDEX IF NOT EXISTS "idx_recipes_admin_list" ON "recipes" USING btree ("created_at", "author_id", "visibility");

-- Text search index for recipe titles (for better search performance)
-- This creates a full-text search index on recipe titles
CREATE INDEX IF NOT EXISTS "idx_recipes_title_fulltext" ON "recipes" USING gin (to_tsvector('english', "title"));

-- Performance notes:
-- 1. The idx_recipes_author_id index improves JOIN performance with users table
-- 2. The idx_recipes_created_at and idx_recipes_updated_at indexes improve sorting performance
-- 3. The idx_recipes_visibility index improves filtering performance
-- 4. The composite indexes reduce the need for multiple index lookups
-- 5. The GIN indexes on tags and title support efficient text search
-- 6. The idx_recipes_admin_list composite index is specifically optimized for the admin query pattern