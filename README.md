# BillFlow - Invoice & Expense Management SaaS

A modern, full-featured SaaS platform for managing invoices, expenses, customers, and payments. Built with Next.js 16, Prisma, NextAuth.js, and Tailwind CSS.

## Features

### Core Functionality
- **Invoice Management**: Create, send, and track invoices with customizable templates
- **Customer Management**: Manage customer profiles, contacts, and payment history
- **Payment Tracking**: Record payments from multiple sources and track invoice status
- **Expense Management**: Log, categorize, and approve business expenses
- **Reports & Analytics**: Visual insights into revenue, expenses, and financial metrics
- **Multi-workspace Support**: Create and manage multiple workspaces

### Technical Features
- **User Authentication**: Secure NextAuth.js authentication with Supabase
- **Database**: PostgreSQL with Prisma ORM for type-safe queries
- **File Storage**: Supabase Storage for document uploads
- **Real-time Updates**: Dynamic dashboards with live data
- **Mobile Responsive**: Works seamlessly on all devices
- **Security**: JWT tokens, password hashing (bcrypt), and row-level security

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI components
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **API**: RESTful with Next.js Route Handlers
- **Deployment**: Vercel

## Project Structure

```
app/
  └── api/              # API routes
      ├── auth/         # Authentication endpoints
      ├── customers/    # Customer management
      ├── invoices/     # Invoice operations
      ├── payments/     # Payment tracking
      ├── expenses/     # Expense management
      ├── reports/      # Analytics & reports
      └── dashboard/    # Dashboard data

  └── dashboard/        # Protected routes
      ├── customers/    # Customer pages
      ├── invoices/     # Invoice pages
      ├── payments/     # Payment pages
      ├── expenses/     # Expense pages
      ├── reports/      # Report pages
      └── settings/     # Settings page

  └── auth/             # Authentication pages
      ├── signin/       # Sign in page
      └── signup/       # Sign up page

components/            # Reusable React components
  ├── ui/              # Shadcn UI components
  ├── sidebar.tsx      # Navigation sidebar
  ├── top-nav.tsx      # Top navigation
  ├── dashboard-*.tsx  # Dashboard components
  └── *-list.tsx       # List components

lib/
  ├── prisma.ts        # Prisma client
  ├── auth.ts          # NextAuth configuration
  ├── api-response.ts  # API response utilities
  └── validations.ts   # Zod schemas

prisma/
  └── schema.prisma    # Database schema
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)
- Supabase account (for PostgreSQL and authentication)
- GitHub account (optional, for Git integration)

### Installation

1. **Clone or download the project**
   ```bash
   # If cloning from GitHub
   git clone <repository-url>
   cd billflow
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env.local
   
   # Edit .env.local with your values
   nano .env.local
   ```

4. **Configure Supabase**
   - Create a new Supabase project
   - Get your connection string from the Database settings
   - Update `DATABASE_URL` in `.env.local`

5. **Initialize the database**
   ```bash
   # Generate Prisma client
   pnpm prisma generate
   
   # Run migrations
   pnpm prisma migrate dev --name init
   
   # (Optional) Seed the database
   pnpm prisma db seed
   ```

6. **Set up NextAuth.js**
   - Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
   - Add to `.env.local`
   - Update NEXTAUTH_URL for your environment

7. **Start the development server**
   ```bash
   pnpm dev
   ```

8. **Visit the app**
   - Open http://localhost:3000
   - Sign up for a new account
   - Start creating invoices and managing expenses!

## Database Schema

### Core Models
- **User**: User accounts with authentication
- **Session**: Authentication sessions
- **Workspace**: Multi-tenant workspaces
- **WorkspaceMember**: User roles in workspaces

### Business Models
- **Company**: Company information
- **Customer**: Customer profiles and contacts
- **Invoice**: Invoices with line items
- **InvoiceItem**: Invoice line items
- **Payment**: Payment records
- **Expense**: Expense logs
- **Report**: Generated reports

### Settings Models
- **TaxSetting**: Tax configuration
- **EmailTemplate**: Invoice email templates
- **Webhook**: Event webhooks
- **Notification**: User notifications

## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `GET /api/auth/signin` - Sign in
- `GET /api/auth/signout` - Sign out

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `DELETE /api/customers/[id]` - Delete customer

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `DELETE /api/invoices/[id]` - Delete invoice

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `DELETE /api/payments/[id]` - Delete payment

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Log expense
- `DELETE /api/expenses/[id]` - Delete expense

### Reports
- `GET /api/reports` - Get analytics data

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/charts` - Chart data
- `GET /api/dashboard/recent-invoices` - Recent invoices

## Authentication Flow

1. User signs up or signs in
2. NextAuth.js validates credentials
3. Session token created and stored in HTTP-only cookie
4. Middleware checks auth on protected routes
5. API routes verify user session before responding

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Stripe (optional, for Phase 6)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - Add all variables from `.env.example` in Vercel dashboard
   - Settings → Environment Variables

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically

5. **Run Database Migrations**
   ```bash
   # After deployment, run migrations in production
   vercel env pull  # Get production env
   pnpm prisma migrate deploy
   ```

### Deploy to Other Platforms

The project can be deployed to any platform that supports Node.js 18+:
- AWS (Elastic Beanstalk, Lambda)
- Google Cloud (Cloud Run, App Engine)
- Heroku
- DigitalOcean (App Platform)
- Railway
- Render

## Development

### Running Tests
```bash
pnpm test
```

### Code Quality
```bash
pnpm lint
```

### Build for Production
```bash
pnpm build
pnpm start
```

## Future Enhancements

### Phase 6 (Advanced Features)
- [ ] Stripe payment integration
- [ ] Subscription management
- [ ] Multi-currency support
- [ ] Advanced reporting (PDF export)
- [ ] Email notifications

### Phase 7 (Admin & Settings)
- [ ] Team member management
- [ ] Custom email templates
- [ ] Webhook integrations
- [ ] API keys for third-party integrations
- [ ] Advanced security (2FA, SSO)
- [ ] Audit logs

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Email: support@billflow.com
- GitHub Issues: [Create an issue](https://github.com/yourusername/billflow/issues)
- Documentation: [Full docs](https://docs.billflow.com)

## Roadmap

- Q1 2024: Core features (v1.0)
- Q2 2024: Stripe integration, advanced reports
- Q3 2024: Team collaboration, API
- Q4 2024: Mobile app, advanced analytics

---

Built with by [Your Name/Team]. © 2024 BillFlow. All rights reserved.
