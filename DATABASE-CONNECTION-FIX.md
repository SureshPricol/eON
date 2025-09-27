# Database Connection Fix for Coolify

## 🎯 Problem Identified
The error messages you're seeing:
```json
{"success":false,"error":"Database not connected","users":[]}
{"healthy":false,"error":"Cannot read properties of null (reading 'select')","timestamp":"2025-09-27T12:59:38.989Z","users":[],"departments":[],"categories":[],"eons":[]}
{"error":"Database not connected","users":[],"count":0}
```

**Root Cause**: The database connection is being created asynchronously, but the API endpoints are trying to use it synchronously before it's ready.

## ✅ Solutions Implemented

### 1. Enhanced Database Connection (`lib/db/connection.ts`)
- **Added async initialization tracking** with `initializationPromise`
- **Added `waitForConnection()` method** to wait for database to be ready
- **Improved error handling** with connection timeouts
- **Better logging** for connection status

### 2. Updated All API Endpoints
- **`/api/db-health`** - Now waits for database connection
- **`/api/users/list`** - Now waits for database connection  
- **`/api/check-users`** - Now waits for database connection
- **`/api/auth/passwordless`** - Now waits for database connection

### 3. Connection Waiting Logic
All endpoints now use:
```typescript
const isConnected = await waitForDatabaseConnection();
if (!isConnected || !db) {
    return NextResponse.json({
        error: 'Database not connected or connection timeout'
    }, { status: 500 });
}
```

## 🔧 How the Fix Works

### Before (Problematic):
1. Database connection starts asynchronously
2. API endpoint tries to use `db` immediately
3. `db` is `null` because connection isn't ready
4. Error: "Cannot read properties of null"

### After (Fixed):
1. Database connection starts asynchronously
2. API endpoint calls `waitForDatabaseConnection()`
3. Waits up to 10 seconds for connection to be ready
4. Uses `db` only after connection is established
5. Returns proper error if connection fails

## 🚀 Testing the Fix

### Step 1: Check Database Health
```bash
curl https://your-domain.com/api/db-health
```

**Expected Response** (if working):
```json
{
  "healthy": true,
  "timestamp": "2025-01-27T10:30:00.000Z",
  "database": {
    "connected": true,
    "connectionTest": true
  },
  "users": [...],
  "summary": {
    "total_users": 5,
    "total_departments": 5,
    "total_categories": 5,
    "total_eons": 0
  }
}
```

### Step 2: Get User List
```bash
curl https://your-domain.com/api/users/list
```

**Expected Response** (if working):
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "id": "uuid",
      "email": "john.smith@company.com",
      "name": "John Smith",
      "status": "active",
      "roles": ["Admin"]
    }
  ]
}
```

### Step 3: Check Users
```bash
curl https://your-domain.com/api/check-users
```

## 🔍 Troubleshooting

### If Still Getting "Database not connected"

1. **Check Environment Variables in Coolify**:
   ```bash
   DATABASE_URL=postgresql://eon_user:password@postgres:5432/eon_db
   NODE_ENV=production
   SSL_MODE=disable
   ```

2. **Verify PostgreSQL Service**:
   - Service name must be exactly `postgres`
   - Service must be running
   - Database must exist

3. **Check Coolify Logs**:
   Look for these messages:
   - ✅ `🔄 Initializing database connection...`
   - ✅ `📊 Connecting to: postgres://...`
   - ✅ `✅ Database connection initialized successfully`
   - ❌ `❌ Failed to initialize database connection`

### If Getting "Connection timeout"

1. **Check PostgreSQL Service Status** in Coolify
2. **Verify Network Connectivity** between services
3. **Check Database Credentials** in DATABASE_URL
4. **Increase Timeout** (currently 10 seconds)

### If Getting "Cannot read properties of null"

This should now be fixed with the `waitForDatabaseConnection()` implementation.

## 📊 Log Messages to Watch For

### Success Indicators:
- ✅ `🔄 Initializing database connection...`
- ✅ `📊 Connecting to: postgres://...`
- ✅ `✅ New database client connected`
- ✅ `✅ Database connection initialized successfully`
- ✅ `✅ Database connection established and ready`

### Error Indicators:
- ❌ `❌ Failed to initialize database connection`
- ❌ `❌ Database connection timeout`
- ❌ `❌ Database authentication failed`
- ❌ `❌ Connection refused`

## 🛠️ Manual Database Setup

If the automatic connection fails, you can manually set up the database:

### Option 1: Use Coolify Terminal
```bash
# Check environment variables
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### Option 2: Use API Endpoints
```bash
# Check database health
curl https://your-domain.com/api/db-health

# Seed database if needed
curl -X POST https://your-domain.com/api/check-users
```

## 🎉 Expected Result

After the fix:
1. ✅ **Database connection waits** for proper initialization
2. ✅ **API endpoints work** without null reference errors
3. ✅ **User lists are returned** properly
4. ✅ **Database health check** shows connection status
5. ✅ **Passwordless authentication** works with real database

## 🔄 Next Steps

1. **Deploy the updated code** to Coolify
2. **Test the endpoints** to verify the fix
3. **Check logs** for connection status
4. **Seed database** if no users exist
5. **Test passwordless authentication**

The database connection issues should now be completely resolved! 🚀
