# Design Document

## Overview

This document describes the technical design for migrating recipe and user data from a legacy Ruby on Rails PostgreSQL database to the new Jump to Recipe Next.js application. The migration follows a four-phase Extract-Transform-Validate-Import (ETVI) pipeline that ensures data quality, safety, and repeatability.

The legacy system uses a traditional relational schema with separate tables for recipes, ingredients, instructions, tags, and users with integer IDs. The new system uses a modern schema with UUID identifiers, JSONB columns for structured data, and NextAuth for authentication.

### Key Design Principles

1. **Safety First**: Read-only access to legacy DB, extensive validation, dry-run mode
2. **Repeatability**: Idempotent operations, checkpoint-based recovery
3. **Data Quality**: Multi-stage validation, manual review queues for edge cases
4. **Observability**: Comprehensive logging at each phase
5. **Service Layer Integration**: Use application APIs, not raw SQL
6. **Separation of Concerns**: Each phase is independent and testable

## Architecture

### High-Level Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   EXTRACT    │────▶│  TRANSFORM   │────▶│   VALIDATE   │────▶│    IMPORT    │
│              │     │              │     │              │     │              │
│ Legacy DB    │     │ Normalize &  │     │ Quality      │     │ Via API      │
│ → JSON files │     │ Parse Data   │     │ Checks       │     │ Routes       │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
  Raw exports         Normalized data       Valid records       New DB records
  + metadata          + mappings           + reports           + audit logs
```

### Data Flow


```
Legacy Database (PostgreSQL)
├── users (id, email, username, encrypted_password, super_user)
├── recipes (id, name, user_id, description, servings, prep_time, cook_time, ...)
├── ingredients (id, recipe_id, order_number, ingredient)
├── instructions (id, recipe_id, step_number, step)
├── tags (id, name)
├── recipe_tags (id, recipe_id, tag_id)
└── active_storage_* (attachments, blobs for images)

                    ↓ EXTRACT

migration-data/raw/2026-01-23-14-30-00/
├── export-metadata.json
├── users.json
├── recipes.json
├── ingredients.json
├── instructions.json
├── tags.json
├── recipe_tags.json
└── export-log.txt

                    ↓ TRANSFORM

migration-data/transformed/2026-01-23-14-30-00/
├── users-normalized.json
├── recipes-normalized.json
├── user-mapping.json (legacy_id → new_uuid)
├── transformation-report.json
└── unparseable-items.json

                    ↓ VALIDATE

migration-data/validated/2026-01-23-14-30-00/
├── users-valid.json (PASS)
├── recipes-valid.json (PASS)
├── recipes-warnings.json (WARN)
├── recipes-failed.json (FAIL)
├── duplicates-report.json
└── validation-report.json

                    ↓ IMPORT

migration-data/imported/2026-01-23-14-30-00/
├── import-log.json
├── import-errors.json
├── import-summary.json
└── id-mapping.json (legacy_id → new_uuid for recipes)

                    ↓

New Database (PostgreSQL)
├── users (id UUID, name, email, role, ...)
└── recipes (id UUID, title, authorId UUID, ingredients JSONB, instructions JSONB, ...)
```

## Components and Interfaces

### 1. Extraction Script (`extract-legacy-data.ts`)

**Purpose**: Standalone script to export data from legacy database to JSON files via SSH tunnel

**Inputs**:
- SSH connection parameters (host, port, username, private key path)
- Database connection parameters (host, port, database, username, password)
- Output directory path (optional, defaults to `migration-data/raw/{timestamp}`)

**Outputs**:
- JSON files for each table
- Export metadata file
- Export log file

**Key Functions**:

```typescript
interface ExtractionConfig {
  ssh: {
    host: string;
    port: number; // Default 22
    username: string;
    privateKeyPath: string; // Path to SSH private key
  };
  database: {
    host: string; // Usually 'localhost' when tunneling
    port: number; // Default 5432
    database: string;
    username: string;
    password: string;
  };
  outputDir?: string;
}

interface ExportMetadata {
  exportTimestamp: string;
  legacyDatabaseVersion: string;
  recordCounts: {
    users: number;
    recipes: number;
    ingredients: number;
    instructions: number;
    tags: number;
    recipe_tags: number;
  };
  checksums: Record<string, string>;
}

