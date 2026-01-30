# Legacy Recipe Migration - Documentation Index

Welcome to the legacy recipe migration documentation. This index helps you find the right documentation for your needs.

## Quick Start

**New to the migration?** Start here:

1. 📖 [README.md](./README.md) - Overview and introduction
2. 🔧 [SETUP-GUIDE.md](./SETUP-GUIDE.md) - Complete setup instructions
3. ⚙️ [CONFIGURATION.md](./CONFIGURATION.md) - Configuration reference
4. 📋 [EXECUTION-RUNBOOK.md](./EXECUTION-RUNBOOK.md) - Step-by-step execution guide
5. ✅ [Verification Checklist](#verification-checklist) - Post-migration verification

## Documentation by Role

### For System Administrators

Setting up the migration environment:

- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - SSH keys, environment variables, prerequisites
- **[CONFIGURATION.md](./CONFIGURATION.md)** - All configuration options explained
- **[CONFIG.md](./CONFIG.md)** - Additional configuration details

### For Migration Engineers

Running the migration:

- **[EXECUTION-RUNBOOK.md](./EXECUTION-RUNBOOK.md)** - Complete step-by-step process
- **[CLI-QUICK-START.md](./CLI-QUICK-START.md)** - Command-line usage examples
- **[NPM-SCRIPTS.md](./NPM-SCRIPTS.md)** - All available npm scripts

### For Developers

Understanding the implementation:

- **[README.md](./README.md)** - Architecture overview
- **Task Implementation Docs**:
  - [TASK-2-IMPLEMENTATION.md](./TASK-2-IMPLEMENTATION.md) - SSH tunnel and database connection
  - [TASK-3-IMPLEMENTATION.md](./TASK-3-IMPLEMENTATION.md) - Extraction script
  - [TASK-4-IMPLEMENTATION.md](./TASK-4-IMPLEMENTATION.md) - User transformation
  - [TASK-5-IMPLEMENTATION.md](./TASK-5-IMPLEMENTATION.md) - Recipe transformation
  - [TASK-6-IMPLEMENTATION.md](./TASK-6-IMPLEMENTATION.md) - Validation layer
  - [TASK-7-IMPLEMENTATION.md](./TASK-7-IMPLEMENTATION.md) - Import layer
  - [TASK-8-IMPLEMENTATION.md](./TASK-8-IMPLEMENTATION.md) - Error handling
  - [TASK-9-IMPLEMENTATION.md](./TASK-9-IMPLEMENTATION.md) - Orchestration and CLI
  - [TASK-10-IMPLEMENTATION.md](./TASK-10-IMPLEMENTATION.md) - Verification and reporting

### For QA/Testing

Verifying the migration:

- **[EXECUTION-RUNBOOK.md](./EXECUTION-RUNBOOK.md)** - Verification checklist section
- **[verify/README.md](./verify/README.md)** - Verification system documentation
- **[verify/USAGE.md](./verify/USAGE.md)** - How to use verification tools

## Documentation by Phase

### Phase 1: Setup

1. [SETUP-GUIDE.md](./SETUP-GUIDE.md) - Complete setup instructions
   - Prerequisites
   - SSH key setup
   - Environment configuration
   - Installation
   - Troubleshooting

2. [CONFIGURATION.md](./CONFIGURATION.md) - Configuration reference
   - All configuration options
   - Environment variables
   - JSON configuration
   - Security best practices

### Phase 2: Extraction

1. [EXTRACTION-GUIDE.md](./EXTRACTION-GUIDE.md) - Extraction process details
2. [extract/README.md](./extract/README.md) - Extraction module documentation
3. [TASK-3-IMPLEMENTATION.md](./TASK-3-IMPLEMENTATION.md) - Implementation details

### Phase 3: Transformation

1. [transform/USAGE.md](./transform/USAGE.md) - Transformation usage guide
2. [TASK-4-IMPLEMENTATION.md](./TASK-4-IMPLEMENTATION.md) - User transformation
3. [TASK-5-IMPLEMENTATION.md](./TASK-5-IMPLEMENTATION.md) - Recipe transformation

### Phase 4: Validation

1. [validate/README.md](./validate/README.md) - Validation system documentation
2. [validate/USAGE.md](./validate/USAGE.md) - Validation usage guide
3. [TASK-6-IMPLEMENTATION.md](./TASK-6-IMPLEMENTATION.md) - Implementation details

### Phase 5: Import

1. [import/README.md](./import/README.md) - Import system documentation
2. [import/USAGE.md](./import/USAGE.md) - Import usage guide
3. [TASK-7-IMPLEMENTATION.md](./TASK-7-IMPLEMENTATION.md) - Implementation details

### Phase 6: Verification

1. [verify/README.md](./verify/README.md) - Verification system documentation
2. [verify/USAGE.md](./verify/USAGE.md) - Verification usage guide
3. [TASK-10-IMPLEMENTATION.md](./TASK-10-IMPLEMENTATION.md) - Implementation details

## Documentation by Topic

### Configuration

- **[CONFIGURATION.md](./CONFIGURATION.md)** - Complete configuration reference
- **[CONFIG.md](./CONFIG.md)** - Additional configuration details
- **[.env.migration.example](../../.env.migration.example)** - Environment variable template
- **[migration-config.example.json](../../migration-config.example.json)** - JSON config template

### Command-Line Usage

- **[CLI-QUICK-START.md](./CLI-QUICK-START.md)** - Quick command examples
- **[NPM-SCRIPTS.md](./NPM-SCRIPTS.md)** - All npm scripts explained
- **[cli.ts](./cli.ts)** - CLI implementation

### Error Handling

- **[utils/ERROR-HANDLING.md](./utils/ERROR-HANDLING.md)** - Error handling guide
- **[utils/QUICK-REFERENCE.md](./utils/QUICK-REFERENCE.md)** - Quick reference for utilities
- **[TASK-8-IMPLEMENTATION.md](./TASK-8-IMPLEMENTATION.md)** - Error handling implementation

### Troubleshooting

- **[SETUP-GUIDE.md](./SETUP-GUIDE.md)** - Setup troubleshooting section
- **[EXECUTION-RUNBOOK.md](./EXECUTION-RUNBOOK.md)** - Execution troubleshooting section
- **[utils/ERROR-HANDLING.md](./utils/ERROR-HANDLING.md)** - Error handling strategies

## Example Files

### Configuration Examples

- **[.env.migration.example](../../.env.migration.example)** - Environment variables template
- **[migration-config.example.json](../../migration-config.example.json)** - JSON configuration template

### Usage Examples

- **[utils/connection-example.ts](./utils/connection-example.ts)** - SSH and database connection
- **[utils/error-handling-example.ts](./utils/error-handling-example.ts)** - Error handling patterns
- **[extract/extract-legacy-data.ts](./extract/extract-legacy-data.ts)** - Extraction example
- **[transform/transform-users-example.ts](./transform/transform-users-example.ts)** - User transformation
- **[transform/transform-recipes-example.ts](./transform/transform-recipes-example.ts)** - Recipe transformation
- **[validate/validate-recipes-example.ts](./validate/validate-recipes-example.ts)** - Validation example
- **[import/import-recipes-example.ts](./import/import-recipes-example.ts)** - Import example
- **[verify/verify-example.ts](./verify/verify-example.ts)** - Verification example

## Module Documentation

### Core Modules

- **[extract/README.md](./extract/README.md)** - Extraction module
- **[transform/USAGE.md](./transform/USAGE.md)** - Transformation module
- **[validate/README.md](./validate/README.md)** - Validation module
- **[import/README.md](./import/README.md)** - Import module
- **[verify/README.md](./verify/README.md)** - Verification module

### Utility Modules

- **[utils/README.md](./utils/README.md)** - Utility functions
- **[utils/QUICK-REFERENCE.md](./utils/QUICK-REFERENCE.md)** - Quick reference guide
- **[types/](./types/)** - TypeScript type definitions

## Quick Reference

### Essential Commands

```bash
# Complete migration
npm run migration:all

# Individual phases
npm run migration:extract
npm run migration:transform
npm run migration:validate
npm run migration:import -- --dry-run
npm run migration:import
npm run migration:verify

# Utilities
npm run migration:validate-config
npm run migration:show-config
npm run migration:test-connection
npm run migration:report
```

### Essential Files

| File | Purpose |
|------|---------|
| `.env.migration` | Environment configuration (create from example) |
| `migration-config.json` | JSON configuration (optional) |
| `migration-data/` | All migration data and logs |
| `src/migration/cli.ts` | Main CLI entry point |
| `src/migration/orchestrator.ts` | Migration orchestrator |

### Essential Directories

| Directory | Contents |
|-----------|----------|
| `migration-data/raw/` | Extracted legacy data |
| `migration-data/transformed/` | Transformed data |
| `migration-data/validated/` | Validated data |
| `migration-data/imported/` | Import results |
| `migration-data/logs/` | Log files |
| `migration-data/progress/` | Progress checkpoints |

## Verification Checklist

After migration, verify:

- [ ] Record counts match expectations
- [ ] Spot-check 20+ random recipes in UI
- [ ] No HTML artifacts in text fields
- [ ] Ingredient ordering preserved
- [ ] Instruction ordering preserved
- [ ] User ownership correct
- [ ] Tags associated correctly
- [ ] Images display (if migrated)
- [ ] Search functionality works
- [ ] Recipe editing works

See [EXECUTION-RUNBOOK.md](./EXECUTION-RUNBOOK.md) for detailed verification steps.

## Getting Help

### Documentation Issues

If documentation is unclear or missing:

1. Check the [README.md](./README.md) for overview
2. Search for keywords in this index
3. Review related implementation docs
4. Check example files for usage patterns

### Migration Issues

If you encounter problems during migration:

1. Check logs in `migration-data/logs/`
2. Review troubleshooting sections in:
   - [SETUP-GUIDE.md](./SETUP-GUIDE.md)
   - [EXECUTION-RUNBOOK.md](./EXECUTION-RUNBOOK.md)
3. Enable debug logging: `MIGRATION_LOG_LEVEL=DEBUG`
4. Review error handling docs: [utils/ERROR-HANDLING.md](./utils/ERROR-HANDLING.md)

### Technical Questions

For technical implementation questions:

1. Review task implementation docs (TASK-*-IMPLEMENTATION.md)
2. Check module README files
3. Review example files
4. Check TypeScript type definitions in `types/`

## Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| README.md | ✅ Complete | 2026-01-24 |
| SETUP-GUIDE.md | ✅ Complete | 2026-01-25 |
| CONFIGURATION.md | ✅ Complete | 2026-01-25 |
| EXECUTION-RUNBOOK.md | ✅ Complete | 2026-01-25 |
| NPM-SCRIPTS.md | ✅ Complete | 2026-01-25 |
| CLI-QUICK-START.md | ✅ Complete | 2026-01-25 |
| All Task Implementation Docs | ✅ Complete | 2026-01-25 |
| All Module READMEs | ✅ Complete | 2026-01-25 |

## Contributing to Documentation

When updating documentation:

1. Keep this index updated
2. Update "Last Updated" dates
3. Add new documents to appropriate sections
4. Update related documents for consistency
5. Include examples where helpful
6. Keep troubleshooting sections current

## License

This documentation is part of the Jump to Recipe project.
