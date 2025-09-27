# Coolify Deployment Configuration for eON Application

## 🚀 Quick Setup Guide

### 1. Environment Variables (REQUIRED)

Set these environment variables in your Coolify application settings:

```bash
# Database Configuration (CRITICAL)
DATABASE_URL=postgresql://eon_user:your_secure_password@postgres:5432/eon_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-key-here

# Database Connection Settings
SSL_MODE=disable
POOL_SIZE=10
```

**🔐 Generate NEXTAUTH_SECRET:**
```bash
npm run generate:secret
```
Copy the generated secret and use it as the value for `NEXTAUTH_SECRET`.

**🔒 SSL Configuration:**
- `SSL_MODE=disable` - For Coolify internal network (recommended)
- `SSL_MODE=require` - If your PostgreSQL requires SSL
- Leave unset for auto-detection based on environment

### 2. PostgreSQL Service Setup

1. **Create PostgreSQL Service in Coolify:**
   - Service Name: `postgres` (IMPORTANT: Must be exactly "postgres")
   - Database Name: `eon_db`
   - Username: `eon_user`
   - Password: `your_secure_password` (generate a strong password)

2. **Link Services:**
   - In your application settings, add the PostgreSQL service to "Connected Services"
   - This creates the internal network connection

### 3. Build Configuration

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`

### 4. Deployment Process

The application will automatically:
1. ✅ Build the Next.js application
2. ✅ Run database migrations
3. ✅ Seed initial data
4. ✅ Start the application

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Database storage module not properly exported"
**Cause**: Database connection failed during initialization
**Solution**: 
- Check `DATABASE_URL` format
- Ensure PostgreSQL service is running
- Verify service name is "postgres"

#### 2. "password authentication failed"
**Cause**: Incorrect database credentials
**Solution**:
- Double-check username/password in `DATABASE_URL`
- Ensure database user exists and has permissions

#### 3. "Connection refused"
**Cause**: PostgreSQL service not running or wrong hostname
**Solution**:
- Check PostgreSQL service status in Coolify
- Ensure service name is "postgres" (not "postgresql" or "db")
- Verify services are in the same network

#### 4. "Database does not exist"
**Cause**: Database not created or wrong name
**Solution**:
- Check database name in `DATABASE_URL`
- Ensure database was created successfully
- Verify database exists in PostgreSQL service

#### 5. "SSL connection error"
**Cause**: SSL configuration mismatch
**Solution**:
- Set `SSL_MODE=disable` for Coolify internal network
- Set `SSL_MODE=require` if PostgreSQL requires SSL
- Check PostgreSQL SSL settings in Coolify

#### 6. "NEXTAUTH_SECRET not set"
**Cause**: Missing or invalid NEXTAUTH_SECRET
**Solution**:
- Generate a new secret: `npm run generate:secret`
- Copy the generated value to Coolify environment variables
- Ensure secret is at least 32 characters long

### 5. Environment Variable Validation

Use this format for `DATABASE_URL`:
```
postgresql://username:password@postgres:5432/database_name
```

**Example for Coolify:**
```
DATABASE_URL=postgresql://eon_user:MySecurePassword123@postgres:5432/eon_db
```

### 6. Service Names in Coolify

- **PostgreSQL Service**: Must be named `postgres`
- **Application Service**: Can be any name
- **Network**: Services must be in the same project/network

## 📊 Health Checks

After deployment, test these endpoints:

1. **Health Check**: `https://your-domain.com/api/health`
2. **Database Health**: `https://your-domain.com/api/db-health`
3. **Setup Status**: `https://your-domain.com/api/setup`

## 🔍 Debugging Commands

If you have terminal access in Coolify:

```bash
# Check environment variables
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check if tables exist
psql $DATABASE_URL -c "\dt"

# Run migrations manually
npm run db:migrate

# Seed database manually
npm run db:seed

# Generate NEXTAUTH_SECRET
npm run generate:secret

# Run comprehensive database diagnostic
npm run db:diagnose
```

## 📝 Logs to Monitor

Watch for these log messages:

**Success Indicators:**
- ✅ `Database connection initialized successfully`
- ✅ `Database migrations completed successfully!`
- ✅ `Database seeding completed successfully!`
- ✅ `Storage object validated successfully`

**Error Indicators:**
- ❌ `Database authentication failed`
- ❌ `Connection refused`
- ❌ `Database does not exist`
- ❌ `Database storage module not properly exported`

## 🛡️ Security Checklist

- [ ] Change default user passwords
- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Secure `DATABASE_URL` (don't expose in logs)
- [ ] Enable HTTPS
- [ ] Regular database backups

## 📞 Support

If issues persist:
1. Check Coolify application logs
2. Verify PostgreSQL service logs
3. Test database connectivity
4. Review environment variables
5. Check service network configuration
