# DSIP Scraper System

## Overview

The DSIP Scraper System provides automated data collection from the DoD SBIR/STTR database, replacing manual CSV imports with a reliable, real-time scraping solution.

## Features

### 🚀 Full Refresh
- **Runtime**: 5-6 hours
- **Scope**: All 81,000+ opportunities
- **Use Case**: Complete database rebuild
- **Frequency**: Monthly or as needed

### ⚡ Quick Check
- **Runtime**: 10-30 minutes
- **Scope**: Recent/active opportunities only
- **Use Case**: Daily updates
- **Frequency**: Daily or weekly

## How It Works

1. **Session Initialization**: Establishes connection to DoD SBIR/STTR website
2. **Data Fetching**: Retrieves opportunity data via API endpoints
3. **Detail Processing**: Fetches comprehensive information for each opportunity
4. **Database Update**: Directly updates Supabase database
5. **Progress Tracking**: Real-time monitoring with detailed logs

## Admin Dashboard Controls

### Scraper Controls Section
- **Full Refresh Button**: Start complete database rebuild
- **Quick Check Button**: Update recent opportunities
- **Stop Button**: Halt running scraper
- **Status Display**: Real-time scraper status

### Progress Monitoring
- **Progress Bar**: Visual completion indicator
- **Topic Counter**: Processed vs. total topics
- **Live Logs**: Real-time scraping activity
- **Status Updates**: Running, completed, or failed states

## API Endpoints

### POST `/api/dsip/scraper`
Start or stop scraper operations.

**Request Body:**
```json
{
  "action": "start" | "stop",
  "type": "full" | "quick"  // Only for "start" action
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "full_1234567890",
  "message": "Full refresh started. This will take 5-6 hours to complete."
}
```

### GET `/api/dsip/scraper`
Get current scraper status and job information.

**Response:**
```json
{
  "success": true,
  "isRunning": true,
  "currentJob": {
    "id": "full_1234567890",
    "status": "running",
    "type": "full",
    "progress": 45,
    "totalTopics": 81250,
    "processedTopics": 36562,
    "startTime": "2025-08-30T16:30:00.000Z",
    "logs": ["[INFO] Processing topic 36562/81250..."]
  },
  "status": "running"
}
```

## Database Schema

The scraper updates the `dsip_opportunities` table with the following key fields:

- `topic_number_topiccode`: Unique topic identifier
- `title_topictitle`: Opportunity title
- `component_component`: Military component (Army, Navy, etc.)
- `status_topicstatus`: Current status (Open, Closed, etc.)
- `last_scraped_sys_current_timestamp_eastern`: Last update timestamp

## Error Handling

- **Network Failures**: Automatic retry with exponential backoff
- **Rate Limiting**: Built-in delays between requests
- **Data Validation**: Comprehensive error checking
- **Logging**: Detailed activity logs for debugging

## Monitoring & Maintenance

### Daily Operations
- Check scraper status in admin dashboard
- Review recent logs for any errors
- Monitor database record counts

### Weekly Operations
- Run quick check for new opportunities
- Review scraper performance metrics
- Check for any failed jobs

### Monthly Operations
- Run full refresh to ensure data completeness
- Review and clean old logs
- Update scraper configuration if needed

## Security Considerations

- **Admin Only**: Scraper controls restricted to admin users
- **Rate Limiting**: Built-in delays prevent overwhelming target servers
- **Error Logging**: Comprehensive logging for audit trails
- **Session Management**: Secure session handling

## Troubleshooting

### Common Issues

1. **Scraper Won't Start**
   - Check admin permissions
   - Verify API endpoint accessibility
   - Check browser console for errors

2. **Scraper Hangs**
   - Check network connectivity
   - Review recent logs for errors
   - Stop and restart scraper

3. **Database Errors**
   - Verify Supabase connection
   - Check table schema compatibility
   - Review error logs

### Performance Optimization

- **Full Refresh**: Run during off-peak hours
- **Quick Check**: Schedule for daily maintenance windows
- **Log Rotation**: Monitor log file sizes
- **Memory Usage**: Watch for memory leaks during long runs

## Future Enhancements

- **Scheduled Scraping**: Automated daily/weekly runs
- **Incremental Updates**: Smart detection of changed records
- **Performance Metrics**: Detailed timing and success rate tracking
- **Alert System**: Notifications for failed jobs or completion
- **Data Validation**: Enhanced quality checks and reporting

## Support

For technical support or questions about the scraper system:
1. Check the admin dashboard logs
2. Review this documentation
3. Contact system administrator
4. Check GitHub issues for known problems
