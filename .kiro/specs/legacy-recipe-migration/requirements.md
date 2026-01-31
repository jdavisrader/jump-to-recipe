# Requirements Document

## Introduction

This document outlines the requirements for migrating recipe data from a legacy Ruby on Rails application database (PostgreSQL) to the new Jump to Recipe Next.js application. The legacy database contains recipes with a relational schema (separate tables for recipes, ingredients, instructions, tags, and users), while the new application uses a modern schema with JSONB columns for structured data and UUID-based identifiers.

The migration must be safe, repeatable, and ensure data quality by validating and normalizing legacy data before importing it into the new system. The migration will handle schema mismatches, parse unstructured text data, and leverage the application's existing service layer to ensure business logic and validation rules are enforced.

## Requirements

### Requirement 1: Safe Data Extraction

**User Story:** As a data migration engineer, I want to safely extract all recipe and user data from the legacy database, so that I have a complete and immutable snapshot for migration testing.

#### Acceptance Criteria

1. WHEN the extraction script is executed THEN the system SHALL connect to the legacy PostgreSQL database with read-only credentials
2. WHEN extracting data THEN the system SHALL export recipes, ingredients, instructions, tags, recipe_tags, and users tables to structured JSON files
3. WHEN extracting data THEN the system SHALL preserve all fields including timestamps, IDs, and relationships
4. WHEN extraction completes THEN the system SHALL generate an export metadata file containing timestamp, record counts, and schema version
5. WHEN extraction encounters database connection errors THEN the system SHALL log the error and exit gracefully
6. WHEN extraction completes THEN the system SHALL create a manifest file listing all exported files with checksums
7. WHEN the extraction script is provided with database credentials THEN the system SHALL validate connection before starting extraction
8. WHEN the extraction script runs THEN the system SHALL create an output directory structure: `migration-data/raw/YYYY-MM-DD-HH-MM-SS/`
9. WHEN extracting users THEN the system SHALL export all user fields including email, username, created_at, updated_at, and super_user flag
10. WHEN extracting recipes THEN the system SHALL include the user_id foreign key for ownership mapping

### Requirement 2: Schema Transformation

**User Story:** As a data migration engineer, I want to transform legacy relational data into the new JSONB-based schema, so that recipes can be imported into the new application.

#### Acceptance Criteria

1. WHEN transforming recipe data THEN the system SHALL map legacy `recipes.name` to new `recipes.title`
2. WHEN transforming recipe data THEN the system SHALL convert legacy `recipes.prep_time` (float with descriptor) to new `recipes.prepTime` (integer minutes)
3. WHEN transforming recipe data THEN the system SHALL convert legacy `recipes.cook_time` (float with descriptor) to new `recipes.cookTime` (integer minutes)
4. WHEN transforming ingredients THEN the system SHALL aggregate all ingredients for a recipe into a JSONB array ordered by `order_number`
5. WHEN transforming instructions THEN the system SHALL aggregate all instructions for a recipe into a JSONB array ordered by `step_number`
6. WHEN transforming tags THEN the system SHALL join recipe_tags and tags tables to create a text array for `recipes.tags`
7. WHEN transforming user references THEN the system SHALL map legacy integer user IDs to new UUID user IDs using a mapping table
8. WHEN transforming data THEN the system SHALL generate UUIDs for all recipe records
9. WHEN transforming data THEN the system SHALL set default values for new fields not present in legacy schema (visibility='private', commentsEnabled=true, viewCount=0, likeCount=0)
10. WHEN transformation encounters unmappable data THEN the system SHALL log the issue and add the record to an unparseable items report

### Requirement 3: Ingredient Parsing and Normalization

**User Story:** As a data migration engineer, I want to parse unstructured ingredient text into structured data, so that ingredients are usable in the new application's features.

#### Acceptance Criteria

