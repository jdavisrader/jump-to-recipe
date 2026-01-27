# Implementation Plan

This document outlines the step-by-step implementation tasks for the legacy recipe migration system. Each task builds incrementally on previous work and focuses on creating a safe, repeatable migration pipeline.

## Task List

- [x] 1. Set up project structure and dependencies
  - Create directory structure for migration scripts
  - Install required npm packages (pg, ssh2, html-to-text, zod)
  - Create TypeScript configuration for migration scripts
  - Set up environment variable configuration
  - _Requirements: 14.1, 14.2, 14.3, 15.1, 15.2_

- [-] 2. Implement SSH tunnel and database connection utilities
  - [x] 2.1 Create SSH tunnel manager class
    - Implement SSH connection using ssh2 library
    - Create port forwarding for PostgreSQL
    - Add connection validation and error handling
    - Implement graceful tunnel closure
    - _Requirements: 1.1, 1.5, 14.4, 14.9_

  - [x] 2.2 Create database client wrapper
    - Implement PostgreSQL connection through SSH tunnel
    - Add read-only transaction support
    - Implement connection pooling
    - Add query streaming for large result sets
    - _Requirements: 1.1, 14.5, 14.7_

  - [ ]* 2.3 Write unit tests for connection utilities
    - Test SSH tunnel establishment and closure
    - Test database connection through tunnel
    - Test error handling for connection failures
    - _Requirements: 1.5, 13.1_

- [x] 3. Build extraction script
  - [x] 3.1 Create extraction configuration interface
    - Define TypeScript interfaces for SSH and database config
    - Implement environment variable loading
    - Add configuration validation
    - _Requirements: 14.1, 14.2, 14.3, 15.3, 15.7_

  - [x] 3.2 Implement table extraction functions
    - Write extractUsers() function
    - Write extractRecipes() function
    - Write extractIngredients() function
    - Write extractInstructions() function
    - Write extractTags() and extractRecipeTags() functions
    - Add progress tracking for each table
    - _Requirements: 1.2, 1.3, 14.6, 14.7_

  - [x] 3.3 Create export metadata generator
    - Generate checksums for exported files
    - Create export metadata JSON with record counts
    - Create manifest file
    - _Requirements: 1.4, 1.6, 14.8_

  - [x] 3.4 Build main extraction orchestrator
    - Coordinate SSH tunnel setup
    - Execute table extractions in sequence
    - Handle errors and cleanup
    - Display summary and next steps
    - _Requirements: 1.8, 14.8, 14.9, 14.10, 14.11, 14.12_

- [x] 4. Implement user transformation
  - [x] 4.1 Create user transformer module
    - Define legacy and transformed user interfaces
    - Implement UUID generation for users
    - Map username to name field with fallback to email prefix
    - Map super_user flag to role field
    - Set default values for new fields
    - Preserve timestamps
    - _Requirements: 2.8, 2.9, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.13_

  - [x] 4.2 Create user mapping table generator
    - Generate legacy_id → new_uuid mapping
    - Include email for reference
    - Save mapping to JSON file
    - _Requirements: 9.8_

  - [ ]* 4.3 Write unit tests for user transformation
    - Test UUID generation
    - Test username to name mapping
    - Test super_user to role mapping
    - Test default value assignment
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Implement recipe transformation
  - [x] 5.1 Create recipe transformer module
    - Define legacy and transformed recipe interfaces
    - Implement UUID generation for recipes
    - Map recipe fields (name → title, etc.)
    - Convert time fields to integer minutes
    - Set default values for new fields
    - _Requirements: 2.1, 2.2, 2.3, 2.8, 2.9_

  - [x] 5.2 Implement ingredient aggregation and parsing
    - Group ingredients by recipe_id
    - Sort by order_number
    - Integrate with recipe-import-normalizer.ts
    - Generate UUIDs for ingredients
    - Handle parse failures gracefully
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 5.3 Implement instruction aggregation and cleaning
    - Group instructions by recipe_id
    - Sort by step_number
    - Clean HTML using html-to-text library
    - Normalize whitespace
    - Generate UUIDs for instructions
    - Handle empty instructions
    - _Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 5.4 Implement tag aggregation
    - Join recipe_tags and tags tables
    - Create text array for recipe tags
    - _Requirements: 2.6_

  - [x] 5.5 Implement user ID mapping
    - Map legacy user_id to new UUID using user mapping table
    - Handle unmapped users
    - _Requirements: 2.7, 9.8, 9.11_

  - [x] 5.6 Create transformation report generator
    - Track transformation statistics
    - Log unparseable items
    - Generate transformation report JSON
    - _Requirements: 2.10_

  - [ ]* 5.7 Write unit tests for recipe transformation
    - Test time conversion logic
    - Test ingredient parsing integration
    - Test HTML cleaning
    - Test user ID mapping
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 6. Implement validation layer
  - [x] 6.1 Create recipe validator using Zod schemas
    - Import existing Zod schemas from recipe-sections.ts
    - Implement validateRecipe() function
    - Classify results as PASS/WARN/FAIL
    - Generate detailed error messages
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 6.2 Implement duplicate detection
    - Create title normalization function
    - Implement exact title matching
    - Implement title + ingredient matching
    - Implement fuzzy title matching
    - Generate duplicate groups with confidence levels
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 6.3 Create validation report generator
    - Separate recipes into PASS/WARN/FAIL categories
    - Generate validation statistics
    - Create duplicates report
    - Save categorized recipes to separate JSON files
    - _Requirements: 5.10, 6.4_

  - [ ]* 6.4 Write unit tests for validation
    - Test PASS/WARN/FAIL classification
    - Test duplicate detection algorithms
    - Test Zod schema integration
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3_

