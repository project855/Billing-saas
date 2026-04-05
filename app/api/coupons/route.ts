import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1, 'Coupon name is required'),
  code: z.string().min(1, 'Coupon code is required'),
  productId: z.string().optional().nullable(),
  discountType: z.enum(['flat', 'percentage']),
  discountValue: z.number().min(0, 'Discount value must be positive'),
  redemptionType: z.enum(['one-time', 'forever', 'limited']),
  maxRedemptions: z.number().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  associatePlans: z.string().optional().nullable(),
  associateAddons: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'expired']).default('active'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    
    // Check search params if needed
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';

    const where: any = { companyId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const coupons = await db.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        item: { select: { name: true, type: true } }
      }
    });

    const activeCount = await db.coupon.count({ where: { companyId, status: 'active' } });

    return NextResponse.json({ coupons, stats: { total: coupons.length, active: activeCount } });
  } catch (err) {
    console.error('[GET /api/coupons]', err);
    return NextResponse.json({ coupons: [], stats: { total: 0, active: 0 } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    const existing = await db.coupon.findFirst({
      where: { companyId, code: d.code }
    });

    if (existing) {
      return NextResponse.json({ error: `Coupon code "${d.code}" already exists` }, { status: 409 });
    }

    const coupon = await db.coupon.create({
      data: {
        companyId,
        name: d.name,
        code: d.code,
        productId: d.productId || null,
        discountType: d.discountType,
        discountValue: d.discountValue,
        redemptionType: d.redemptionType,
        maxRedemptions: d.maxRedemptions ?? null,
        expirationDate: d.expirationDate ? new Date(d.expirationDate) : null,
        associatePlans: d.associatePlans ?? null,
        associateAddons: d.associateAddons ?? null,
        status: d.status,
      }
    });

    return NextResponse.json({ message: 'Coupon created', coupon }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/coupons]', err);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
