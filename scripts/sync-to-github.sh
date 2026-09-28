#!/usr/bin/env bash
# Quick sync bundle generator
zip -q -r /tmp/skillswap-update.zip . -x "node_modules/*" ".git/*" "dist/*" ".cache/*" "/tmp/*"
echo "Bundle created at /tmp/skillswap-update.zip"
