# Database Setup Guide

This guide shows you exactly where and how to set up the PostgreSQL database for Jump to Recipe.

## 📍 Where Database Setup Happens

### 1. **Environment Variables** (`.env` file)

**Location**: `jump-to-recipe/.env`

```bash
# Database Configuration
DATABASE_URL=postgresql://jumptorecipe:yourpassword@localhost:5432/jump_to_recipe

# Or for Docker:
DATABASE_URL=postgresql://jumptorecipe:yourpassword@db:5432/jump_to_recipe
```

**What it does**: Tells the application how to connect to PostgreSQL

---

### 2. **Database Connection** (`src/db/index.ts`)

**Location**: `jump-to-recipe/src/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

// 👇 This creates the database connection
export const queryClient = postgres(env.DATABASE_URL);

// 👇 This creates the Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

// 👇 Function to run migrations
export async function runMigrations() {
  const migrationsClient = postgres(env.DATABASE_URL, { max: 1 });
  const migrationsDb = drizzle(migrationsClient);

  await migrate(migrationsDb, { 
    migrationsFolder: 'src/db/migrations' 
  });
}
```

**What it does**: 
- Creates the PostgreSQL connection
- Sets up Drizzle ORM
- Provides migration function

---

### 3. **Database Schema** (`src/db/schema/`)

**Location**: `jump-to-recipe/src/db/schema/`

Contains all table definitions:
- `users.ts` - User accounts
- `recipes.ts` - Recipe data
- `cookbooks.ts` - Cookbook collections
- `cookbook-recipes.ts` - Recipe-cookbook relationships
- `cookbook-collaborators.ts` - Sharing permissions
- `recipe-photos.ts` - Recipe images

**Example** (`users.ts`):
```typescript
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  password: text('password'),
  role: text('role').notNull().default('user'),
  // ... more fields
});
```

**What it does**: Defines your database structure

---

### 4. **Drizzle Configuration** (`drizzle.config.ts`)

**Location**: `jump-to-recipe/drizzle.config.ts`

```typescript
export default {
  schema: './src/db/schema/*',      // 👈 Where table definitions are
  out: './src/db/migrations',       // 👈 Where migrations are generated
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    port: 5432,
    database: 'kiroJumpToRecipe',
  },
} satisfies Config;
```

**What it does**: Configures Drizzle Kit for migrations

---

### 5. **Docker Compose** (`docker-compose.yml`)

**Location**: `docker-compose.yml`

```yaml
services:
  # 👇 PostgreSQL Database Container
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: jumptorecipe
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: jump_to_recipe
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # 👇 Application Container
  app:
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://jumptorecipe:changeme@db:5432/jump_to_recipe
```

**What it does**: 
- Spins up PostgreSQL in Docker
- Connects app to database
- Persists data in volumes

---

### 6. **Seed Data** (`src/db/seed.ts`)

**Location**: `jump-to-recipe/src/db/seed.ts`

```typescript
async function seed() {
  console.log('🌱 Starting database seeding...');

  // Create demo user
  const [demoUser] = await db.insert(users).values({
    id: uuidv4(),
    name: 'Demo User',
    email: 'demo@jumptorecipe.com',
    password: hashedPassword,
    role: 'user',
  }).returning();

  // Create sample recipes
  await db.insert(recipes).values(sampleRecipes);
  
  console.log('✅ Seeding complete!');
}
```

**What it does**: Populates database with demo data

---

## 🚀 How to Set Up the Database

### Option 1: Docker (Recommended)

```bash
# 1. Create .env file
cp jump-to-recipe/.env.example jump-to-recipe/.env

# 2. Edit .env with your values
# DATABASE_URL will be set by docker-compose

# 3. Start database and app
docker-compose up -d

# 4. Run migrations (first time only)
docker-compose exec app npm run db:push

# 5. Seed with demo data (optional)
docker-compose exec app npm run db:seed
```

### Option 2: Local PostgreSQL

```bash
# 1. Install PostgreSQL
brew install postgresql@16  # macOS
# or
sudo apt install postgresql-16  # Linux

# 2. Start PostgreSQL
brew services start postgresql@16

# 3. Create database
createdb jump_to_recipe

# 4. Create .env file
cd jump-to-recipe
cp .env.example .env

# 5. Edit .env
DATABASE_URL=postgresql://yourusername@localhost:5432/jump_to_recipe

# 6. Generate and run migrations
npm run db:generate  # Generate migration files
npm run db:push      # Apply to database

# 7. Seed with demo data (optional)
npm run db:seed
```

---

## 📦 NPM Scripts for Database

**Location**: `jump-to-recipe/package.json`

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",  // Generate migration files
    "db:push": "drizzle-kit push",          // Apply schema to database
    "db:studio": "drizzle-kit studio",      // Open visual database browser
    "db:seed": "tsx src/db/seed.ts"         // Populate with demo data
  }
}
```

### Usage:

```bash
# Generate migration files from schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Drizzle Studio (visual database browser)
npm run db:studio

# Seed database with demo data
npm run db:seed
```

---

## 🔍 How to Verify Database Setup

### 1. Check Database Connection

```bash
# Using Docker
docker-compose exec db psql -U jumptorecipe -d jump_to_recipe -c "\dt"

# Using local PostgreSQL
psql -d jump_to_recipe -c "\dt"
```

You should see tables like:
- `users`
- `recipes`
- `cookbooks`
- `cookbook_recipes`
- `cookbook_collaborators`

### 2. Check Application Logs

```bash
# Docker
docker-compose logs app | grep -i database

# Local
npm run dev
# Look for: "Database connected successfully"
```

### 3. Open Drizzle Studio

```bash
npm run db:studio
```

Opens at `https://local.drizzle.studio` - visual database browser

---

## 🔧 Troubleshooting

### "DATABASE_URL is not set"

**Fix**: Create `.env` file with DATABASE_URL

```bash
cd jump-to-recipe
echo 'DATABASE_URL=postgresql://jumptorecipe:changeme@localhost:5432/jump_to_recipe' > .env
```

### "Connection refused"

**Fix**: Make sure PostgreSQL is running

```bash
# Docker
docker-compose ps

# Local
brew services list | grep postgresql
```

### "Database does not exist"

**Fix**: Create the database

```bash
# Docker (automatic)
docker-compose up -d db

# Local
createdb jump_to_recipe
```

### "Migration failed"

**Fix**: Reset and reapply migrations

```bash
# Drop all tables (⚠️ destroys data)
npm run db:push -- --force

# Or manually
psql -d jump_to_recipe -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:push
```

---

## 📁 File Structure Summary

```
jump-to-recipe/
├── .env                          # 👈 Database connection string
├── drizzle.config.ts             # 👈 Drizzle configuration
├── package.json                  # 👈 Database scripts
└── src/
    └── db/
        ├── index.ts              # 👈 Database connection
        ├── seed.ts               # 👈 Demo data
        ├── schema/               # 👈 Table definitions
        │   ├── users.ts
        │   ├── recipes.ts
        │   ├── cookbooks.ts
        │   └── ...
        └── migrations/           # 👈 Generated migration files
            └── 0000_*.sql

docker-compose.yml                # 👈 Docker database setup
```

---

## 🎯 Quick Start Checklist

- [ ] Create `.env` file with `DATABASE_URL`
- [ ] Start PostgreSQL (Docker or local)
- [ ] Run `npm run db:push` to create tables
- [ ] Run `npm run db:seed` for demo data (optional)
- [ ] Run `npm run db:studio` to verify (optional)
- [ ] Start app with `npm run dev` or `docker-compose up`

---

## 📚 Related Documentation

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
