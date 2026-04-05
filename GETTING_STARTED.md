# Getting Started with BillFlow

Welcome to BillFlow! This guide will help you set up the project locally and get it running in minutes.

## Quick Start (5 minutes)

### 1. Clone or Download
```bash
# If you have the code as a ZIP file
unzip billflow.zip
cd billflow
```

### 2. Install Dependencies
```bash
pnpm install
# or: npm install
```

### 3. Set Up Database

Create a Supabase account and project:
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in the form and create project
4. Wait for the database to initialize

### 4. Configure Environment
```bash
# Copy example file
cp .env.example .env.local

# Edit with your values (get from Supabase dashboard)
nano .env.local  # or use your favorite editor
```

**Required values:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[SUPABASE_URL]:5432/postgres
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

### 5. Set Up Database Schema
```bash
# Generate Prisma client
pnpm prisma generate

# Create database tables
pnpm prisma migrate dev --name init
```

### 6. Start Development Server
```bash
pnpm dev
```

### 7. Create Your Account
- Open http://localhost:3000
- Click "Get Started" or navigate to /auth/signup
- Sign up with your email
- A workspace is automatically created for you!

## What's Included

### Pages
- **Dashboard** (`/dashboard`) - Overview and analytics
- **Customers** (`/dashboard/customers`) - Manage customers
- **Invoices** (`/dashboard/invoices`) - Create and track invoices
- **Payments** (`/dashboard/payments`) - Record payments
- **Expenses** (`/dashboard/expenses`) - Log business expenses
- **Reports** (`/dashboard/reports`) - Financial analytics
- **Settings** (`/dashboard/settings`) - Configure workspace

### Authentication
- Sign up with email/password
- Sign in with credentials
- Secure session management
- Password hashing with bcrypt

### Core Features
- ✅ Multi-workspace support
- ✅ Customer management
- ✅ Invoice creation & tracking
- ✅ Payment recording
- ✅ Expense logging
- ✅ Financial analytics
- ✅ Real-time dashboard

## Common Tasks

### Creating Your First Invoice

1. Go to **Customers** and create a customer
2. Go to **Invoices** and click "Create Invoice"
3. Select the customer
4. Add line items with descriptions and amounts
5. Set due date
6. Click "Create Invoice"

### Logging an Expense

1. Go to **Expenses** and click "Log Expense"
2. Select category (Office Supplies, Travel, etc.)
3. Enter amount and date
4. Optionally add merchant and receipt
5. Click "Create Expense"

### Recording a Payment

1. Go to **Payments** and click "Record Payment"
2. Select invoice to mark as paid
3. Enter payment amount and method
4. Set received date
5. Click "Record Payment"
6. Invoice status automatically updates

### Viewing Reports

1. Go to **Reports** to see:
   - Revenue trends over time
   - Expenses by category
   - Invoice status distribution
   - Export options (PDF, CSV, Excel)

## Development

### File Structure
```
app/
  ├── api/              # API routes (backend)
  ├── auth/             # Authentication pages
  ├── dashboard/        # Protected pages
  └── page.tsx          # Landing page

components/
  ├── ui/               # Shadcn UI components
  ├── sidebar.tsx       # Navigation
  └── *-list.tsx        # List components

lib/
  ├── auth.ts           # Authentication config
  ├── prisma.ts         # Database client
  └── validations.ts    # Form validation schemas

prisma/
  └── schema.prisma     # Database schema
```

### Useful Commands

```bash
# View database in Prisma Studio
pnpm prisma studio

# Create new migration
pnpm prisma migrate dev --name feature_name

# Reset database (⚠️ deletes all data)
pnpm prisma migrate reset

# Check database status
pnpm prisma migrate status

# Generate Prisma client
pnpm prisma generate

# Run linter
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables Explained

```env
# Database connection (from Supabase)
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth.js configuration
NEXTAUTH_SECRET=random-secure-string  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000    # Your app URL

# Supabase keys (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Troubleshooting

### "Cannot find module 'prisma'"
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### "Database connection error"
- Check DATABASE_URL is correct
- Verify Supabase database is running
- Ensure password is URL-encoded (special chars like @ become %40)

### "NEXTAUTH_SECRET not set"
```bash
# Generate and add to .env.local
openssl rand -base64 32
```

### "Port 3000 already in use"
```bash
# Use different port
pnpm dev -- -p 3001
```

### Can't sign in after sign up
- Check that migrations ran: `pnpm prisma migrate status`
- Clear browser cookies
- Check browser console for error messages

## Customization

### Change App Name
Edit these files:
- `app/layout.tsx` - Page title and description
- `components/sidebar.tsx` - Sidebar title
- `app/page.tsx` - Landing page

### Modify Colors
- Edit `app/globals.css` for color theme
- Update Tailwind colors in `tailwind.config.ts`

### Add New Page
1. Create file: `app/dashboard/new-page/page.tsx`
2. Export a React component
3. It's automatically routable at `/dashboard/new-page`

### Create API Endpoint
1. Create file: `app/api/endpoint/route.ts`
2. Export GET, POST, PUT, DELETE functions
3. Accessible at `/api/endpoint`

## Database Basics

### View Data
```bash
# Open Prisma Studio GUI
pnpm prisma studio

# Or use Supabase dashboard
# https://app.supabase.com → SQL Editor
```

### Query Examples
```typescript
// Find a user
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
})

// Find all invoices
const invoices = await prisma.invoice.findMany({
  include: { customer: true }
})

// Update invoice
await prisma.invoice.update({
  where: { id: 'invoice-id' },
  data: { status: 'PAID' }
})
```

## Next Steps

1. **Explore the Code** - Understand the structure and architecture
2. **Add Features** - Extend with custom functionality
3. **Customize Design** - Update colors, fonts, and layout
4. **Deploy** - Follow `DEPLOYMENT.md` to go live
5. **Integrate** - Add Stripe, email notifications, etc.

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth.js Guide](https://next-auth.js.org/getting-started/introduction)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Getting Help

### Check Logs
```bash
# Browser console (F12)
# Terminal output from pnpm dev
# Supabase dashboard logs
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* pnpm dev
```

### Reset Everything
```bash
# Careful: This deletes all local data!
pnpm prisma migrate reset
pnpm dev
```

## Tips & Best Practices

1. **Always pull latest changes before starting**
   ```bash
   git pull origin main
   ```

2. **Create feature branches**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Test locally before deploying**
   ```bash
   pnpm build
   pnpm start
   ```

4. **Keep dependencies updated**
   ```bash
   pnpm update
   ```

5. **Use browser DevTools** (F12)
   - Network tab to debug API calls
   - Console tab for errors
   - Application tab to view cookies/sessions

## Ready to Code?

You're all set! Start with:

1. Explore the dashboard at http://localhost:3000
2. Try creating a customer and invoice
3. Read through the code in `components/` and `app/api/`
4. Make a small change and see hot reload in action
5. Commit your changes and deploy!

Happy coding! 🚀

For more detailed information, see:
- `README.md` - Full project documentation
- `DEPLOYMENT.md` - Deployment instructions
- `.env.example` - Environment variable reference
