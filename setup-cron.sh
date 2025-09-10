#!/bin/bash

# SBIR Database Automated Update Cron Job Setup
# This script sets up a daily cron job to update the SBIR database at 2:00 AM EST

echo "🔄 Setting up SBIR Database Automated Update Cron Job..."

# Get the current directory (project root)
PROJECT_DIR=$(pwd)
CRON_URL="${NEXT_PUBLIC_SITE_URL:-https://prop-shop.ai}/api/cron/sbir-update"
CRON_SECRET="${CRON_SECRET:-your-secret-key-here}"

# Create the cron job entry
CRON_ENTRY="0 2 * * * curl -X POST '$CRON_URL' -H 'Authorization: Bearer $CRON_SECRET' -H 'Content-Type: application/json' >> /var/log/sbir-update.log 2>&1"

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added successfully!"
echo "📅 Schedule: Daily at 2:00 AM EST"
echo "🔗 Endpoint: $CRON_URL"
echo "📝 Logs: /var/log/sbir-update.log"

echo ""
echo "To verify the cron job was added, run:"
echo "crontab -l"

echo ""
echo "To remove the cron job later, run:"
echo "crontab -e"
echo "Then delete the line containing 'sbir-update'"

echo ""
echo "⚠️  Make sure to set the CRON_SECRET environment variable for security!"
