# eON Application - Coolify Deployment Guide

## Prerequisites

1. **PostgreSQL Database**: Set up a PostgreSQL database in Coolify
2. **Environment Variables**: Configure the required environment variables
3. **Build Configuration**: Set up the build and deployment commands

## Coolify Configuration

### 1. Database Setup

Create a PostgreSQL database service in Coolify:

```yaml
# Database Configuration
Service Type: PostgreSQL
Database Name: eon_db
Username: eon_user
Password: [generate secure password]
```

### 2. Application Configuration

#### Build Settings:
- **Build Command**: `npm run build` (includes automatic migrations)
- **Start Command**: `npm start`
- **Port**: `3000`

#### Environment Variables:
```bash
# Database Configuration (REQUIRED)
# Format: postgresql://username:password@host:port/database
# For Coolify: 'postgres' is the internal service name
DATABASE_URL=postgresql://eon_user:your_secure_password@postgres:5432/eon_db

# Application Configuration
NODE_ENV=production
PORT=3000

# Next.js Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secure-secret-key

# Database Connection Settings
SSL_MODE=disable
POOL_SIZE=10
```

**⚠️ IMPORTANT**: Replace `your_secure_password` with the actual password you set when creating the PostgreSQL service in Coolify.

### 3. Deployment Steps

1. **Connect Repository**: Link your Git repository to Coolify
2. **Set Environment Variables**: Add the variables listed above
3. **Configure Build**: Use the build and start commands provided
4. **Deploy**: Start the deployment process

### 4. Post-Deployment Setup

**Option A: Automatic Migrations (Recommended)**
- Migrations run automatically during the build process
- No manual intervention required
- Build command includes: `npm run build && node scripts/postbuild.js`

**Option B: API-Based Setup**
- Use the health check endpoint: `GET /api/health`
- Trigger setup via API: `POST /api/setup`
- No terminal access required

**Option C: Manual Setup (if terminal is available)**
```bash
# SSH into your container or use Coolify's terminal
npm run db:setup
```

This will:
- Run database migrations to create tables
- Seed the database with initial data (users, departments, categories, etc.)

## Default Login Credentials

After seeding, you can log in with:

- **Admin User**: `admin@eon.com` (Administrator role)
- **Regular Users**: 
  - `john.doe@eon.com`
  - `jane.smith@eon.com`
  - `bob.wilson@eon.com`

**Note**: All users have the default password `password123` - change this in production!

## Database Schema

The application creates the following tables:

- `users` - User accounts and profiles
- `departments` - Organizational departments
- `categories` - Document categories
- `roles` - User roles and permissions
- `permissions` - System permissions
- `eons` - Documents (eONs)
- `eon_approvers` - Document approval workflow
- `eon_viewers` - Document viewing permissions
- `eon_comments` - Document comments and discussions
- `eon_attachments` - Document attachments
- `audit_logs` - System audit trail

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Check `DATABASE_URL` format
   - Ensure PostgreSQL service is running
   - Verify network connectivity

2. **Migration Failed**:
   - Check database permissions
   - Ensure database exists
   - Verify schema conflicts

3. **Build Failed**:
   - Check Node.js version (18.x or 20.x)
   - Verify all dependencies are installed
   - Check for TypeScript errors

4. **Terminal Websocket Connection Lost**:
   - Use automatic migration options (Dockerfile or start script)
   - Migrations will run automatically on container startup
   - No manual terminal access required

### Logs and Monitoring:

- Check application logs in Coolify dashboard
- Monitor database connection pool
- Review audit logs in the application

## Security Considerations

1. **Change Default Passwords**: Update all default user passwords
2. **Secure Environment Variables**: Use strong secrets for production
3. **Database Security**: Enable SSL connections
4. **Network Security**: Configure proper firewall rules
5. **Regular Updates**: Keep dependencies updated

## Backup and Recovery

1. **Database Backups**: Set up regular PostgreSQL backups
2. **Application Backups**: Backup your code repository
3. **Configuration Backups**: Save environment variable configurations

## Scaling Considerations

1. **Database Connection Pooling**: Configure appropriate pool sizes
2. **Load Balancing**: Use multiple application instances
3. **Caching**: Implement Redis for session storage
4. **CDN**: Use CDN for static assets

## Support

For issues with:
- **Coolify**: Check Coolify documentation
- **Database**: Review PostgreSQL logs
- **Application**: Check application logs and audit trail