1. WHEN parsing ingredient text THEN the system SHALL use the existing `recipe-import-normalizer.ts` parser
2. WHEN parsing ingredient text THEN the system SHALL extract quantity, unit, ingredient name, and notes
3. WHEN parsing ingredient text like "2 cups flour" THEN the system SHALL extract amount=2, unit="cup", name="flour"
4. WHEN parsing ingredient text like "1 lb chicken breast, diced" THEN the system SHALL extract amount=1, unit="lb", name="chicken breast", notes="diced"
5. WHEN parsing ingredient text with fractions THEN the system SHALL convert to decimal (e.g., "1½" → 1.5) and preserve displayAmount="1½"
6. WHEN ingredient text cannot be parsed THEN the system SHALL flag it for manual review and include the raw text in notes
7. WHEN parsing ingredients THEN the system SHALL generate unique UUIDs for each ingredient
8. WHEN parsing ingredients THEN the system SHALL preserve the original order from `order_number`

### Requirement 4: Instruction Cleaning and Structuring

**User Story:** As a data migration engineer, I want to clean and structure instruction text, so that instructions are readable and properly formatted in the new application.

#### Acceptance Criteria

1. WHEN cleaning instruction text THEN the system SHALL remove HTML tags while preserving semantic structure
2. WHEN cleaning instruction text THEN the system SHALL convert HTML entities (e.g., `&nbsp;`, `&quot;`) to plain text
3. WHEN cleaning instruction text THEN the system SHALL normalize whitespace and line breaks
4. WHEN cleaning instruction text THEN the system SHALL preserve paragraph breaks as separate steps if appropriate
5. WHEN cleaning instruction text THEN the system SHALL generate unique UUIDs for each instruction
6. WHEN cleaning instruction text THEN the system SHALL preserve the original order from `step_number`
7. WHEN instruction text is empty or only whitespace THEN the system SHALL flag the recipe for manual review

### Requirement 5: Data Quality Validation

**User Story:** As a data migration engineer, I want to validate transformed data against business rules, so that only quality data is imported into the new database.

#### Acceptance Criteria

1. WHEN validating recipes THEN the system SHALL use the existing Zod schemas from `recipe-sections.ts`
2. WHEN validating recipes THEN the system SHALL enforce that title is non-empty and under 500 characters
3. WHEN validating recipes THEN the system SHALL enforce that at least one ingredient exists
4. WHEN validating recipes THEN the system SHALL enforce that at least one instruction exists
5. WHEN validating recipes THEN the system SHALL enforce that servings is a positive integer or null
6. WHEN validating recipes THEN the system SHALL enforce that prepTime and cookTime are non-negative integers or null
7. WHEN validation passes THEN the system SHALL mark the recipe as PASS and include it in the import queue
8. WHEN validation fails on critical fields THEN the system SHALL mark the recipe as FAIL and exclude it from import
9. WHEN validation fails on optional fields THEN the system SHALL mark the recipe as WARN and include it in import with flags
10. WHEN validation completes THEN the system SHALL generate a validation report with counts and details for PASS, WARN, and FAIL categories

### Requirement 6: Duplicate Detection

**User Story:** As a data migration engineer, I want to detect duplicate recipes, so that the new database doesn't contain redundant data.

#### Acceptance Criteria

1. WHEN detecting duplicates THEN the system SHALL compare recipes by title (case-insensitive)
2. WHEN detecting duplicates THEN the system SHALL compare the first 3 ingredients (normalized)
3. WHEN two recipes have identical titles and similar ingredients THEN the system SHALL flag them as potential duplicates
4. WHEN duplicates are detected THEN the system SHALL log both recipe IDs and titles in a duplicates report
5. WHEN duplicates are detected THEN the system SHALL provide options: keep first, keep both with flag, or manual review
6. WHEN the migration is configured to keep first THEN the system SHALL import only the oldest recipe by created_at
7. WHEN the migration is configured to keep both THEN the system SHALL import both recipes and add a note indicating potential duplicate

### Requirement 7: Idempotent Import Process

**User Story:** As a data migration engineer, I want the import process to be idempotent, so that I can safely re-run the migration during development without creating duplicates.

#### Acceptance Criteria

1. WHEN importing recipes THEN the system SHALL check if a recipe with the same legacy ID already exists
2. WHEN a recipe already exists THEN the system SHALL skip it and log the skip action
3. WHEN importing recipes THEN the system SHALL maintain a mapping table of legacy_id → new_uuid
4. WHEN the migration is re-run THEN the system SHALL use the existing mapping table to avoid duplicates
5. WHEN the migration is configured for clean import THEN the system SHALL provide an option to clear all migrated recipes before starting
6. WHEN tracking import progress THEN the system SHALL save checkpoints after each batch
7. WHEN the migration is interrupted THEN the system SHALL be able to resume from the last checkpoint

