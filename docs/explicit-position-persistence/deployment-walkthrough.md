# Explicit Position Persistence - Deployment Walkthrough

## Overview

This document provides a complete walkthrough for safely deploying the explicit-position-persistence feature to production. This feature migrates recipes from implicit position tracking (via array order) to explicit position persistence (via a `position` property on each ingredient and instruction).

### What This Feature Does

- Adds an explicit `position` property to all ingredients and instructions
- Ensures recipe item order is preserved exactly as arranged by users
- Improves data integrity and type safety throughout the application
- Maintains backward compatibility with existing recipes

### Why This Matters

Previously, item order was implicit in array sequence. This created fragile code and type system mismatches. The new explicit position property makes order a first-class attribute that's persisted and validated.

---

## Pre-Deployment Checklist

Before starting deployment, ensure:

- [ ] You have SSH access to the production server
- [ ] You have sudo privileges on the server
- [ ] The application is currently running and accessible
- [ ] You have at least 2GB free disk space for backups
- [ ] You have scheduled a maintenance window (estimated 15-30 minutes)
- [ ] You have tested the migration script on a copy of production data locally
- [ ] All team members are notified of the deployment

---

## Backup Plan

### Database Backup Location

Backups will be stored in: `/home/[your-user]/backups/jump-to-recipe/`

### What Gets Backed Up

1. **Complete database dump** - Full PostgreSQL backup
2. **Docker volumes** - Database volume snapshot
3. **Application code** - Current git commit reference

### Backup Retention

- Keep backups for at least 7 days
- Store backups on a separate disk/partition if possible
- Consider copying critical backups to remote storage


---

## Restore Plan

### If Migration Fails

If the migration encounters critical errors:

1. **Stop the application immediately**
2. **Restore database from backup** (see detailed steps below)
3. **Revert code to previous version**
4. **Restart application with old code**
5. **Investigate migration errors from logs**

### If Application Issues Discovered Post-Deployment

If issues are discovered after deployment but migration succeeded:

1. **Assess severity** - Can users continue working?
2. **If critical**: Follow full restore procedure
3. **If minor**: Document issue and plan hotfix
4. **Note**: Position data can remain in database (backward compatible)

### Full Restore Procedure

Detailed restore commands are provided in the "Emergency Restore" section below.

---

## Summary: Deployment Steps

This is a high-level overview. Detailed instructions follow in the next section.

1. **Backup** - Create complete database and volume backups
2. **Pull Code** - Get latest code with position persistence feature
3. **Install Dependencies** - Update npm packages
4. **Stop Application** - Gracefully stop the app container
5. **Run Migration** - Execute position migration script
6. **Verify Migration** - Check migration report and database
7. **Restart Application** - Start app with new code
8. **Smoke Test** - Verify critical functionality works
9. **Monitor** - Watch logs and error rates for 30 minutes

**Estimated Total Time**: 15-30 minutes

**Rollback Time** (if needed): 5-10 minutes

---

## Detailed Walkthrough

### Step 1: Create Backup Directory

**What this does**: Creates a timestamped directory for all backup files.

**Commands**:
```bash
# Create backup directory with timestamp
BACKUP_DIR="$HOME/backups/jump-to-recipe/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory: $BACKUP_DIR"
```

**Expected outcome**:
- Directory created at `/home/[user]/backups/jump-to-recipe/[timestamp]/`
- Path printed to terminal for reference

**Verification**:
```bash
ls -la "$BACKUP_DIR"
```

You should see an empty directory.

---

### Step 2: Backup Database (SQL Dump)

**What this does**: Creates a complete SQL dump of the PostgreSQL database.

**Commands**:
```bash
# Navigate to project directory
cd ~/jump-to-recipe-project

# Create SQL dump
docker-compose exec -T db pg_dump -U jumptorecipe jump_to_recipe > "$BACKUP_DIR/database-backup.sql"

# Verify backup was created
ls -lh "$BACKUP_DIR/database-backup.sql"
```

**Expected outcome**:
- File `database-backup.sql` created in backup directory
- File size should be > 0 bytes (typically several KB to MB depending on data)
- No error messages during dump

