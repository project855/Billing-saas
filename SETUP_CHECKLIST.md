# BillFlow Setup Checklist

Complete this checklist to get BillFlow running locally and ready for deployment.

## Local Development Setup

### Prerequisites
- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Git installed (`git --version`)
- [ ] Code editor (VS Code recommended)
- [ ] GitHub account (for version control)
- [ ] Supabase account (for database)

### Step 1: Project Setup
- [ ] Clone or download the BillFlow project
- [ ] Navigate to project directory: `cd billflow`
- [ ] Install dependencies: `pnpm install`
- [ ] All dependencies installed without errors

### Step 2: Database Setup

#### Supabase Configuration
- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project
- [ ] Wait for project to initialize (2-3 minutes)
- [ ] Note your project URL: `https://[PROJECT].supabase.co`
- [ ] Go to Settings → Database → Connection string
- [ ] Copy connection string (use "URI" format with password)
- [ ] Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Step 3: Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Open `.env.local` in editor
- [ ] Add Supabase CONNECTION string as `DATABASE_URL`
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Add generated secret to `.env.local` as `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL=http://localhost:3000`
- [ ] Fill in Supabase keys (found in Settings → API):
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`

**Optional (Email Features)**
- [ ] If using Gmail: Enable 2FA and generate App Password
- [ ] Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

### Step 4: Database Initialization
- [ ] Run: `pnpm prisma generate`
- [ ] Run: `pnpm prisma migrate dev --name init`
- [ ] Confirm tables created in Supabase dashboard
- [ ] Open Prisma Studio: `pnpm prisma studio`
- [ ] Verify all tables are empty and accessible

### Step 5: Start Development
- [ ] Run: `pnpm dev`
- [ ] Wait for build to complete
- [ ] Visit http://localhost:3000
- [ ] See the landing page loading
- [ ] Click "Get Started" or go to `/auth/signup`

### Step 6: Create First Account
- [ ] Sign up with test email and password
- [ ] Confirm successful registration
- [ ] Redirected to sign-in page
- [ ] Sign in with credentials
- [ ] Dashboard loads successfully
- [ ] See empty lists for Customers, Invoices, Payments

### Step 7: Test Core Features
- [ ] **Customers**: Create a test customer
  - [ ] Add customer details
  - [ ] Verify appears in customer list
  - [ ] Delete customer (optional)
- [ ] **Invoices**: Create a test invoice
  - [ ] Select customer from dropdown
  - [ ] Add line item with amount
  - [ ] Verify invoice appears in list
- [ ] **Payments**: Record a test payment
  - [ ] Select invoice to pay
  - [ ] Enter payment amount
  - [ ] Verify payment recorded
  - [ ] Check invoice status updated to "PAID"
- [ ] **Expenses**: Log a test expense
  - [ ] Select category
  - [ ] Enter amount
  - [ ] Verify expense appears in list
- [ ] **Reports**: View analytics
  - [ ] Check revenue chart (should show test data)
  - [ ] View expense distribution

### Step 8: Verify API Endpoints
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Refresh dashboard
- [ ] Check `/api/dashboard/stats` returns 200
- [ ] Check `/api/dashboard/charts` returns 200
- [ ] Create a customer
- [ ] Check `/api/customers` POST request succeeds
- [ ] Navigate to customers page
- [ ] Check `/api/customers` GET request succeeds

## Code Configuration

### Code Quality
- [ ] No TypeScript errors: `pnpm build`
- [ ] Linting passes: `pnpm lint` (if configured)
- [ ] All imports resolve correctly
- [ ] No console warnings in browser

### Customization (Optional)
- [ ] Update app name in `app/layout.tsx` metadata
- [ ] Update company info in `components/sidebar.tsx`
- [ ] Customize colors in `app/globals.css`
- [ ] Add company logo to public folder
- [ ] Update landing page in `app/page.tsx`

## Git & Version Control

### Initialize Repository
- [ ] Initialize git: `git init`
- [ ] Create `.gitignore` (already included)
- [ ] Verify `.env.local` is in `.gitignore` (don't commit secrets!)
- [ ] Add all files: `git add .`
- [ ] Create initial commit: `git commit -m "Initial commit: BillFlow"`

### GitHub Setup
- [ ] Create GitHub account if needed
- [ ] Create new repository on GitHub
- [ ] Copy repository URL
- [ ] Add remote: `git remote add origin <url>`
- [ ] Push to GitHub: `git push -u origin main`
- [ ] Verify files appear on GitHub

## Deployment Preparation

### Pre-Deployment Checklist
- [ ] All environment variables documented in `.env.example`
- [ ] No sensitive data in code comments
- [ ] `.env.local` is NOT in git (verify in `.gitignore`)
- [ ] Application builds successfully: `pnpm build`
- [ ] No TypeScript errors in build output
- [ ] All API endpoints tested locally
- [ ] Database migrations run cleanly

### Vercel Deployment Preparation
- [ ] Vercel account created
- [ ] GitHub repository is public or Vercel has access
- [ ] Ready to add environment variables in Vercel dashboard
- [ ] Ready to run migrations post-deployment

## Post-Local Setup Verification

### Performance Checks
- [ ] Dashboard loads in < 2 seconds
- [ ] Page transitions are smooth
- [ ] No console errors (F12 → Console tab)
- [ ] Images load without errors
- [ ] Forms submit successfully

### Browser Compatibility
- [ ] Chrome: ✅ Working
- [ ] Firefox: ✅ Working
- [ ] Safari: ✅ Working (if on macOS)
- [ ] Edge: ✅ Working

### Mobile Responsiveness
- [ ] Open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Sidebar collapses on mobile
- [ ] Forms are usable on mobile
- [ ] Tables have horizontal scroll
- [ ] Bottom navigation is accessible

## Documentation Review

- [ ] Read `GETTING_STARTED.md` - Quick start guide
- [ ] Read `README.md` - Full documentation
- [ ] Review `BUILD_SUMMARY.md` - Project overview
- [ ] Review `DEPLOYMENT.md` - Deployment instructions
- [ ] Read code comments in key files
- [ ] Check `.env.example` for all variables

## Common Issues & Fixes

### Issue: "Cannot find module '@prisma/client'"
```bash
# Solution:
pnpm install
pnpm prisma generate
```

### Issue: "DATABASE_URL is not set"
```bash
# Solution: Verify .env.local contains DATABASE_URL
cat .env.local | grep DATABASE_URL
```

### Issue: "Port 3000 already in use"
```bash
# Solution: Use different port
pnpm dev -- -p 3001
```

### Issue: "Sign up works but can't sign in"
```bash
# Solution: Check migrations ran
pnpm prisma migrate status
# If needed, reset:
pnpm prisma migrate reset
```

### Issue: "Middleware errors / Route not found"
```bash
# Solution: Clear Next.js cache
rm -rf .next
pnpm dev
```

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is a strong random string (32+ characters)
- [ ] `.env.local` is in `.gitignore` (NEVER commit secrets)
- [ ] No hardcoded passwords in code
- [ ] No API keys in comments
- [ ] HTTPS will be used in production
- [ ] Password hashing enabled (bcryptjs)
- [ ] Session tokens are secure (HTTP-only cookies)

## Next Steps After Setup

1. **Learn the Codebase**
   - [ ] Read through `app/dashboard/page.tsx`
   - [ ] Review `components/sidebar.tsx`
   - [ ] Study `app/api/customers/route.ts`
   - [ ] Understand database schema in `prisma/schema.prisma`

2. **Make Your First Change**
   - [ ] Change app title in `app/layout.tsx`
   - [ ] See hot reload in browser
   - [ ] Commit change to git

3. **Deploy to Production**
   - [ ] Follow `DEPLOYMENT.md`
   - [ ] Connect GitHub to Vercel
   - [ ] Add environment variables
   - [ ] Deploy and test in production

4. **Add Features**
   - [ ] Read feature implementation guides
   - [ ] Add Stripe integration
   - [ ] Implement email notifications
   - [ ] Create PDF invoice generation

## Final Verification

- [ ] ✅ Local development working
- [ ] ✅ Database connected and populated
- [ ] ✅ All core features tested
- [ ] ✅ Authentication working
- [ ] ✅ API endpoints responding
- [ ] ✅ Mobile responsive
- [ ] ✅ No console errors
- [ ] ✅ Git repository initialized
- [ ] ✅ Environment variables secure
- [ ] ✅ Ready for deployment

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - GETTING_STARTED.md - Common issues section
   - README.md - Troubleshooting section
   - DEPLOYMENT.md - Deployment FAQ

2. **Check Logs**
   - Browser console: F12 → Console
   - Terminal output: Look at pnpm dev output
   - Supabase dashboard: Check database logs

3. **Debug Mode**
   ```bash
   DEBUG=* pnpm dev
   ```

4. **Reset Everything** (⚠️ Careful!)
   ```bash
   pnpm prisma migrate reset
   rm -rf .next node_modules
   pnpm install
   pnpm dev
   ```

---

**Estimated Setup Time**: 30-45 minutes

Once you check off everything above, you're ready to deploy or start customizing!

For deployment instructions, see `DEPLOYMENT.md`

Good luck! 🚀
