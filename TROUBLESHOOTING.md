# eON Application - Troubleshooting Guide

## Database Authentication Issues

### Error: `password authentication failed for user "postgres"`

This error occurs when the `DATABASE_URL` environment variable is incorrect or missing.

#### Solution Steps:

1. **Check Environment Variables in Coolify**
   - Go to your application settings in Coolify
   - Navigate to "Environment Variables"
   - Ensure `DATABASE_URL` is set correctly

2. **Correct DATABASE_URL Format**
   ```
   postgresql://username:password@host:port/database
   ```

3. **For Coolify Deployment**
   ```
   DATABASE_URL=postgresql://eon_user:your_password@postgres:5432/eon_db
   ```
   
   **Important Notes:**
   - `postgres` is the internal service name in Coolify
   - Replace `your_password` with the actual password you set
   - Replace `eon_user` with your actual database username
   - Replace `eon_db` with your actual database name

4. **Verify Database Service**
   - Ensure PostgreSQL service is running in Coolify
   - Check that the database exists
   - Verify the user has proper permissions

#### Common Mistakes:

❌ **Wrong hostname**: Using `localhost` instead of `postgres`
```
DATABASE_URL=postgresql://user:pass@localhost:5432/db  # Wrong for Coolify
```

✅ **Correct hostname**: Using service name `postgres`
```
DATABASE_URL=postgresql://user:pass@postgres:5432/db   # Correct for Coolify
```

❌ **Missing password**: Empty or incorrect password
```
DATABASE_URL=postgresql://user:@postgres:5432/db       # Missing password
```

✅ **Correct password**: Using actual password
```
DATABASE_URL=postgresql://user:actual_password@postgres:5432/db
```

## Quick Fix Commands

### 1. Check Current Environment Variables
```bash
# In Coolify terminal or via API
echo $DATABASE_URL
```

### 2. Test Database Connection
```bash
# Test connection manually
psql $DATABASE_URL -c "SELECT version();"
```

### 3. Reset Environment Variables
In Coolify dashboard:
1. Go to Application Settings
2. Environment Variables
3. Update `DATABASE_URL` with correct values
4. Redeploy the application

## Database Service Setup in Coolify

### Step 1: Create PostgreSQL Service
1. In Coolify, go to "Services"
2. Click "Add Service"
3. Select "PostgreSQL"
4. Configure:
   - **Service Name**: `postgres` (important!)
   - **Database Name**: `eon_db`
   - **Username**: `eon_user`
   - **Password**: `your_secure_password`

### Step 2: Link Services
1. Go to your application settings
2. In "Connected Services", add the PostgreSQL service
3. This creates the internal network connection

### Step 3: Set Environment Variables
```bash
DATABASE_URL=postgresql://eon_user:your_secure_password@postgres:5432/eon_db
NODE_ENV=production
PORT=3000
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-key
```

## Testing the Fix

### 1. Health Check
Visit: `https://your-domain.com/api/health`

### 2. Manual Setup
Visit: `https://your-domain.com/api/setup` (POST request)

### 3. Check Logs
In Coolify dashboard, check application logs for:
- ✅ `Database migrations completed successfully!`
- ✅ `Database health check passed`

## Still Having Issues?

### Check These:
1. **Service Names**: Ensure PostgreSQL service is named `postgres`
2. **Network**: Services must be in the same project/network
3. **Credentials**: Double-check username/password
4. **Database**: Ensure database exists
5. **Permissions**: User must have CREATE/INSERT permissions

### Debug Commands:
```bash
# Check if PostgreSQL service is running
docker ps | grep postgres

# Test network connectivity
ping postgres

# Check database exists
psql $DATABASE_URL -c "\l"
```

### Contact Support:
If issues persist, check:
- Coolify documentation
- PostgreSQL logs in Coolify
- Application logs for detailed error messages