// Main extraction function
async function extractLegacyData(config: ExtractionConfig): Promise<ExportMetadata>

// Table-specific extractors
async function extractUsers(client: pg.Client): Promise<LegacyUser[]>
async function extractRecipes(client: pg.Client): Promise<LegacyRecipe[]>
async function extractIngredients(client: pg.Client): Promise<LegacyIngredient[]>
async function extractInstructions(client: pg.Client): Promise<LegacyInstruction[]>
async function extractTags(client: pg.Client): Promise<LegacyTag[]>
async function extractRecipeTags(client: pg.Client): Promise<LegacyRecipeTag[]>
```

**Design Decisions**:
- Use `ssh2` library for SSH tunnel creation
- Use `pg` library for PostgreSQL connection through tunnel
- Establish SSH tunnel before database connection
- Forward local port (e.g., 5433) to remote database port (5432)
- Read-only transaction to prevent accidental writes
- Stream large result sets to avoid memory issues
- Generate checksums (SHA-256) for data integrity verification
- Store raw data exactly as-is for auditability
- Gracefully close SSH tunnel after extraction completes

**SSH Tunnel Flow**:
```
Local Machine → SSH Tunnel → Remote Server → PostgreSQL Database
(localhost:5433) ←→ (SSH:22) ←→ (localhost:5432)
```

### 2. User Transformer (`user-transformer.ts`)

**Purpose**: Transform legacy user data to new schema format

**Inputs**: `users.json` from extraction phase

**Outputs**: 
- `users-normalized.json` - Transformed user records
- `user-mapping.json` - Legacy ID to new UUID mapping

**Key Functions**:

```typescript
interface LegacyUser {
  id: number;
  email: string;
  username: string | null;
  encrypted_password: string;
  super_user: boolean;
  created_at: string;
  updated_at: string;
}

interface TransformedUser {
  id: string; // Generated UUID
  name: string; // From username or email prefix
  email: string;
  emailVerified: null;
  password: null; // Will use OAuth or password reset
  image: null;
  role: 'user' | 'admin'; // From super_user flag
  createdAt: Date;
  updatedAt: Date;
  legacyId: number; // For tracking
}

interface UserMapping {
  legacyId: number;
  newUuid: string;
  email: string;
}

async function transformUsers(legacyUsers: LegacyUser[]): Promise<{
  users: TransformedUser[];
  mapping: UserMapping[];
  errors: TransformError[];
}>
```

**Transformation Rules**:

1. Generate UUID for each user
2. Map `username` → `name` (if null, use email prefix before @)
3. Preserve `email` exactly
4. Set `password` to null (users will authenticate via OAuth or reset)
5. Map `super_user: true` → `role: 'admin'`, otherwise `role: 'user'`
6. Preserve timestamps
7. Store legacy ID for reference

### 3. Recipe Transformer (`recipe-transformer.ts`)

**Purpose**: Transform legacy recipe data with related entities into new schema format

**Inputs**:
- `recipes.json`
- `ingredients.json`
- `instructions.json`
- `tags.json`
- `recipe_tags.json`
- `user-mapping.json`

**Outputs**:
- `recipes-normalized.json` - Transformed recipe records
- `transformation-report.json` - Statistics and issues
- `unparseable-items.json` - Items that couldn't be parsed

**Key Functions**:

```typescript
interface LegacyRecipe {
  id: number;
  name: string;
  user_id: number;
  description: string | null;
  servings: number | null;
  prep_time: number | null; // Float
  prep_time_descriptor: string | null; // 'minutes', 'hours'
  cook_time: number | null; // Float
  cook_time_descriptor: string | null;
  original_url: string | null;
  created_at: string;
  updated_at: string;
}

interface LegacyIngredient {
  id: number;
  recipe_id: number;
  order_number: number;
  ingredient: string; // Unstructured text
}

interface LegacyInstruction {
  id: number;
  recipe_id: number;
  step_number: number;
  step: string; // May contain HTML
}

