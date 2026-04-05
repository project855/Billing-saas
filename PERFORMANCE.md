# BillFlow - Performance Optimization Guide

Best practices and strategies for optimizing BillFlow performance.

## Frontend Performance

### 1. Code Splitting & Dynamic Imports

```typescript
// components/heavy-chart.tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./charts/advanced-chart'), {
  loading: () => <div>Loading chart...</div>,
});

export function Dashboard() {
  return <HeavyChart />;
}
```

### 2. Image Optimization

```typescript
import Image from 'next/image';

// Use Next.js Image component for automatic optimization
export function Avatar({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### 3. Memoization

```typescript
import { memo } from 'react';

const CustomerRow = memo(({ customer }) => {
  return <tr>{/* ... */}</tr>;
});

export default CustomerRow;
```

### 4. React Query / SWR Caching

```typescript
import useSWR from 'swr';

export function useInvoices() {
  const { data, error, isLoading } = useSWR(
    '/api/invoices',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return { data, error, isLoading };
}
```

## Backend Performance

### 1. Database Query Optimization

```prisma
// ✅ Good: Only fetch needed fields
const invoices = await prisma.invoice.findMany({
  select: {
    id: true,
    invoiceNumber: true,
    amount: true,
    customerId: true,
  },
  take: 50,
});

// ❌ Bad: Fetches all fields unnecessarily
const invoices = await prisma.invoice.findMany();
```

### 2. Database Indexing

```prisma
model Invoice {
  id          String   @id @default(cuid())
  invoiceNumber String
  customerId  String
  status      String
  createdAt   DateTime @default(now())

  // Add indexes for frequently queried fields
  @@index([customerId])
  @@index([status])
  @@index([createdAt])
  @@unique([invoiceNumber, workspaceId])
}
```

### 3. Batch Operations

```typescript
// ✅ Good: Single operation
const results = await prisma.invoice.findMany({
  where: {
    customerId: { in: customerIds },
  },
});

// ❌ Bad: N+1 queries
for (const customerId of customerIds) {
  await prisma.invoice.findMany({
    where: { customerId },
  });
}
```

### 4. Connection Pooling

```env
# Use connection pooling for production
DATABASE_URL="postgresql://user:pass@pooler:5432/db?schema=public"
```

### 5. API Response Caching

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Cache dashboard stats for 60 seconds
  const headers = new Headers();
  headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');

  const stats = await getStats();
  return NextResponse.json(stats, { headers });
}
```

## Build & Deployment Performance

### 1. Next.js Configuration Optimization

```javascript
// next.config.js
module.exports = {
  // Enable Turbopack for faster builds
  turbopack: {},

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Enable compression
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Enable SWC minification
  swcMinify: true,
};
```

### 2. Bundle Analysis

```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({});
```

Run with: `ANALYZE=true npm run build`

### 3. Static Generation (ISR)

```typescript
export const revalidate = 60; // Revalidate every 60 seconds

export default async function Page() {
  const data = await getData();
  return <div>{data}</div>;
}
```

## Database Performance

### 1. Query Analysis

```sql
-- Analyze slow queries
EXPLAIN ANALYZE
SELECT * FROM invoices
WHERE customer_id = $1 AND status = $2;
```

### 2. Archiving Old Data

```typescript
// Archive invoices older than 2 years
async function archiveOldInvoices() {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  await prisma.invoiceArchive.createMany({
    data: await prisma.invoice.findMany({
      where: { createdAt: { lt: twoYearsAgo } },
    }),
  });

  await prisma.invoice.deleteMany({
    where: { createdAt: { lt: twoYearsAgo } },
  });
}
```

### 3. Database Monitoring

- Monitor slow query logs
- Set up alerts for high connection counts
- Monitor replication lag (if using replicas)
- Regular VACUUM and ANALYZE

## Caching Strategy

### 1. Browser Caching

```typescript
// Set appropriate cache headers
export const metadata = {
  cacheControl: 'public, max-age=3600, s-maxage=3600',
};
```

### 2. CDN Caching

```typescript
// Cache static assets with CDN
const imageUrl = 'https://cdn.example.com/images/logo.png';
```

### 3. API Response Caching

```typescript
// Use Redis for API caching
import Redis from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getCachedStats() {
  const cached = await redis.get('dashboard:stats');
  if (cached) return JSON.parse(cached);

  const stats = await calculateStats();
  await redis.set('dashboard:stats', JSON.stringify(stats), { ex: 300 });

  return stats;
}
```

## Monitoring & Alerting

### 1. Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

Monitor with Vercel Analytics or Google Analytics.

### 2. Performance Budgets

```javascript
// Set performance budgets
module.exports = {
  experimental: {
    performanceForwardingAllowedOrigins: ['localhost:3000'],
  },
};
```

### 3. Error Rate Monitoring

- Use Sentry for error tracking
- Set up alerts for error rate > 1%
- Monitor API endpoint latencies

## Load Testing

```bash
# Load test with Apache Bench
ab -n 1000 -c 10 https://billflow.com/

# Or use wrk for more detailed analysis
wrk -t12 -c400 -d30s https://billflow.com/
```

## Production Checklist

- [ ] Database indexes created and optimized
- [ ] Connection pooling configured
- [ ] CDN enabled for static assets
- [ ] Browser caching headers set
- [ ] API response caching implemented
- [ ] Bundle size analyzed and optimized
- [ ] Dynamic imports configured
- [ ] Image optimization enabled
- [ ] Monitoring and alerting set up
- [ ] Load tests passed
- [ ] Error tracking configured
- [ ] Database backups automated
- [ ] Performance budgets enforced

## Common Performance Issues & Solutions

### Issue: Slow Dashboard Loading

**Symptoms**: Dashboard takes > 3 seconds to load

**Solutions**:
1. Implement SWR caching for stats
2. Use ISR for static dashboard sections
3. Optimize database queries with indexes
4. Implement pagination for large tables

### Issue: High Memory Usage

**Symptoms**: Server running out of memory

**Solutions**:
1. Reduce connection pool size
2. Implement connection pooling
3. Archive old data
4. Optimize large queries with pagination

### Issue: API Timeouts

**Symptoms**: API requests timing out

**Solutions**:
1. Add database indexes
2. Implement query caching
3. Reduce query complexity
4. Increase API timeout values

## References

- [Next.js Performance](https://nextjs.org/learn/foundations/how-nextjs-works)
- [Prisma Performance](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization)
- [PostgreSQL Optimization](https://www.postgresql.org/docs/current/performance-tips.html)
- [Web Vitals](https://web.dev/vitals/)