### Requirement 8: Service Layer Integration

**User Story:** As a data migration engineer, I want to import recipes through the application's service layer, so that all business logic and validation rules are enforced.

#### Acceptance Criteria

1. WHEN importing recipes THEN the system SHALL call the POST /api/recipes endpoint for each recipe
2. WHEN importing recipes THEN the system SHALL NOT use raw SQL INSERT statements
3. WHEN importing recipes THEN the system SHALL include proper authentication context (migration user)
4. WHEN importing recipes THEN the system SHALL process recipes in batches of 50
5. WHEN a batch import fails THEN the system SHALL log the error and continue with the next batch
6. WHEN importing recipes THEN the system SHALL respect rate limits and add delays between batches if needed
7. WHEN importing recipes THEN the system SHALL validate that the API response indicates success before marking the recipe as imported

### Requirement 9: User Migration and Ownership Mapping

**User Story:** As a data migration engineer, I want to migrate users and map legacy user IDs to new user IDs, so that recipe ownership is preserved and users can access their recipes in the new system.

#### Acceptance Criteria

1. WHEN migrating users THEN the system SHALL transform legacy user data to match the new schema
2. WHEN migrating users THEN the system SHALL map legacy `users.username` to new `users.name`
3. WHEN migrating users THEN the system SHALL preserve `users.email` and ensure uniqueness
4. WHEN migrating users THEN the system SHALL generate UUIDs for all user records
5. WHEN migrating users THEN the system SHALL set default values for new fields (role='user', emailVerified=null, image=null)
6. WHEN migrating users THEN the system SHALL handle password migration by setting password=null (users will need to reset via OAuth or password reset)
7. WHEN migrating users THEN the system SHALL preserve created_at and updated_at timestamps
8. WHEN migrating users THEN the system SHALL create a mapping table of legacy_user_id (integer) → new_user_uuid
9. WHEN a legacy user's email already exists in the new system THEN the system SHALL use the existing user's UUID for recipe mapping
10. WHEN a legacy user does NOT exist in the new system THEN the system SHALL create the user account
11. WHEN assigning recipe ownership THEN the system SHALL use the user mapping table to set authorId
12. WHEN user mapping is incomplete THEN the system SHALL generate a report of unmapped users
13. WHEN migrating super_user flag THEN the system SHALL map it to role='admin' in the new system

### Requirement 10: Dry-Run Mode

**User Story:** As a data migration engineer, I want to run the migration in dry-run mode, so that I can validate the process without writing to the database.

#### Acceptance Criteria

1. WHEN dry-run mode is enabled THEN the system SHALL execute all transformation and validation steps
2. WHEN dry-run mode is enabled THEN the system SHALL NOT write any data to the new database
3. WHEN dry-run mode is enabled THEN the system SHALL simulate API calls and log what would be imported
4. WHEN dry-run mode is enabled THEN the system SHALL generate a complete report of what would happen
5. WHEN dry-run mode is enabled THEN the system SHALL validate that all API calls would succeed
6. WHEN dry-run mode completes THEN the system SHALL provide a summary of expected outcomes (success count, warnings, failures)

### Requirement 11: Comprehensive Logging and Reporting

**User Story:** As a data migration engineer, I want detailed logs and reports for each migration phase, so that I can audit the process and troubleshoot issues.

#### Acceptance Criteria

1. WHEN any migration phase executes THEN the system SHALL log all actions with timestamps and severity levels (DEBUG, INFO, WARN, ERROR)
2. WHEN extraction completes THEN the system SHALL generate an extraction report with record counts per table
3. WHEN transformation completes THEN the system SHALL generate a transformation report with success/failure counts and unparseable items
4. WHEN validation completes THEN the system SHALL generate a validation report with PASS/WARN/FAIL counts and details
5. WHEN import completes THEN the system SHALL generate an import report with success/failure counts and error details
6. WHEN any phase encounters errors THEN the system SHALL log the full error with stack trace
7. WHEN migration completes THEN the system SHALL generate a summary report with overall statistics and next steps
8. WHEN logging THEN the system SHALL use structured JSON format for machine parsing
9. WHEN logging THEN the system SHALL write logs to both console and file

