#!/bin/bash

# Jump to Recipe - Docker Backup Script
# Creates backups of database and uploads

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "💾 Jump to Recipe - Backup"
echo "=========================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
echo "📊 Backing up database..."
docker compose exec -T db pg_dump -U jumptorecipe jump_to_recipe > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

# Backup uploads volume
echo "📁 Backing up uploads..."
docker run --rm -v jump-to-recipe_uploads:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/uploads_backup_$TIMESTAMP.tar.gz -C /data .

echo ""
echo "✅ Backup complete!"
echo "Files saved to: $BACKUP_DIR/"
echo "  - db_backup_$TIMESTAMP.sql"
echo "  - uploads_backup_$TIMESTAMP.tar.gz"