interface TransformedRecipe {
  id: string; // Generated UUID
  title: string; // From name
  description: string | null;
  ingredients: Ingredient[]; // Parsed and structured
  instructions: Instruction[]; // Cleaned
  ingredientSections: null; // Legacy doesn't have sections
  instructionSections: null;
  prepTime: number | null; // Converted to minutes
  cookTime: number | null; // Converted to minutes
  servings: number | null;
  difficulty: null; // Not in legacy
  tags: string[]; // From recipe_tags join
  notes: null;
  imageUrl: string | null; // From active_storage if available
  sourceUrl: string | null; // From original_url
  authorId: string; // Mapped from user_id
  visibility: 'public'; // Default for migrated recipes
  commentsEnabled: true;
  viewCount: 0;
  likeCount: 0;
  createdAt: Date;
  updatedAt: Date;
  legacyId: number; // For tracking
}

async function transformRecipes(
  legacyRecipes: LegacyRecipe[],
  ingredients: LegacyIngredient[],
  instructions: LegacyInstruction[],
  tags: LegacyTag[],
  recipeTags: LegacyRecipeTag[],
  userMapping: UserMapping[]
): Promise<TransformationResult>
```

**Transformation Rules**:

1. Generate UUID for each recipe
2. Map `name` → `title`
3. Convert time fields to integer minutes:
   - If descriptor is 'hours', multiply by 60
   - If descriptor is 'minutes' or null, use as-is
   - Round to nearest integer
4. Group ingredients by `recipe_id`, sort by `order_number`
5. Parse each ingredient text using `recipe-import-normalizer.ts`
6. Group instructions by `recipe_id`, sort by `step_number`
7. Clean instruction HTML using `html-to-text` library
8. Join tags via `recipe_tags` table
9. Map `user_id` to new UUID using user mapping
10. Set default values for new fields
11. Preserve legacy ID in metadata

### 4. Ingredient Parser (`ingredient-parser.ts`)

**Purpose**: Parse unstructured ingredient text into structured format

**Leverages**: Existing `recipe-import-normalizer.ts` functionality

**Key Functions**:

```typescript
interface ParsedIngredient {
  id: string; // Generated UUID
  name: string;
  amount: number;
  unit: Unit;
  displayAmount?: string; // Fraction format
  notes?: string;
  category?: string;
  parseSuccess: boolean;
  originalText: string; // For fallback
}

async function parseIngredient(
  text: string,
  orderNumber: number
): Promise<ParsedIngredient>

// Wrapper around existing normalizer
function normalizeIngredientText(text: string): ParsedIngredient
```

**Parsing Strategy**:
1. Use existing `recipe-import-normalizer.ts` as primary parser
2. Handle common patterns:
   - "2 cups flour" → amount=2, unit="cup", name="flour"
   - "1½ lbs chicken" → amount=1.5, displayAmount="1½", unit="lb", name="chicken"
   - "Salt to taste" → amount=0, unit="", name="salt", notes="to taste"
3. If parsing fails, set `parseSuccess: false` and preserve `originalText`
4. Generate unique UUID for each ingredient
5. Preserve order via array position

### 5. Instruction Cleaner (`instruction-cleaner.ts`)

**Purpose**: Clean HTML and format instruction text

**Key Functions**:

```typescript
interface CleanedInstruction {
  id: string; // Generated UUID
  step: number;
  content: string; // Clean text
  duration: null; // Not in legacy data
  originalHtml?: string; // For reference
}

function cleanInstructionHtml(html: string): string
function splitIntoSteps(text: string): string[]
```

**Cleaning Strategy**:
1. Use `html-to-text` library with options:
   - Preserve line breaks
   - Remove excessive whitespace
   - Convert HTML entities
2. Normalize whitespace (collapse multiple spaces/newlines)
3. Trim leading/trailing whitespace
4. If text is empty after cleaning, flag for review
5. Generate unique UUID for each instruction
6. Preserve order from `step_number`

### 6. Validator (`recipe-validator.ts`)

**Purpose**: Validate transformed data against business rules

**Leverages**: Existing Zod schemas from `recipe-sections.ts`

**Key Functions**:

```typescript
type ValidationStatus = 'PASS' | 'WARN' | 'FAIL';

