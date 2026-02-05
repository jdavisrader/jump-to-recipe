# Development Practices & Guidelines

## Environment Compatibility
- **Dual Environment Support**: All code and dependencies MUST work in both:
  - Local development environment
  - Docker containerized environment (see Dockerfile and docker-compose.yml)
- **Package Installation**: When adding npm packages, verify compatibility with both environments
- **Testing**: Test changes locally AND in Docker before considering them complete

## Working Tree Management
- Keep the working tree clean and well-organized
- Remove temporary files, build artifacts, and unused code
- Follow established directory structure conventions
- Use .gitignore appropriately for generated files

## Documentation Standards
- **Location**: All new documentation goes in `/docs/` (root level)
- **Organization**: Use logical folder structure:
  - `docs/deployment/` - Deployment guides and configurations
  - `docs/errors/` - Error logs and troubleshooting
  - `docs/specs/` - Feature specifications
  - `docs/dataMigration/` - Data migration documentation
  - Create new folders as needed for logical grouping
- **Format**: Use clear markdown with proper headings and code blocks

## Destructive Operations
### Critical: `rm -rf` Command Protocol
When `rm -rf` or similar destructive commands are needed:

1. **Full Explanation Required**: Explain exactly what will be deleted and why
2. **Pre-check**: List the contents that will be affected
3. **Explicit Authorization**: Wait for user confirmation before proceeding
4. **Double Check**: Verify the command targets the correct path
5. **Never Auto-execute**: This command requires explicit user approval

Example approach:
```
I need to remove directory X because [reason].
This will delete: [list contents]
Confirm before I proceed?
```

## Code Quality
- Run type checks before committing
- Fix linting errors promptly
- Test in both environments when making infrastructure changes
- Keep dependencies up to date and documented