**Verification**:
```bash
# Check file size (should not be 0)
du -h "$BACKUP_DIR/database-backup.sql"

# Check first few lines (should show PostgreSQL dump header)
head -n 20 "$BACKUP_DIR/database-backup.sql"
```

You should see SQL commands like `CREATE TABLE`, `INSERT INTO`, etc.

**If this fails**:
- Check database container is running: `docker-compose ps db`
- Check database credentials in `.env` file
- Try with more verbose output: `docker-compose exec db pg_dump -U jumptorecipe -v jump_to_recipe`


---

### Step 3: Backup Docker Volume

**What this does**: Creates a tarball backup of the PostgreSQL data volume.

**Commands**:
```bash
# Stop the application (keep database running)
docker-compose stop app

# Create volume backup
docker run --rm \
  -v jump-to-recipe-project_postgres_data:/data \
  -v "$BACKUP_DIR":/backup \
  ubuntu tar czf /backup/postgres-volume-backup.tar.gz -C /data .

# Verify backup was created
ls -lh "$BACKUP_DIR/postgres-volume-backup.tar.gz"
```

**Expected outcome**:
- File `postgres-volume-backup.tar.gz` created in backup directory
- File size should be > 0 bytes
- Application container stopped, database still running

**Verification**:
```bash
# Check file exists and has content
du -h "$BACKUP_DIR/postgres-volume-backup.tar.gz"

# Verify app is stopped, db is running
docker-compose ps
```

You should see `app` in "Exit" state and `db` in "Up" state.

---

### Step 4: Record Current Git Commit

**What this does**: Saves the current code version for potential rollback.

**Commands**:
```bash
# Record current commit
git rev-parse HEAD > "$BACKUP_DIR/git-commit.txt"
git log -1 --oneline >> "$BACKUP_DIR/git-commit.txt"

# Display for reference
cat "$BACKUP_DIR/git-commit.txt"
```

**Expected outcome**:
- File contains current git commit hash and message
- You can see the commit information in terminal

**Verification**:
```bash
cat "$BACKUP_DIR/git-commit.txt"
```

Should show something like:
```
abc123def456...
abc123d Fix: some previous feature
```

---

### Step 5: Pull Latest Code

**What this does**: Updates code to include the explicit-position-persistence feature.

**Commands**:
```bash
# Ensure you're on master branch
git branch

# Pull latest code
git pull origin master

# Verify you got the new code
git log -1 --oneline
```

**Expected outcome**:
- Code updated successfully
- No merge conflicts
- Latest commit includes position persistence changes

**Verification**:
```bash
# Check migration script exists
ls -la jump-to-recipe/src/db/migrations/migrate-explicit-positions.ts

# Check for position property in types
grep -n "position: number" jump-to-recipe/src/types/recipe.ts
```

Both files should exist and show position-related code.

**If this fails**:
- Resolve any merge conflicts
- Ensure you're on the correct branch
- Check git remote is configured: `git remote -v`

---

### Step 6: Install Dependencies

**What this does**: Updates npm packages to include any new dependencies.

**Commands**:
```bash
# Navigate to app directory
cd jump-to-recipe

# Install dependencies
npm install

# Return to project root
cd ..
```

**Expected outcome**:
- Dependencies installed successfully
- No error messages
- `node_modules` directory updated

**Verification**:
```bash
# Check for migration script dependencies
cd jump-to-recipe
npm list drizzle-orm
cd ..
```

Should show drizzle-orm version installed.

---

### Step 7: Run Database Migration

**What this does**: Executes the migration script to add position properties to all recipes.

**Commands**:
```bash
# Navigate to app directory
cd jump-to-recipe

# Run migration script
npx tsx src/db/migrations/migrate-explicit-positions.ts

# Return to project root
cd ..
```

**Expected outcome**:
- Migration starts with header display
- Progress updates every 100 recipes
- Summary shows:
  - Total recipes processed
  - Recipes updated (those needing positions)
  - Recipes skipped (already had positions)
  - Errors (should be 0)
  - Success rate (should be 100%)
- Migration report saved to `jump-to-recipe/migration-reports/migration-report-[timestamp].json`

