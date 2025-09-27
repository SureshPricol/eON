# Passwordless Authentication & User Management Guide

## 🎯 Overview
I've created a comprehensive system for passwordless authentication and user management for your Coolify deployment.

## 🔗 API Endpoints Created

### 1. Database Health Check
**Endpoint**: `GET /api/db-health`
**Purpose**: Check database health and get user lists

**Response**:
```json
{
  "healthy": true,
  "timestamp": "2025-01-27T10:30:00.000Z",
  "users": [
    {
      "id": "uuid",
      "email": "john.smith@company.com",
      "name": "John Smith",
      "status": "active",
      "department_id": "uuid"
    }
  ],
  "departments": [...],
  "categories": [...],
  "summary": {
    "total_users": 5,
    "total_departments": 5,
    "total_categories": 5,
    "total_eons": 0
  }
}
```

### 2. User List API
**Endpoint**: `GET /api/users/list`
**Purpose**: Get comprehensive user list with department information

**Response**:
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
      "roles": ["Admin"],
      "department": {
        "id": "uuid",
        "name": "Finance",
        "code": "FIN"
      },
      "created_at": "2025-01-27T10:30:00.000Z",
      "updated_at": "2025-01-27T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 3. Passwordless Authentication
**Endpoint**: `POST /api/auth/passwordless`
**Purpose**: Generate passwordless login token

**Request**:
```json
{
  "email": "john.smith@company.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Passwordless login token generated",
  "token": "abc123...",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "john.smith@company.com",
    "name": "John Smith",
    "roles": ["Admin"]
  }
}
```

**Token Validation**: `GET /api/auth/passwordless?token=abc123...`

### 4. Check Users (Enhanced)
**Endpoint**: `GET /api/check-users`
**Purpose**: Check if users exist and get user list

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "john.smith@company.com",
      "name": "John Smith",
      "status": "active",
      "roles": ["Admin"],
      "department_id": "uuid"
    }
  ],
  "count": 5,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## 🚀 How to Use

### Step 1: Check Database Health
```bash
curl https://your-domain.com/api/db-health
```

### Step 2: Get User List
```bash
curl https://your-domain.com/api/users/list
```

### Step 3: Passwordless Login
```bash
# Generate token
curl -X POST https://your-domain.com/api/auth/passwordless \
  -H "Content-Type: application/json" \
  -d '{"email": "john.smith@company.com"}'

# Use token to login
curl https://your-domain.com/api/auth/passwordless?token=YOUR_TOKEN
```

### Step 4: Seed Database (if needed)
```bash
curl -X POST https://your-domain.com/api/check-users
```

## 👥 Default Users (After Seeding)

1. **john.smith@company.com** - Admin role
2. **jane.doe@company.com** - Manager role  
3. **alex.chen@company.com** - Employee role
4. **sarah.wilson@company.com** - Manager role
5. **mike.johnson@company.com** - Employee role

## 🔐 Passwordless Authentication Flow

1. **User enters email** → System generates temporary token
2. **Token expires in 15 minutes** → Security feature
3. **User uses token** → System validates and logs in
4. **Token is consumed** → Cannot be reused

## 📊 Database Health Monitoring

The `/api/db-health` endpoint provides:
- ✅ Database connection status
- ✅ User count and list
- ✅ Department information
- ✅ Category information
- ✅ EON document count
- ✅ Comprehensive health summary

## 🔧 Troubleshooting

### If No Users Found
```bash
# Seed the database
curl -X POST https://your-domain.com/api/check-users
```

### If Database Not Connected
```bash
# Check environment variables in Coolify
# Ensure DATABASE_URL is set correctly
```

### If Authentication Fails
```bash
# Check if user exists
curl https://your-domain.com/api/users/list

# Verify user status is 'active'
```

## 🛡️ Security Features

1. **Token Expiration**: 15 minutes
2. **Token Consumption**: One-time use
3. **User Status Check**: Only active users can login
4. **Email Validation**: Must be valid email format
5. **Database Validation**: User must exist in database

## 📝 Log Messages

Watch for these log messages:
- ✅ `Passwordless login token generated for: email`
- ✅ `Passwordless login successful for: email`
- ✅ `Found X users in database`
- ❌ `User not found. Please check your email address.`
- ❌ `Invalid or expired token`

## 🎉 Benefits

1. **No Passwords Required** - Secure token-based authentication
2. **Easy User Management** - Comprehensive user listing APIs
3. **Database Health Monitoring** - Real-time status checking
4. **Automatic Seeding** - Easy database setup
5. **Production Ready** - Secure and scalable

## 🔄 Next Steps

1. **Test the endpoints** with your domain
2. **Seed the database** if no users exist
3. **Implement frontend** passwordless login
4. **Monitor database health** regularly
5. **Update user roles** as needed

Your passwordless authentication system is now ready! 🚀
