#!/data/data/com.termux/files/usr/bin/bash
# SkillSwap 5.0 - Direct Phone / Termux Sync & Push Script
# Run directly in Termux with: bash push_to_github.sh

set -e

echo "=========================================="
echo "  SkillSwap 5.0 Termux -> GitHub Sync    "
echo "=========================================="

# 1. Ensure git and curl are available
if ! command -v git &> /dev/null; then
    echo "[!] Installing git..."
    pkg update -y && pkg install git -y
fi

if ! command -v unzip &> /dev/null; then
    echo "[!] Installing unzip..."
    pkg install unzip -y
fi

# 2. Check Git repo configuration
if [ ! -d ".git" ]; then
    echo "[+] Initializing git repository..."
    git init
    git branch -M main
fi

# 3. Check / prompt for GitHub remote if not set
REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
if [ -z "$REMOTE_URL" ]; then
    echo ""
    read -p "Enter your GitHub Repo URL (e.g. https://github.com/mosesmasaa793/skillswap.git): " GITHUB_URL
    if [ -n "$GITHUB_URL" ]; then
        git remote add origin "$GITHUB_URL"
    else
        echo "[!] No remote provided. Exiting."
        exit 1
    fi
else
    echo "[i] Using existing origin: $REMOTE_URL"
fi

# 4. Stage, commit, and push
echo "[+] Staging updated files..."
git add -A

COMMIT_MSG="feat: add unified multi-gateway payments (M-Pesa, Stripe, PayPal) with wallet sync"
echo "[+] Committing changes..."
git commit -m "$COMMIT_MSG" || echo "[i] No new changes to commit."

echo "[+] Pushing to GitHub main branch..."
echo "[i] Note: When prompted for password, paste your GitHub Personal Access Token (PAT)."
git push -u origin main

echo ""
echo "=========================================="
echo "  Success! SkillSwap is live on GitHub!  "
echo "=========================================="
