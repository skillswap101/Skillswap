#!/bin/bash

# Ensure we are in the skillswap directory
cd ~/skillswap || { echo "Error: ~/skillswap directory not found!"; exit 1; }

echo "=================================================="
echo " 1. CREATING BACKUP OUTSIDE SKILLSWAP"
echo "=================================================="
BACKUP_DIR="$HOME/skillswap_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Copy everything (including .env and untracked files) to the backup directory
cp -a . "$BACKUP_DIR/"
echo "✅ Full backup saved safely to: $BACKUP_DIR"
echo ""

echo "=================================================="
echo " 2. FETCHING LATEST CHANGES FROM GITHUB"
echo "=================================================="
git fetch origin
echo ""

echo "=================================================="
echo " 3. DIFFERENCES BETWEEN LOCAL TERMUX & GITHUB"
echo "=================================================="
echo "--- Showing git status (modified/untracked files) ---"
git status -s
echo ""
echo "--- Showing detailed line-by-line code diffs ---"
git diff origin/main
echo "=================================================="
echo ""

# Prompt user before overwriting local changes
read -p "Do you want to proceed with resetting local code to match GitHub? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "=================================================="
    echo " 4. SYNCING WITH GITHUB & RESTORING .ENV"
    echo "=================================================="
    
    # Hard reset local repo to match GitHub's main branch cleanly
    git reset --hard origin/main

    # Restore the .env file from the backup folder
    if [ -f "$BACKUP_DIR/.env" ]; then
        cp "$BACKUP_DIR/.env" .env
        echo "✅ .env file successfully restored!"
    else
        echo "⚠️ Warning: No .env file was found in the backup."
    fi

    echo ""
    echo "🎉 Success! Your Termux workspace is now identical to GitHub."
    echo "📁 Your backup is safely stored at: $BACKUP_DIR"
else
    echo ""
    echo "❌ Operation cancelled. Your repository was left untouched."
    echo "📁 Your backup is still safe at: $BACKUP_DIR"
fi
