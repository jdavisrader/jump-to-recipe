# Database Setup Flow - Visual Guide

## 🔄 Complete Database Setup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE SETUP FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1️⃣  CONFIGURATION FILES
    ┌──────────────────────────────────────────────────────┐
    │  .env                                                │
    │  ├─ DATABASE_URL=postgresql://user:pass@host/db     │
    │  ├─ NEXTAUTH_SECRET=your-secret                     │
    │  └─ GOOGLE_ID=your-google-id                        │
    └──────────────────────────────────────────────────────┘
                            ↓
    ┌──────────────────────────────────────────────────────┐
    │  drizzle.config.ts                                   │
    │  ├─ schema: './src/db/schema/*'                     │
    │  ├─ out: './src/db/migrations'                      │
    │  └─ dialect: 'postgresql'                           │
    └──────────────────────────────────────────────────────┘

2️⃣  SCHEMA DEFINITION
    ┌──────────────────────────────────────────────────────┐
    │  src/db/schema/                                      │
    │  ├─ users.ts          → Users table                 │
    │  ├─ recipes.ts        → Recipes table               │
    │  ├─ cookbooks.ts      → Cookbooks table             │
    │  ├─ cookbook-recipes.ts → Join table                │
    │  └─ recipe-photos.ts  → Photos table                │
    └──────────────────────────────────────────────────────┘
                            ↓
                   npm run db:generate
                            ↓
    ┌──────────────────────────────────────────────────────┐
    │  src/db/migrations/                                  │
    │  └─ 0000_initial.sql  (Generated SQL)               │
    └──────────────────────────────────────────────────────┘

3️⃣  DATABASE CREATION
    
    Option A: Docker                Option B: Local
    ┌─────────────────┐            ┌──────────────────┐
    │ docker-compose  │            │ createdb         │
    │ up -d db        │            │ jump_to_recipe   │
    └─────────────────┘            └──────────────────┘
            ↓                               ↓
    ┌─────────────────────────────────────────────────┐
    │         PostgreSQL Database Running             │
    │         Port: 5432                              │
    └─────────────────────────────────────────────────┘