**Example output**:
```
╔════════════════════════════════════════════════════════════╗
║   Recipe Position Migration - Add Explicit Positions      ║
╚════════════════════════════════════════════════════════════╝

🔍 Fetching recipes from database...
📦 Found 150 recipes to process

🚀 Starting migration...

📊 Progress: 100 processed | 95 updated | 5 skipped | 0 errors | 25 recipes/sec
📊 Progress: 150 processed | 142 updated | 8 skipped | 0 errors | 30 recipes/sec

╔════════════════════════════════════════════════════════════╗
║                   Migration Summary                        ║
╚════════════════════════════════════════════════════════════╝

📊 Total Recipes Processed:  150
✅ Recipes Updated:          142
⏭️  Recipes Skipped:          8 (already had positions)
❌ Errors:                   0
⏱️  Duration:                 5s
📈 Success Rate:             100.00%

╔════════════════════════════════════════════════════════════╗
║                   Detailed Statistics                      ║
╚════════════════════════════════════════════════════════════╝

🥕 Flat Ingredients Updated:        85
📝 Flat Instructions Updated:       90
📦 Ingredient Sections Updated:     45
📋 Instruction Sections Updated:    50

📄 Full report saved to: /path/to/migration-reports/migration-report-2026-02-15T12-30-45.json

✅ Migration completed successfully!
```

**Verification**:
```bash
# Check migration report exists
ls -la jump-to-recipe/migration-reports/

# View migration report
cat jump-to-recipe/migration-reports/migration-report-*.json | jq .summary
```

**Critical checks**:
- ✅ Success rate should be 100%
- ✅ Errors should be 0
- ✅ Processed count should match your recipe count
- ⚠️ If errors > 0, review error details before proceeding

**If migration has errors**:
```bash
# View detailed error information
cat jump-to-recipe/migration-reports/migration-report-*.json | jq .errors

# Check application logs
docker-compose logs db | tail -50
```

**Decision point**: If errors > 0, assess severity:
- **Minor errors** (1-2 recipes, non-critical): Document and proceed
- **Major errors** (many recipes, critical data): STOP and restore from backup


---

### Step 8: Verify Migration in Database

**What this does**: Directly checks the database to confirm position properties were added.

**Commands**:
```bash
# Connect to database and check a sample recipe
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "
  SELECT 
    id, 
    title,
    jsonb_array_length(ingredients) as ingredient_count,
    ingredients->0->>'position' as first_ingredient_position,
    instructions->0->>'position' as first_instruction_position
  FROM recipes 
  LIMIT 5;
"
```

**Expected outcome**:
- Query returns 5 recipes
- `first_ingredient_position` column shows "0" (not null)
- `first_instruction_position` column shows "0" (not null)

**Example output**:
```
 id                                   | title           | ingredient_count | first_ingredient_position | first_instruction_position
--------------------------------------+-----------------+------------------+---------------------------+----------------------------
 123e4567-e89b-12d3-a456-426614174000 | Chocolate Cake  |                8 | 0                         | 0
 223e4567-e89b-12d3-a456-426614174001 | Pasta Carbonara |                6 | 0                         | 0
 ...
```

**Additional verification**:
```bash
# Check that all ingredients have position property
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "
  SELECT 
    COUNT(*) as total_recipes,
    COUNT(*) FILTER (
      WHERE ingredients::text LIKE '%\"position\":%'
    ) as recipes_with_positions
  FROM recipes 
  WHERE jsonb_array_length(ingredients) > 0;
"
```

**Expected outcome**:
- `total_recipes` and `recipes_with_positions` should be equal
- This confirms all recipes with ingredients have position properties

