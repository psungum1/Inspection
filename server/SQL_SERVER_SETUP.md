# SQL Server Setup Guide

## Overview
The real-time monitoring system can work with or without SQL Server:

- **With SQL Server**: Real production data from your database
- **Without SQL Server**: Simulated data for testing and development

## Option 1: Using Simulated Data (Recommended for Testing)

The application automatically detects when SQL Server is not available and switches to simulated data. This allows you to test all real-time features immediately.

### Features Available with Simulated Data:
- ✅ Real-time TCC monitoring (100 records)
- ✅ Real-time PH monitoring (100 records)
- ✅ WebSocket connections
- ✅ Chart and table views
- ✅ All UI features

### To Use Simulated Data:
1. Simply start the server without SQL Server
2. The app will automatically use fallback data
3. You'll see a warning message: "Using fallback data - SQL Server not available"

## Option 2: Connecting to Real SQL Server

### Prerequisites:
1. SQL Server installed and running
2. Database with the required tables
3. Network access to the SQL Server instance

### Required Database Structure:
```sql
-- The 'runtime' database should contain:
USE runtime;

-- History table with columns:
-- TagName, DateTime, Value, Quality, etc.
-- Sample tags: RE1_1_TCC.PV, RE1_2_PHB.PV, etc.
```

### Configuration Steps:

1. **Copy the environment file:**
   ```bash
   cd server
   cp env.example .env
   ```

2. **Update the .env file with your SQL Server credentials:**
   ```env
   SQLSERVER_USER=your_actual_username
   SQLSERVER_PASSWORD=your_actual_password
   SQLSERVER_HOST=your_sql_server_host
   SQLSERVER_DB=runtime
   SQLSERVER_PORT=1433
   ```

3. **Test the connection:**
   ```bash
   # Check health endpoint
   curl http://localhost:3002/health
   ```

### Common SQL Server Issues:

#### 1. Connection Refused (Port 1433)
- **Cause**: SQL Server not running or wrong port
- **Solution**: 
  - Start SQL Server service
  - Check if SQL Server is listening on port 1433
  - Verify firewall settings

#### 2. Authentication Failed
- **Cause**: Wrong username/password
- **Solution**: 
  - Verify credentials in .env file
  - Check if user has access to the database
  - Ensure SQL Server authentication mode allows your login type

#### 3. Database Not Found
- **Cause**: Database 'runtime' doesn't exist
- **Solution**: 
  - Create the runtime database
  - Import required tables and data
  - Update SQLSERVER_DB in .env if using different database name

#### 4. Network Issues
- **Cause**: Cannot reach SQL Server host
- **Solution**: 
  - Check network connectivity
  - Verify SQL Server is configured to accept remote connections
  - Check firewall rules

## Health Check Endpoints

### WebSocket Server Health:
```
GET http://localhost:3002/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "sqlServer": {
    "status": "connected|disconnected",
    "usingFallback": true|false,
    "error": "error message if disconnected"
  },
  "websocket": {
    "connections": 1,
    "path": "/ws/production"
  }
}
```

## Troubleshooting

### 1. Check Server Logs
Look for these messages in the server console:
- ✅ `SQL Server connected successfully` - Real data available
- ⚠️ `Using fallback data - SQL Server not available` - Using simulated data
- ❌ `SQL Server Connection Error` - Connection failed

### 2. Test WebSocket Connection
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3002/ws/production');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### 3. Verify Environment Variables
```bash
# Check if .env file exists and has correct values
cat server/.env
```

## Development vs Production

### Development (Recommended):
- Use simulated data for faster development
- No SQL Server setup required
- All features work immediately

### Production:
- Connect to real SQL Server
- Configure proper credentials
- Ensure database has required tables and data

## Fallback Data Details

When SQL Server is not available, the system generates realistic data:

- **TCC Values**: Around 0.5% with ±0.05% variation
- **PH Values**: Around 7.0 with ±0.25 variation
- **Update Frequency**: Every 2 seconds
- **Data Quality**: All marked as "Good"

This allows you to test the complete real-time monitoring system without any database setup. 