- [x] 7. Implement import layer
  - [x] 7.1 Create batch importer with API integration
    - Implement batch processing logic
    - Create API client for POST /api/recipes
    - Add delay between batches
    - Implement retry logic with exponential backoff
    - Handle API errors (4xx vs 5xx)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.2, 13.3, 13.4_

  - [x] 7.2 Implement idempotency checking
    - Check if recipe already imported (by legacy ID)
    - Skip existing recipes
    - Update ID mapping table
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.3 Implement user import logic
    - Check if user exists by email
    - Create user if not exists
    - Update user mapping table
    - _Requirements: 9.9, 9.10_

  - [x] 7.4 Create dry-run mode
    - Validate request payloads without sending
    - Simulate API calls
    - Generate "would import" report
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 7.5 Implement progress tracking and checkpoints
    - Create ProgressTracker class
    - Save checkpoint after each batch
    - Enable resumption from last checkpoint
    - _Requirements: 7.6, 7.7_

  - [x] 7.6 Create import report generator
    - Log all import successes and failures
    - Generate import statistics
    - Create ID mapping file (legacy_id → new_uuid)
    - _Requirements: 11.5_

  - [ ]* 7.7 Write integration tests for import
    - Test API integration with mock server
    - Test batch processing
    - Test retry logic
    - Test idempotency
    - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2, 8.4, 8.5_

- [x] 8. Implement error handling and logging
  - [x] 8.1 Create error classification system
    - Define MigrationError class with categories
    - Implement error categorization logic
    - _Requirements: 13.8_

  - [x] 8.2 Implement retry mechanism
    - Create withRetry() utility function
    - Implement exponential backoff
    - Add retry limits per error category
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 8.3 Create structured logging system
    - Implement JSON logging format
    - Add log levels (DEBUG, INFO, WARN, ERROR)
    - Write logs to console and file
    - Add timestamps to all log entries
    - _Requirements: 11.1, 11.6, 11.8, 11.9_

  - [x] 8.4 Implement error recovery
    - Save state on critical errors
    - Enable graceful shutdown
    - Support stop-on-error vs continue-on-error modes
    - _Requirements: 13.5, 13.6, 13.7_

- [x] 9. Create orchestration and CLI
  - [x] 9.1 Build main migration orchestrator
    - Coordinate all four phases (ETVI)
    - Handle phase transitions
    - Display progress for each phase
    - Generate final summary report
    - _Requirements: 11.7_

  - [x] 9.2 Create CLI interface
    - Implement command-line argument parsing
    - Support phase-specific commands (extract, transform, validate, import)
    - Add --dry-run flag
    - Add --config flag for custom config file
    - Display help text and usage examples
    - _Requirements: 14.1, 14.2, 15.6, 15.7, 15.8_

  - [x] 9.3 Create configuration file loader
    - Load configuration from file and environment variables
    - Merge configurations with precedence
    - Validate all configuration values
    - Display configuration summary before starting
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8_

- [x] 10. Implement verification and reporting
  - [x] 10.1 Create post-migration verification script
    - Compare record counts between legacy and new databases
    - Perform spot-checks on random recipes
    - Validate required fields are populated
    - Check for HTML/encoding artifacts
    - Validate ordering preservation
    - Validate tag associations
    - Validate user ownership mapping
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 10.2 Create comprehensive report generator
    - Generate extraction report
    - Generate transformation report
    - Generate validation report
    - Generate import report
    - Generate verification report
    - Create summary report with overall statistics
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.7, 12.8, 12.9_

- [x] 11. Create documentation and examples
  - [x] 11.1 Write migration setup guide
    - Document SSH key setup
    - Document environment variable configuration
    - Document prerequisite installation
    - Provide troubleshooting tips
    - _Requirements: 14.9_

  - [x] 11.2 Create example configuration files
    - Provide .env.migration.example
    - Provide migration-config.example.json
    - Document all configuration options
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 11.3 Write execution runbook
    - Document step-by-step execution process
    - Include dry-run testing steps
    - Document rollback procedures
    - Provide verification checklist
    - _Requirements: 12.8, 12.9_

  - [x] 11.4 Create npm scripts
    - Add migration:extract script
    - Add migration:transform script
    - Add migration:validate script
    - Add migration:import script
    - Add migration:verify script
    - Add migration:all script (full pipeline)
    - _Requirements: 14.1_