**If verification fails**:
- Check migration report for errors
- Re-run migration (it's idempotent)
- If still failing, restore from backup and investigate

---

### Step 9: Rebuild Application Container

**What this does**: Builds a new Docker image with the updated code.

**Commands**:
```bash
# Build new application image
docker-compose build app

# Verify build succeeded
docker images | grep jump-to-recipe
```

**Expected outcome**:
- Build completes without errors
- New image created with recent timestamp
- Build output shows successful compilation

**Verification**:
```bash
# Check image was created
docker images jump-to-recipe-project-app
```

Should show an image with a recent creation time (seconds/minutes ago).

**If build fails**:
- Check for TypeScript compilation errors
- Verify all dependencies installed: `cd jump-to-recipe && npm install`
- Review build logs for specific errors
- Check `.env` file has all required variables

---

### Step 10: Start Application

**What this does**: Starts the application container with the new code.

**Commands**:
```bash
# Start application container
docker-compose up -d app

# Wait a few seconds for startup
sleep 10

# Check container status
docker-compose ps
```

**Expected outcome**:
- Container starts successfully
- Status shows "Up" (not "Restarting" or "Exit")
- No immediate crash or restart loop

**Verification**:
```bash
# Check both containers are running
docker-compose ps

# Should show:
# NAME                    STATUS
# ...db                   Up
# ...app                  Up
```

**If container won't start**:
```bash
# Check logs for errors
docker-compose logs app | tail -50

# Common issues:
# - Missing environment variables
# - Database connection errors
# - Port conflicts
```

---

### Step 11: Monitor Application Startup

**What this does**: Watches logs to ensure application starts successfully.

**Commands**:
```bash
# Follow application logs
docker-compose logs -f app
```

**Expected outcome**:
- Logs show Next.js starting
- Database connection successful
- Server ready message appears
- No error messages or stack traces

**Look for these success indicators**:
```
✓ Ready in [time]
○ Compiling / ...
✓ Compiled / in [time]
- Local:        http://0.0.0.0:3000
```

**Red flags to watch for**:
- ❌ Database connection errors
- ❌ TypeScript compilation errors
- ❌ Missing environment variables
- ❌ Repeated restart attempts

**Stop following logs**: Press `Ctrl+C` (logs continue in background)

**If errors appear**:
```bash
# Save logs for analysis
docker-compose logs app > "$BACKUP_DIR/startup-errors.log"

# Check database connectivity
docker-compose exec app sh -c "nc -zv db 5432"
```

---

### Step 12: Smoke Test - Health Check

**What this does**: Verifies the application is responding to requests.

**Commands**:
```bash
# Test health endpoint
curl -f http://localhost:3000/api/health

# Test homepage
curl -f http://localhost:3000/ | head -20
```

**Expected outcome**:
- Health endpoint returns 200 OK
- Homepage returns HTML content
- No 500 errors or connection refused

**Verification**:
```bash
# More detailed health check
curl -v http://localhost:3000/api/health
```

Should show:
```
< HTTP/1.1 200 OK
< Content-Type: application/json
...
{"status":"ok"}
```

**If health check fails**:
- Wait 30 more seconds (app may still be starting)
- Check logs: `docker-compose logs app | tail -50`
- Verify port 3000 is accessible: `netstat -tlnp | grep 3000`

---

### Step 13: Smoke Test - Recipe Loading

**What this does**: Verifies recipes load correctly with position data.

**Commands**:
```bash
# Test recipe API endpoint (replace with actual recipe ID)
curl -s http://localhost:3000/api/recipes | jq '.[0] | {id, title, ingredients: .ingredients[0:2]}'
```

**Expected outcome**:
- API returns recipe data
- Ingredients include `position` property
- Position values are sequential (0, 1, 2...)

**Example output**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Chocolate Cake",
  "ingredients": [
    {
      "id": "ing-1",
      "name": "Flour",
      "amount": 2,
      "unit": "cups",
      "position": 0
    },
    {
      "id": "ing-2",
      "name": "Sugar",
      "amount": 1,
      "unit": "cup",
      "position": 1
    }
  ]
}
```

**Critical checks**:
- ✅ `position` property exists on each ingredient
- ✅ Position values are numbers (not strings)
- ✅ Position values are sequential starting from 0

**If position is missing**:
- Check migration ran successfully
- Verify database has position data (Step 8)
- Check API response serialization code

---

### Step 14: Smoke Test - Recipe Editing

**What this does**: Verifies drag-and-drop and recipe editing still works.

**Manual test** (requires browser):

1. Open application in browser: `http://[your-server-ip]:3000`
2. Log in with your account
3. Open an existing recipe for editing
4. Try to reorder ingredients by dragging
5. Save the recipe
6. Reload the page
7. Verify ingredient order is preserved

