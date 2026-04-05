# BillFlow - Production Deployment Guide

Complete guide for deploying BillFlow to production environments with Vercel, Docker, or self-hosted options.

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- GitHub account
- Vercel or hosting provider account
- Domain name (optional)

## Step 1: Prepare Your Repository

### 1.1 Initialize Git Repository

If you haven't already:

```bash
git init
git add .
git commit -m "Initial commit: BillFlow SaaS application"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `billflow`)
3. Don't initialize with README, .gitignore, or license
4. Click "Create repository"

### 1.3 Push to GitHub

```bash
git branch -M main
git remote add origin https://github.com/yourusername/billflow.git
git push -u origin main
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create account
3. Click "New Project"
4. Configure:
   - Name: `billflow`
   - Database Password: Choose a strong password
   - Region: Choose closest to you
5. Click "Create new project" and wait for setup

### 2.2 Get Connection String

1. In Supabase dashboard, go to Settings → Database
2. Copy the "Connection string"
3. Use the "URI" format with your password
4. Example: `postgresql://postgres:password@db.supabase.co:5432/postgres`

### 2.3 Run Database Migrations Locally

```bash
# Update DATABASE_URL in .env.local
export DATABASE_URL="postgresql://..."

# Run migrations
pnpm prisma migrate dev --name init

# Generate Prisma client
pnpm prisma generate
```

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Click "Import Project"
3. Select "GitHub" and connect your account
4. Find and click "Import" on your `billflow` repository
5. Click "Deploy"

### 3.2 Configure Environment Variables

After initial setup fails (expected), configure env vars:

1. In Vercel dashboard, go to Settings → Environment Variables
2. Add the following variables:

```
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.vercel.app

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<your app password>
```

### 3.3 Run Database Migrations in Production

After deploying, you need to run migrations on the Vercel deployment:

#### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Pull production environment variables
vercel env pull

# Run migrations
pnpm prisma migrate deploy

# Push to production
git add .
git commit -m "Run production migrations"
git push
```

#### Option 2: Manual Migration

```bash
# Create a temporary migration script
cat > scripts/migrate-prod.js << 'EOF'
const { execSync } = require('child_process');

// Run migrations
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
console.log('Migrations completed successfully!');
EOF

# Run it
node scripts/migrate-prod.js
```

### 3.4 Trigger Redeploy

1. In Vercel dashboard, go to Deployments
2. Find the latest deployment
3. Click "..." → "Redeploy"
4. Wait for redeployment to complete

## Step 4: Post-Deployment Setup

### 4.1 Create Admin User

After deployment, create your first admin account:

1. Visit your deployed app: `https://your-domain.vercel.app`
2. Click "Sign Up"
3. Enter email and password
4. You'll be logged in and auto-assigned to a workspace

### 4.2 Verify Application

1. Test the authentication flow
2. Create a test customer
3. Create a test invoice
4. Verify dashboard loads with data

### 4.3 Configure Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Update DNS records (Vercel provides instructions)
4. Wait for DNS propagation (5-24 hours)

### 4.4 Enable HTTPS

HTTPS is automatically enabled by Vercel. Verify:
1. Visit https://your-domain.com (should work)
2. Check that you have a valid SSL certificate

## Step 5: Monitoring & Maintenance

### 5.1 Enable Analytics

1. In Vercel dashboard, go to Analytics
2. Web Analytics is available on Pro plan
3. Vercel Analytics provides performance metrics

### 5.2 Set Up Error Tracking

Consider integrating error tracking services:
- Sentry (recommended)
- LogRocket
- Rollbar

### 5.3 Monitor Database

Use Supabase dashboard to:
- Monitor database performance
- Check query logs
- Set up alerts for storage usage

### 5.4 Backup Database

Supabase automatically backs up daily. For additional security:

```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240321.sql
```

## Step 6: Production Checklist

- [ ] DATABASE_URL configured in Vercel
- [ ] NEXTAUTH_SECRET set to a strong random value
- [ ] NEXTAUTH_URL points to your production domain
- [ ] All Supabase keys configured
- [ ] Email configuration tested (SMTP)
- [ ] Database migrations ran successfully
- [ ] Admin user account created
- [ ] All pages load without errors
- [ ] Authentication works (sign up, sign in, sign out)
- [ ] HTTPS enabled and working
- [ ] Custom domain configured (if using)
- [ ] Backups configured
- [ ] Monitoring/alerts set up

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase database is running
- Ensure IP whitelist allows your Vercel IPs

### Authentication Failures

**Solution:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

### Migrations Failed

**Solution:**
```bash
# View migration status
pnpm prisma migrate status

# Reset database (WARNING: deletes data!)
pnpm prisma migrate reset

# Or manually rollback
pnpm prisma migrate resolve --rolled-back "migration_name"
```

### Build Failures

Check Vercel build logs:
1. Go to Deployments → Failed deployment
2. Click "View Function Logs" or "Build Logs"
3. Look for error messages
4. Check that all environment variables are set

## Scaling Considerations

As your app grows, consider:

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Monitor slow queries
   - Consider upgrading to Supabase Pro plan

2. **Caching**
   - Add Redis (Upstash)
   - Implement ISR (Incremental Static Regeneration)
   - Cache API responses

3. **Storage**
   - Set up Supabase Storage for files
   - Configure CDN for file serving
   - Implement file expiration policies

4. **API Rate Limiting**
   - Use Upstash Redis for rate limiting
   - Implement request throttling
   - Monitor API usage

## Security Hardening

1. **Enable 2FA** (when implemented)
   - Require 2FA for admin accounts
   - Educate users on security

2. **Set up WAF Rules**
   - Enable Vercel's Web Application Firewall
   - Configure rate limiting

3. **Regular Security Audits**
   ```bash
   # Check for vulnerabilities
   pnpm audit
   
   # Run security scan
   npm run security-scan
   ```

4. **Secrets Management**
   - Rotate NEXTAUTH_SECRET periodically
   - Never commit .env files to git
   - Use Vercel's environment variable protection

## Rollback Procedure

If something goes wrong:

```bash
# View deployment history
vercel deployments list

# Promote previous deployment to production
vercel promote <deployment-id>

# Or redeploy specific commit
git revert <commit-hash>
git push
# Vercel will auto-deploy on push
```

## Support & Help

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: Create an issue in your repository

---

For detailed questions, refer to the main README.md or contact support.