4️⃣  MIGRATION APPLICATION
    ┌──────────────────────────────────────────────────────┐
    │  npm run db:push                                     │
    │  ├─ Reads: src/db/schema/*                          │
    │  ├─ Generates: SQL statements                       │
    │  └─ Applies: To PostgreSQL                          │
    └──────────────────────────────────────────────────────┘
                            ↓
    ┌──────────────────────────────────────────────────────┐
    │  Database Tables Created:                            │
    │  ✅ users                                            │
    │  ✅ recipes                                          │
    │  ✅ cookbooks                                        │
    │  ✅ cookbook_recipes                                 │
    │  ✅ cookbook_collaborators                           │
    │  ✅ recipe_photos                                    │
    └──────────────────────────────────────────────────────┘

5️⃣  DATA SEEDING (Optional)
    ┌──────────────────────────────────────────────────────┐
    │  npm run db:seed                                     │
    │  ├─ Runs: src/db/seed.ts                            │
    │  ├─ Creates: Demo users                             │
    │  └─ Inserts: Sample recipes                         │
    └──────────────────────────────────────────────────────┘
                            ↓
    ┌──────────────────────────────────────────────────────┐
    │  Database Populated:                                 │
    │  👤 6 demo users                                     │
    │  📖 30+ sample recipes                               │
    │  📚 Various cuisines                                 │
    └──────────────────────────────────────────────────────┘

6️⃣  APPLICATION CONNECTION
    ┌──────────────────────────────────────────────────────┐
    │  src/db/index.ts                                     │
    │  ├─ Reads: DATABASE_URL from env                    │
    │  ├─ Creates: postgres() connection                  │
    │  └─ Exports: db (Drizzle instance)                  │
    └──────────────────────────────────────────────────────┘
                            ↓
    ┌──────────────────────────────────────────────────────┐
    │  Application Code                                    │
    │  import { db } from '@/db'                           │
    │  await db.select().from(recipes)                     │
    └──────────────────────────────────────────────────────┘
```

---

## 🎯 Key Files and Their Roles

### Configuration Layer
```
.env                    → Connection credentials
drizzle.config.ts       → Migration settings
src/lib/env.ts          → Environment validation
```

### Schema Layer
```
src/db/schema/          → Table definitions (TypeScript)
src/db/migrations/      → Generated SQL migrations
```

### Connection Layer
```
src/db/index.ts         → Database connection
src/db/seed.ts          → Demo data
```

### Application Layer
```
src/app/api/*/route.ts  → API routes using db
src/components/*        → UI components
```

---

## 🔍 Data Flow in Application

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────┘

User Action (Browser)
        ↓
Next.js API Route
  (src/app/api/recipes/route.ts)
        ↓
Import Database Connection
  import { db } from '@/db'
        ↓
Drizzle ORM Query
  await db.select().from(recipes)
        ↓
PostgreSQL Database
  SELECT * FROM recipes
        ↓
Return Data
  { recipes: [...] }
        ↓
JSON Response
        ↓
User sees data
```

---

## 🛠️ Common Database Operations

### 1. Create a New Table

```typescript
// 1. Define schema (src/db/schema/my-table.ts)
export const myTable = pgTable('my_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

// 2. Generate migration
npm run db:generate

// 3. Apply to database
npm run db:push
```

### 2. Query Data

```typescript
// In any API route or server component
import { db } from '@/db';
import { recipes } from '@/db/schema';

// Select all
const allRecipes = await db.select().from(recipes);

// Select with filter
const userRecipes = await db
  .select()
  .from(recipes)
  .where(eq(recipes.authorId, userId));
```

### 3. Insert Data

```typescript
import { db } from '@/db';
import { recipes } from '@/db/schema';

const newRecipe = await db.insert(recipes).values({
  id: uuidv4(),
  title: 'My Recipe',
  authorId: userId,
  // ... other fields
}).returning();
```

### 4. Update Data

```typescript
import { db } from '@/db';
import { recipes } from '@/db/schema';
import { eq } from 'drizzle-orm';

await db
  .update(recipes)
  .set({ title: 'Updated Title' })
  .where(eq(recipes.id, recipeId));
```

### 5. Delete Data

```typescript
import { db } from '@/db';
import { recipes } from '@/db/schema';
import { eq } from 'drizzle-orm';

await db
  .delete(recipes)
  .where(eq(recipes.id, recipeId));
```

---

## 🐳 Docker Database Setup

```
┌─────────────────────────────────────────────────────────────┐
│              DOCKER DATABASE ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────┘

Host Machine
    ↓
docker-compose.yml
    ├─ db service (PostgreSQL)
    │  ├─ Image: postgres:16-alpine
    │  ├─ Port: 5432:5432
    │  ├─ Volume: postgres_data
    │  └─ Environment:
    │     ├─ POSTGRES_USER=jumptorecipe
    │     ├─ POSTGRES_PASSWORD=changeme
    │     └─ POSTGRES_DB=jump_to_recipe
    │
    └─ app service (Next.js)
       ├─ Depends on: db
       ├─ Port: 3000:3000
       └─ Environment:
          └─ DATABASE_URL=postgresql://jumptorecipe:changeme@db:5432/jump_to_recipe

Network: jump-to-recipe_default
    ├─ db container (hostname: db)
    └─ app container (connects to: db:5432)
```

---

## 📊 Database Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TABLE RELATIONSHIPS                      │
└─────────────────────────────────────────────────────────────┘

users
  ├─ id (PK)
  ├─ email
  ├─ name
  └─ role
      ↓ (authorId)
recipes
  ├─ id (PK)
  ├─ title
  ├─ authorId (FK → users.id)
  ├─ ingredients (JSONB)
  └─ instructions (JSONB)
      ↓ (recipeId)
recipe_photos
  ├─ id (PK)
  ├─ recipeId (FK → recipes.id)
  └─ filePath

cookbooks
  ├─ id (PK)
  ├─ title
  └─ ownerId (FK → users.id)
      ↓ (cookbookId)
cookbook_recipes
  ├─ id (PK)
  ├─ cookbookId (FK → cookbooks.id)
  ├─ recipeId (FK → recipes.id)
  └─ position

cookbook_collaborators
  ├─ id (PK)
  ├─ cookbookId (FK → cookbooks.id)
  ├─ userId (FK → users.id)
  └─ permission
```

---

## 🚀 Quick Commands Reference

```bash
# Setup
npm run db:generate    # Generate migration files
npm run db:push        # Apply schema to database
npm run db:seed        # Add demo data
npm run db:studio      # Open visual browser

# Docker
docker-compose up -d db              # Start database only
docker-compose exec db psql -U ...   # Connect to database
docker-compose logs db               # View database logs

# Verification
psql -d jump_to_recipe -c "\dt"      # List tables
psql -d jump_to_recipe -c "\d users" # Describe table
```

---

## 💡 Pro Tips

1. **Always backup before migrations**
   ```bash
   pg_dump jump_to_recipe > backup.sql
   ```

2. **Use Drizzle Studio for debugging**
   ```bash
   npm run db:studio
   ```

3. **Check connection before starting app**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

4. **Monitor database logs**
   ```bash
   docker-compose logs -f db
   ```

5. **Reset database if needed**
   ```bash
   docker-compose down -v  # Removes volumes
   docker-compose up -d
   npm run db:push
   npm run db:seed
   ```
