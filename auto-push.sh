#!/bin/bash

# Auto-push script for PropShop AI Website
echo "🔄 Auto-pushing changes..."

# Add all changes
git add .

# Get current timestamp for commit message
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# Commit with timestamp
git commit -m "Auto-commit: $timestamp - $(git status --porcelain | head -c 50)"

# Push to remote
git push

echo "✅ Changes pushed successfully!"
echo "📅 Timestamp: $timestamp"