**Expected outcome**:
- Drag-and-drop works smoothly
- Recipe saves without errors
- Order is preserved after reload
- No console errors in browser

**If drag-and-drop fails**:
- Check browser console for JavaScript errors
- Verify position updates are being sent to API
- Check application logs for API errors

---

### Step 15: Monitor for 30 Minutes

**What this does**: Ensures no delayed issues appear after deployment.

**Commands**:
```bash
# Monitor logs in real-time
docker-compose logs -f app

# In another terminal, watch for errors
docker-compose logs app | grep -i error

# Check container health
watch -n 30 'docker-compose ps'
```

**What to watch for**:
- ✅ No error spikes in logs
- ✅ Container stays in "Up" state
- ✅ No memory leaks (check with `docker stats`)
- ✅ Response times remain normal

**Set up monitoring alerts** (if available):
- Error rate threshold
- Response time threshold
- Container restart alerts

**After 30 minutes of stability**:
- Deployment is considered successful
- Can reduce monitoring frequency
- Document any minor issues for follow-up


---

## Emergency Restore Procedures

### When to Use Emergency Restore

Use these procedures if:
- Migration failed with critical errors
- Application won't start after deployment
- Data corruption detected
- Critical functionality broken

### Restore Procedure: Full Rollback

**Time estimate**: 5-10 minutes

#### Step 1: Stop All Containers

```bash
cd ~/jump-to-recipe-project
docker-compose down
```

**Expected outcome**: All containers stopped and removed.

#### Step 2: Restore Database from SQL Dump

```bash
# Start only the database
docker-compose up -d db

# Wait for database to be ready
sleep 10

# Drop existing database (WARNING: destructive)
docker-compose exec db psql -U jumptorecipe -d postgres -c "DROP DATABASE IF EXISTS jump_to_recipe;"

# Recreate database
docker-compose exec db psql -U jumptorecipe -d postgres -c "CREATE DATABASE jump_to_recipe;"

# Restore from backup
cat "$BACKUP_DIR/database-backup.sql" | docker-compose exec -T db psql -U jumptorecipe jump_to_recipe

# Verify restore
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "SELECT COUNT(*) FROM recipes;"
```

**Expected outcome**:
- Database dropped and recreated
- Backup restored successfully
- Recipe count matches pre-migration count

#### Step 3: Revert Code to Previous Version

```bash
# Get previous commit from backup
PREVIOUS_COMMIT=$(head -n 1 "$BACKUP_DIR/git-commit.txt")

# Checkout previous commit
git checkout $PREVIOUS_COMMIT

# Or if you want to stay on master but revert
git revert HEAD --no-commit
git commit -m "Revert: explicit position persistence deployment"
```

**Expected outcome**: Code reverted to pre-deployment state.

#### Step 4: Rebuild and Restart Application

```bash
# Rebuild with old code
docker-compose build app

# Start application
docker-compose up -d app

# Monitor startup
docker-compose logs -f app
```

**Expected outcome**:
- Application builds successfully
- Application starts without errors
- Old functionality restored

#### Step 5: Verify Restore

```bash
# Check application health
curl http://localhost:3000/api/health

# Check recipe count
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "SELECT COUNT(*) FROM recipes;"

# Test recipe loading in browser
```

**Expected outcome**: Application working as before deployment.

---

### Restore Procedure: Database Only

Use this if code is fine but database needs restoration.

```bash
# Stop application (keep database running)
docker-compose stop app

# Restore database (same as Full Rollback Step 2)
docker-compose exec db psql -U jumptorecipe -d postgres -c "DROP DATABASE IF EXISTS jump_to_recipe;"
docker-compose exec db psql -U jumptorecipe -d postgres -c "CREATE DATABASE jump_to_recipe;"
cat "$BACKUP_DIR/database-backup.sql" | docker-compose exec -T db psql -U jumptorecipe jump_to_recipe

# Restart application
docker-compose start app
```

---

### Restore Procedure: Volume Restore

Use this if SQL dump restore fails.

