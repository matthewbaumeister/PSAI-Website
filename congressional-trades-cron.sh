#!/bin/bash
#
# Congressional Trades Cron Job Entry
# Add this to your crontab to run monthly on the 15th
#

# Monthly update on 15th at 2 AM
0 2 15 * * cd /Users/matthewbaumeister/Documents/PropShop_AI_Website && ./scripts/scrape_congress_trades_monthly.sh

# Alternative times (choose one):
# 0 2 15 * *   - 2:00 AM on the 15th
# 0 8 15 * *   - 8:00 AM on the 15th
# 0 14 15 * *  - 2:00 PM on the 15th
# 0 20 15 * *  - 8:00 PM on the 15th


