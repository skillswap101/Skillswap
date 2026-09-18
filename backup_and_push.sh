#!/bin/bash
set -e

echo "=== 1. Starting Backup Process ==="
# Define backup path outside skillswap directory (in your Termux home folder ~)
BACKUP_DIR="$HOME/skillswap_backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/skillswap_backupps_$(date +%Y%m%d_%H%M%S).tar.gz"

echo "Compressing project files to $BACKUP_FILE..."
# Exclude node_modules, dist, and git history to keep backup clean and small
tar --exclude='node_modules' --exclude='dist' --exclude='.git' -czf "$BACKUP_FILE" .
echo "✅ Backup successfully saved outside skillswap!"

echo "=== 2. Pushing Updates to GitHub ==="
git status
git add .

# Check if there are changes to commit
if git diff-staged --quiet; then
    echo "No new changes to commit."
else
    git commit -m "Automated backup & sync update: $(date)"
    git push origin main
    echo "✅ Successfully pushed updates to GitHub!"
fi

echo "=== All tasks completed successfully! ==="