```bash
# Stop all containers
docker-compose down

# Remove corrupted volume
docker volume rm jump-to-recipe-project_postgres_data

# Recreate volume
docker volume create jump-to-recipe-project_postgres_data

# Restore volume from backup
docker run --rm \
  -v jump-to-recipe-project_postgres_data:/data \
  -v "$BACKUP_DIR":/backup \
  ubuntu tar xzf /backup/postgres-volume-backup.tar.gz -C /data

# Start containers
docker-compose up -d
```

---

## Post-Deployment Tasks

### Immediate (Within 1 Hour)

- [ ] Verify all smoke tests pass
- [ ] Check error logs for any issues
- [ ] Test critical user workflows
- [ ] Notify team of successful deployment
- [ ] Update deployment log/wiki

### Within 24 Hours

- [ ] Monitor error rates and performance metrics
- [ ] Review migration report for any warnings
- [ ] Check user feedback for issues
- [ ] Verify backup retention policy
- [ ] Document any issues encountered

### Within 1 Week

- [ ] Archive migration reports
- [ ] Clean up old backups (keep most recent 3)
- [ ] Review and update deployment documentation
- [ ] Schedule follow-up review meeting
- [ ] Plan next deployment if needed

---

## Troubleshooting Common Issues

### Issue: Migration Script Can't Connect to Database

**Symptoms**:
- Error: "Connection refused"
- Error: "ECONNREFUSED"

**Solutions**:
```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db | tail -50

# Verify DATABASE_URL in jump-to-recipe/.env
cat jump-to-recipe/.env | grep DATABASE_URL

# Test connection manually
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "SELECT 1;"
```

---

### Issue: Migration Runs But Shows Errors

**Symptoms**:
- Migration completes but error count > 0
- Some recipes not updated

**Solutions**:
```bash
# Review error details in migration report
cat jump-to-recipe/migration-reports/migration-report-*.json | jq .errors

# Check specific recipe in database
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "
  SELECT id, title, ingredients 
  FROM recipes 
  WHERE id = '[problematic-recipe-id]';
"

# Re-run migration (it's idempotent)
cd jump-to-recipe
npx tsx src/db/migrations/migrate-explicit-positions.ts
cd ..
```

---

### Issue: Application Won't Start After Migration

**Symptoms**:
- Container exits immediately
- Logs show TypeScript errors
- Database connection errors

**Solutions**:
```bash
# Check detailed logs
docker-compose logs app | tail -100

# Verify environment variables
docker-compose config | grep -A 20 app

# Check database connectivity from app
docker-compose exec app sh -c "nc -zv db 5432"

# Rebuild without cache
docker-compose build --no-cache app
docker-compose up -d app
```

---

### Issue: Recipes Load But Position Missing

**Symptoms**:
- API returns recipes without position property
- Drag-and-drop doesn't work

**Solutions**:
```bash
# Verify migration actually ran
ls -la jump-to-recipe/migration-reports/

# Check database directly
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "
  SELECT ingredients->0 FROM recipes LIMIT 1;
"

# If position missing, re-run migration
cd jump-to-recipe
npx tsx src/db/migrations/migrate-explicit-positions.ts
cd ..

# Restart application
docker-compose restart app
```

---

### Issue: Drag-and-Drop Broken After Deployment

**Symptoms**:
- Can't reorder ingredients
- JavaScript errors in browser console
- Position not updating

**Solutions**:
1. Check browser console for errors
2. Verify API is returning position data
3. Check application logs for API errors
4. Clear browser cache and reload
5. Test in incognito/private window

```bash
# Test API response includes position
curl -s http://localhost:3000/api/recipes | jq '.[0].ingredients[0]'

# Should show position property
```

---

## Performance Considerations

### Migration Performance

- **Small databases** (< 100 recipes): < 5 seconds
- **Medium databases** (100-1000 recipes): 5-30 seconds
- **Large databases** (> 1000 recipes): 30-120 seconds

### Expected Resource Usage

- **CPU**: Brief spike during migration (< 1 minute)
- **Memory**: No significant increase
- **Disk**: Minimal increase (position adds ~10 bytes per item)
- **Downtime**: 2-5 minutes (app restart only)

### Optimization Tips