interface ValidationResult {
  status: ValidationStatus;
  recipe: TransformedRecipe;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

async function validateRecipe(recipe: TransformedRecipe): Promise<ValidationResult>
async function validateBatch(recipes: TransformedRecipe[]): Promise<ValidationReport>
```

**Validation Rules**:

**FAIL Criteria** (cannot import):
- Title is empty or > 500 characters
- No ingredients (empty array)
- No instructions (empty array)
- Invalid UUID format
- Author ID doesn't exist in user mapping
- Servings is negative
- Times are negative

**WARN Criteria** (can import with flags):
- Missing description
- Missing image
- Missing source URL
- No tags
- Unparsed ingredients (parseSuccess: false)
- Very short instructions (< 10 characters)

**PASS Criteria**:
- All required fields valid
- At least one ingredient and instruction
- All IDs are valid UUIDs
- Author exists

### 7. Duplicate Detector (`duplicate-detector.ts`)

**Purpose**: Identify potential duplicate recipes

**Key Functions**:

```typescript
interface DuplicateGroup {
  recipes: TransformedRecipe[];
  matchReason: string;
  confidence: 'high' | 'medium' | 'low';
}

async function detectDuplicates(
  recipes: TransformedRecipe[]
): Promise<DuplicateGroup[]>

function normalizeTitle(title: string): string
function getIngredientFingerprint(ingredients: Ingredient[]): string
```

**Detection Strategy**:

1. **Exact Title Match** (high confidence):
   - Normalize titles (lowercase, trim, remove special chars)
   - Group recipes with identical normalized titles
   
2. **Title + Ingredient Match** (high confidence):
   - Same normalized title
   - First 3 ingredients match (normalized names)
   
3. **Fuzzy Title Match** (medium confidence):
   - Levenshtein distance < 3
   - At least 2 of first 3 ingredients match

**Duplicate Handling Strategies**:
- `keep-first`: Import only the oldest (by created_at)
- `keep-all`: Import all, add note about potential duplicate
- `manual-review`: Generate report, don't import any in group

### 8. Batch Importer (`batch-importer.ts`)

**Purpose**: Import validated recipes via API routes with batching and retry logic

**Key Functions**:

```typescript
interface ImportConfig {
  batchSize: number;
  dryRun: boolean;
  stopOnError: boolean;
  apiBaseUrl: string;
  authToken: string; // Migration user token
}

interface ImportResult {
  success: boolean;
  legacyId: number;
  newId?: string;
  error?: string;
}

async function importUsers(
  users: TransformedUser[],
  config: ImportConfig
): Promise<ImportResult[]>

async function importRecipes(
  recipes: TransformedRecipe[],
  config: ImportConfig
): Promise<ImportResult[]>

async function importBatch(
  items: any[],
  endpoint: string,
  config: ImportConfig
): Promise<ImportResult[]>
```

**Import Strategy**:
1. Process in batches of 50 (configurable)
2. For each user:
   - Check if email already exists (GET /api/users?email=...)
   - If exists, use existing UUID for mapping
   - If not, create user (POST /api/users)
   - Update user mapping table
3. For each recipe:
   - Check if already imported (query by legacyId in notes/metadata)
   - If exists, skip (idempotency)
   - If not, POST to /api/recipes
   - Store legacy_id → new_uuid mapping
4. Add delay between batches (100ms) to avoid rate limiting
5. Retry failed requests up to 3 times with exponential backoff
6. Log all successes and failures

**Dry-Run Mode**:
- Validate request payload
- Simulate API call (don't actually send)
- Log what would be imported
- Generate "would succeed" report

### 9. Progress Tracker (`progress-tracker.ts`)

**Purpose**: Track migration progress and enable resumption

**Key Functions**:

```typescript
interface MigrationProgress {
  migrationId: string;
  phase: 'extract' | 'transform' | 'validate' | 'import';
  startTime: string;
  lastCheckpoint: string;
  totalRecords: number;
  processedRecords: number;
  succeededRecords: number;
  failedRecords: number;
  warnedRecords: number;
}

class ProgressTracker {
  async saveCheckpoint(progress: MigrationProgress): Promise<void>
  async loadCheckpoint(migrationId: string): Promise<MigrationProgress | null>
  async updateProgress(delta: Partial<MigrationProgress>): Promise<void>
}
```

**Checkpoint Strategy**:
- Save after each batch import
- Store in `migration-data/progress/{migrationId}.json`
- Include timestamp and record counts
- Enable resumption from last successful batch

## Data Models

### Legacy Schema (Source)

```sql
-- Users table
users (
  id: bigint PRIMARY KEY,
  email: varchar NOT NULL UNIQUE,
  username: varchar,
  encrypted_password: varchar NOT NULL,
  super_user: boolean DEFAULT false,
  created_at: timestamp NOT NULL,
  updated_at: timestamp NOT NULL
)

-- Recipes table
recipes (
  id: bigint PRIMARY KEY,
  name: varchar,
  user_id: bigint REFERENCES users(id),
  description: text,
  servings: int,
  prep_time: float,
  prep_time_descriptor: varchar,
  cook_time: float,
  cook_time_descriptor: varchar,
  original_url: varchar,
  created_at: timestamp NOT NULL,
  updated_at: timestamp NOT NULL
)

-- Ingredients table (one-to-many with recipes)
ingredients (
  id: bigint PRIMARY KEY,
  recipe_id: bigint REFERENCES recipes(id),
  order_number: int,
  ingredient: varchar, -- Unstructured text
  created_at: timestamp NOT NULL,
  updated_at: timestamp NOT NULL
)

-- Instructions table (one-to-many with recipes)
instructions (
  id: bigint PRIMARY KEY,
  recipe_id: bigint REFERENCES recipes(id),
  step_number: int,
  step: text, -- May contain HTML
  created_at: timestamp NOT NULL,
  updated_at: timestamp NOT NULL
)

-- Tags table
tags (
  id: bigint PRIMARY KEY,
  name: varchar,
  created_at: timestamp NOT NULL,
  updated_at: timestamp NOT NULL
)

-- Recipe-Tags junction table (many-to-many)
recipe_tags (
  id: bigint PRIMARY KEY,
  recipe_id: bigint REFERENCES recipes(id),
  tag_id: bigint REFERENCES tags(id),
  created_at: timestamp NOT NULL,
  updated_at: timestamp NOT NULL
)
```

### New Schema (Target)

```typescript
// Users table (Drizzle ORM)
users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  password: text('password'),
  image: text('image'),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Recipes table (Drizzle ORM)
recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  ingredients: jsonb('ingredients').notNull(), // Array of Ingredient objects
  instructions: jsonb('instructions').notNull(), // Array of Instruction objects
  ingredientSections: jsonb('ingredient_sections'), // Optional sections
  instructionSections: jsonb('instruction_sections'), // Optional sections
  prepTime: integer('prep_time'), // Minutes
  cookTime: integer('cook_time'), // Minutes
  servings: integer('servings'),
  difficulty: difficultyEnum('difficulty'),
  tags: text('tags').array(), // PostgreSQL text array
  notes: text('notes'),
  imageUrl: text('image_url'),
  sourceUrl: text('source_url'),
  authorId: uuid('author_id').references(() => users.id),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  commentsEnabled: boolean('comments_enabled').default(true).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Mapping Tables (Temporary)

```typescript
// User ID mapping (stored in JSON file)
interface UserMapping {
  legacyId: number;
  newUuid: string;
  email: string;
  migrated: boolean;
  migratedAt: string;
}

// Recipe ID mapping (stored in JSON file)
interface RecipeMapping {
  legacyId: number;
  newUuid: string;
  title: string;
  migrated: boolean;
  migratedAt: string;
}
```

## Error Handling

### Error Categories

1. **SSH Connection Errors**: SSH tunnel establishment failures, authentication issues
2. **Connection Errors**: Database connection failures through tunnel
3. **Parse Errors**: Unable to parse ingredient/instruction text
4. **Validation Errors**: Data doesn't meet business rules
5. **Import Errors**: API call failures
6. **Network Errors**: Transient network issues

### Error Handling Strategy

```typescript
class MigrationError extends Error {
  category: ErrorCategory;
  phase: MigrationPhase;
  recordId?: number;
  retryable: boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoff: number = 1000
): Promise<T>

async function handleError(
  error: MigrationError,
  config: MigrationConfig
): Promise<void>
```

**Retry Logic**:
- SSH connection errors: Retry 3 times with exponential backoff (2s, 4s, 8s)
- Connection errors: Retry 3 times with exponential backoff (1s, 2s, 4s)
- Network errors (5xx): Retry 3 times
- Validation errors (4xx): Don't retry, log and continue
- Parse errors: Don't retry, flag for manual review

**Error Recovery**:
- Save checkpoint before each batch
- On failure, can resume from last checkpoint
- Failed records logged to `import-errors.json`
- Manual review queue for ambiguous cases
- SSH tunnel automatically closed on error or completion

## Testing Strategy

### Unit Tests

1. **Transformer Tests**:
   - Test time conversion (hours → minutes)
   - Test user mapping
   - Test UUID generation
   - Test default value assignment

2. **Parser Tests**:
   - Test ingredient parsing with various formats
   - Test HTML cleaning
   - Test edge cases (empty strings, special characters)

3. **Validator Tests**:
   - Test PASS/WARN/FAIL classification
   - Test Zod schema validation
   - Test duplicate detection algorithms

### Integration Tests

1. **End-to-End Pipeline**:
   - Use sample legacy data (10-20 recipes)
   - Run full ETVI pipeline
   - Verify output at each stage
   - Check final database state

2. **API Integration**:
   - Test recipe creation via POST /api/recipes
   - Test user creation
   - Test error handling (invalid data)

### Manual Testing

1. **Spot Checks**:
   - Randomly select 20 migrated recipes
   - Verify in UI
   - Check ingredient parsing accuracy
   - Check instruction formatting

2. **Edge Cases**:
   - Recipes with no ingredients
   - Recipes with HTML in instructions
   - Recipes with unusual time formats
   - Duplicate recipes

## Configuration

### Migration Configuration File

```typescript
interface MigrationConfig {
  // Extraction
  ssh: {
    host: string;
    port: number;
    username: string;
    privateKeyPath: string;
  };
  legacyDb: {
    host: string; // 'localhost' when using SSH tunnel
    port: number;
    database: string;
    username: string;
    password: string;
  };
  
  // Transformation
  transform: {
    defaultVisibility: 'private' | 'public';
    preserveTimestamps: boolean;
  };
  
  // Validation
  validation: {
    strictMode: boolean; // Fail on warnings
    duplicateStrategy: 'keep-first' | 'keep-all' | 'manual-review';
  };
  
  // Import
  import: {
    apiBaseUrl: string;
    batchSize: number;
    delayBetweenBatches: number; // milliseconds
    dryRun: boolean;
    stopOnError: boolean;
  };
  
  // Logging
  logging: {
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    verbose: boolean;
    outputDir: string;
  };
  
  // Migration user
  migrationUser: {
    email: string;
    name: string;
    role: 'admin';
  };
}
```

### Environment Variables

```bash
# SSH tunnel configuration
SSH_HOST=remote-server.example.com
SSH_PORT=22
SSH_USERNAME=migration_user
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# Legacy database (accessed via SSH tunnel)
LEGACY_DB_HOST=localhost  # localhost when using SSH tunnel
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=legacy_recipes
LEGACY_DB_USER=readonly_user
LEGACY_DB_PASSWORD=secure_password

# New database (for direct queries if needed)
DATABASE_URL=postgresql://user:pass@localhost:5432/jump_to_recipe

# API configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
MIGRATION_AUTH_TOKEN=<admin_token>

# Migration settings
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=50
MIGRATION_STOP_ON_ERROR=false
```

## Deployment and Execution

### Prerequisites

1. Node.js 18+ installed
2. SSH access to remote server hosting legacy database
3. SSH private key with appropriate permissions (chmod 600)
4. Read-only database credentials for legacy database
5. Access to new database (via API or direct connection)
6. Migration user account created in new system
7. Sufficient disk space for exported data (~1GB for 10k recipes)
8. Network access to remote server (firewall rules allow SSH)

### Execution Steps

1. **Setup**:
   ```bash
   cd jump-to-recipe
   npm install
   cp .env.example .env.migration
   # Edit .env.migration with SSH and database credentials
   
   # Verify SSH access
   ssh -i ~/.ssh/id_rsa user@remote-server.example.com
   
   # Test SSH tunnel manually (optional)
   ssh -L 5433:localhost:5432 user@remote-server.example.com
   ```

2. **Extract** (one-time):
   ```bash
   npm run migration:extract
   # Creates migration-data/raw/{timestamp}/
   ```

3. **Transform**:
   ```bash
   npm run migration:transform
   # Creates migration-data/transformed/{timestamp}/
   ```

4. **Validate**:
   ```bash
   npm run migration:validate
   # Creates migration-data/validated/{timestamp}/
   ```

5. **Dry-Run Import**:
   ```bash
   npm run migration:import -- --dry-run
   # Simulates import, no database writes
   ```

6. **Production Import**:
   ```bash
   npm run migration:import
   # Imports to database
   ```

7. **Verify**:
   ```bash
   npm run migration:verify
   # Runs post-migration checks
   ```

### Rollback Strategy

If migration fails or produces bad data:

1. **During Development**:
   - Drop and recreate database
   - Re-run migration with fixes

2. **In Production**:
   - Restore database from backup taken before migration
   - Fix issues in transformation/validation
   - Re-run migration

**Prevention**:
- Always run dry-run first
- Test with subset of data
- Take database backup before production run
- Use transactions for batch imports

## Performance Considerations

### Extraction Phase
- Use streaming for large tables (>100k rows)
- Batch queries if needed (LIMIT/OFFSET)
- Expected time: ~5-10 minutes for 10k recipes

### Transformation Phase
- Process in memory (acceptable for <100k recipes)
- Use worker threads for parallel processing if needed
- Expected time: ~2-5 minutes for 10k recipes

### Validation Phase
- Batch validation (1000 recipes at a time)
- Expected time: ~1-2 minutes for 10k recipes

### Import Phase
- Batch size: 50 recipes per batch
- Delay between batches: 100ms
- Expected time: ~20-30 minutes for 10k recipes (with API calls)
- Bottleneck: API rate limits and validation overhead

### Optimization Opportunities
- Parallel batch imports (with concurrency limit)
- Direct database inserts (bypass API) - trade-off: skip validation
- Caching user lookups
- Pre-compile Zod schemas

## Monitoring and Observability

### Logging

All phases log to:
- Console (real-time progress)
- File (`migration-data/logs/{phase}-{timestamp}.log`)
- Structured JSON format for parsing

### Metrics to Track

1. **Extraction**:
   - Records extracted per table
   - Extraction duration
   - File sizes

2. **Transformation**:
   - Recipes transformed
   - Parse success rate (ingredients)
   - Unparseable items count

3. **Validation**:
   - PASS/WARN/FAIL counts
   - Duplicate groups found
   - Validation errors by type

4. **Import**:
   - Recipes imported
   - Import success rate
   - API errors by type
   - Average batch duration

### Alerts

- Extraction fails to connect
- Parse success rate < 90%
- Validation FAIL rate > 10%
- Import success rate < 95%
- Any critical errors

## Security Considerations

1. **SSH and Database Credentials**:
   - Use SSH key-based authentication (not password)
   - Ensure SSH private key has restrictive permissions (chmod 600)
   - Use read-only credentials for legacy DB
   - Store credentials in environment variables, not code
   - Use connection pooling with limits
   - Close SSH tunnel immediately after extraction completes

2. **Data Privacy**:
   - Exported JSON files contain user emails
   - Store in secure location
   - Delete after migration completes
   - Don't commit to version control

3. **API Authentication**:
   - Use dedicated migration user with admin role
   - Generate temporary auth token
   - Revoke token after migration

4. **Audit Trail**:
   - Log all operations
   - Preserve mapping files for traceability
   - Store migration reports for compliance

## Future Enhancements

1. **Image Migration**:
   - Extract from active_storage_blobs
   - Upload to new storage (UploadThing/Cloudinary)
   - Update imageUrl in recipes

2. **Incremental Migration**:
   - Support migrating only new/updated recipes
   - Track last migration timestamp
   - Useful for staged rollouts

3. **Data Quality Improvements**:
   - ML-based ingredient parsing
   - Automatic duplicate merging
   - Recipe categorization

4. **Performance Optimization**:
   - Parallel processing
   - Direct database inserts (optional)
   - Streaming imports

5. **UI for Migration**:
   - Web dashboard for monitoring
   - Manual review interface for edge cases
   - One-click rollback