### Requirement 12: Post-Migration Verification

**User Story:** As a data migration engineer, I want to verify the migrated data, so that I can ensure the migration was successful and data integrity is maintained.

#### Acceptance Criteria

1. WHEN verification runs THEN the system SHALL compare record counts between legacy and new databases
2. WHEN verification runs THEN the system SHALL perform spot-checks on 20 random recipes
3. WHEN verification runs THEN the system SHALL validate that all required fields are populated
4. WHEN verification runs THEN the system SHALL check for HTML or encoding artifacts in text fields
5. WHEN verification runs THEN the system SHALL validate that ingredient and instruction ordering is preserved
6. WHEN verification runs THEN the system SHALL validate that tag associations are correct
7. WHEN verification runs THEN the system SHALL validate that user ownership is correctly mapped
8. WHEN verification runs THEN the system SHALL generate a verification report with pass/fail status for each check
9. WHEN verification fails THEN the system SHALL provide detailed information about what failed and how to fix it

### Requirement 13: Error Handling and Recovery

**User Story:** As a data migration engineer, I want robust error handling, so that the migration can recover from transient failures and continue processing.

#### Acceptance Criteria

1. WHEN a database connection error occurs THEN the system SHALL retry up to 3 times with exponential backoff
2. WHEN an API call fails with a 5xx error THEN the system SHALL retry up to 3 times
3. WHEN an API call fails with a 4xx error THEN the system SHALL log the error and skip the record
4. WHEN a batch import fails THEN the system SHALL rollback that batch and continue with the next batch
5. WHEN a critical error occurs THEN the system SHALL save the current state and exit gracefully
6. WHEN the migration is configured to stop on error THEN the system SHALL halt immediately on first error
7. WHEN the migration is configured to continue on error THEN the system SHALL log errors and continue processing
8. WHEN errors occur THEN the system SHALL categorize them (parse error, validation error, import error, network error)

### Requirement 14: Extraction Script Implementation

**User Story:** As a data migration engineer, I want a standalone extraction script, so that I can easily export data from the legacy database without manual SQL queries.

#### Acceptance Criteria

1. WHEN running the extraction script THEN the system SHALL accept database connection parameters via command-line arguments or environment variables
2. WHEN running the extraction script THEN the system SHALL accept parameters: host, port, database, username, password
3. WHEN running the extraction script THEN the system SHALL validate all required parameters are provided
4. WHEN running the extraction script THEN the system SHALL test the database connection before starting extraction
5. WHEN the extraction script connects THEN the system SHALL use a read-only transaction to prevent accidental writes
6. WHEN extracting each table THEN the system SHALL display progress (e.g., "Extracting recipes: 1500/1500")
7. WHEN extracting data THEN the system SHALL handle large result sets efficiently (streaming or pagination)
8. WHEN extraction completes successfully THEN the system SHALL display a summary with record counts per table
9. WHEN extraction fails THEN the system SHALL display a clear error message with troubleshooting guidance
10. WHEN the extraction script runs THEN the system SHALL create the output directory if it doesn't exist
11. WHEN writing JSON files THEN the system SHALL format them with proper indentation for readability
12. WHEN the extraction script completes THEN the system SHALL display the output directory path and next steps

### Requirement 15: Configuration Management

**User Story:** As a data migration engineer, I want to configure migration behavior, so that I can adapt the process to different environments and requirements.

#### Acceptance Criteria

1. WHEN configuring the migration THEN the system SHALL support a configuration file with all migration settings
2. WHEN configuring the migration THEN the system SHALL allow setting: dryRun, batchSize, stopOnError, duplicateStrategy, verbose logging
3. WHEN configuring the migration THEN the system SHALL allow specifying legacy database connection details
4. WHEN configuring the migration THEN the system SHALL allow specifying new database connection details
5. WHEN configuring the migration THEN the system SHALL allow specifying the migration user ID for orphaned recipes
6. WHEN configuring the migration THEN the system SHALL validate all configuration values before starting
7. WHEN configuration is invalid THEN the system SHALL display clear error messages and exit
8. WHEN configuration is valid THEN the system SHALL display a summary of settings before starting