If migration is slow:
- Ensure database has adequate resources
- Check for database locks or long-running queries
- Consider running during low-traffic period
- Monitor with: `docker stats`

---

## Rollback Decision Matrix

| Scenario | Severity | Action | Rollback? |
|----------|----------|--------|-----------|
| Migration errors on 1-2 recipes | Low | Document, fix later | No |
| Migration errors on 10%+ recipes | High | Investigate immediately | Consider |
| Application won't start | Critical | Emergency restore | Yes |
| Drag-and-drop broken | High | Check logs, may be config | Maybe |
| Position missing in API | High | Re-run migration | No |
| Data corruption detected | Critical | Emergency restore | Yes |
| Performance degradation | Medium | Monitor, investigate | Maybe |
| User reports issues | Variable | Assess severity | Depends |

---

## Success Criteria Checklist

Deployment is successful when:

- [x] Migration completed with 0 errors
- [x] All recipes have position properties in database
- [x] Application starts without errors
- [x] Health check endpoint responds
- [x] Recipe API returns position data
- [x] Drag-and-drop functionality works
- [x] Recipe order preserved after save/reload
- [x] No error spikes in logs
- [x] Container remains stable for 30+ minutes
- [x] User workflows function normally

---

## Contact Information

### If You Need Help

- **Check logs first**: `docker-compose logs -f app`
- **Review this document**: Troubleshooting section
- **Check migration report**: `jump-to-recipe/migration-reports/`
- **Review error documentation**: `/docs/errors/`

### Escalation Path

1. Check troubleshooting section above
2. Review migration report for specific errors
3. Consult developer documentation: `/docs/explicit-position-persistence/DEVELOPER_GUIDE.md`
4. If critical issue, execute emergency restore
5. Document issue in `/docs/errors/` for future reference

---

## Appendix: Quick Reference Commands

### Backup Commands
```bash
# Create backup directory
BACKUP_DIR="$HOME/backups/jump-to-recipe/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker-compose exec -T db pg_dump -U jumptorecipe jump_to_recipe > "$BACKUP_DIR/database-backup.sql"

# Backup volume
docker run --rm -v jump-to-recipe-project_postgres_data:/data -v "$BACKUP_DIR":/backup ubuntu tar czf /backup/postgres-volume-backup.tar.gz -C /data .

# Record git commit
git rev-parse HEAD > "$BACKUP_DIR/git-commit.txt"
```

### Deployment Commands
```bash
# Pull code
git pull origin master

# Install dependencies
cd jump-to-recipe && npm install && cd ..

# Stop app
docker-compose stop app

# Run migration
cd jump-to-recipe && npx tsx src/db/migrations/migrate-explicit-positions.ts && cd ..

# Rebuild and restart
docker-compose build app && docker-compose up -d app

# Monitor
docker-compose logs -f app
```

### Verification Commands
```bash
# Check migration report
cat jump-to-recipe/migration-reports/migration-report-*.json | jq .summary

# Check database
docker-compose exec db psql -U jumptorecipe jump_to_recipe -c "SELECT ingredients->0->>'position' FROM recipes LIMIT 5;"

# Test API
curl -s http://localhost:3000/api/recipes | jq '.[0].ingredients[0].position'

# Check health
curl http://localhost:3000/api/health
```

### Restore Commands
```bash
# Full restore
docker-compose down
docker-compose up -d db
sleep 10
docker-compose exec db psql -U jumptorecipe -d postgres -c "DROP DATABASE IF EXISTS jump_to_recipe;"
docker-compose exec db psql -U jumptorecipe -d postgres -c "CREATE DATABASE jump_to_recipe;"
cat "$BACKUP_DIR/database-backup.sql" | docker-compose exec -T db psql -U jumptorecipe jump_to_recipe
git checkout $(head -n 1 "$BACKUP_DIR/git-commit.txt")
docker-compose build app && docker-compose up -d app
```

---

## Document Version

- **Version**: 1.0
- **Last Updated**: 2026-02-15
- **Feature**: Explicit Position Persistence
- **Target Environment**: Ubuntu Server with Docker
- **Estimated Deployment Time**: 15-30 minutes
- **Estimated Rollback Time**: 5-10 minutes

