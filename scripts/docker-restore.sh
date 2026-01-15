#!/bin/bash

# Jump to Recipe - Docker Restore Script
# Restores database and uploads from backup

set -e

if [ -z "$1" ]; then
    echo "Usage: ./docker-restore.sh <timestamp>"
    echo "Example: ./docker-restore.sh 20260114_120000"
    echo ""
    echo "Available backups:"
    ls -1 backups/db_backup_*.sql 2>/dev/null | sed 's/.*db_backup_/  /' | sed 's/.sql//' || echo "  No backups found"
    exit 1
fi

TIMESTAMP=$1
BACKUP_DIR="./backups"

echo "♻️  Jump to Recipe - Restore from Backup"
echo "========================================"

# Check if backup files exist
if [ ! -f "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" ]; then
    echo "❌ Database backup not found: $BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    exit 1
fi

# Restore database
echo "📊 Restoring database..."
docker compose exec -T db psql -U jumptorecipe jump_to_recipe < "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Restore uploads if backup exists
if [ -f "$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz" ]; then
    echo "📁 Restoring uploads..."
    docker run --rm -v jump-to-recipe_uploads:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar xzf /backup/uploads_backup_$TIMESTAMP.tar.gz -C /data
fi

echo ""
echo "✅ Restore complete!"
