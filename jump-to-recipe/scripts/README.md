# Jump to Recipe - Application Scripts

This directory contains utility scripts and tools for the Jump to Recipe application.

## Structure

- `utils/` - Utility scripts for development and debugging

## Contents

### Utilities
- `utils/fix-regex-patterns.js` - Regex pattern testing and debugging tool for ingredient parsing

### Migration Scripts
- `migrate-positions.sh` - Database migration script for explicit position persistence (production use)

## Usage

Run utility scripts from the application root:

```bash
# Test regex patterns for ingredient parsing
node scripts/utils/fix-regex-patterns.js

# Run position migration (production)
./scripts/migrate-positions.sh
```

## Related Scripts

See the main project `scripts/` directory for:
- Deployment scripts
- Database setup scripts
- Application management scripts