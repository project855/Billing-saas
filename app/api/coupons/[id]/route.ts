import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  productId: z.string().optional().nullable(),
  discountType: z.enum(['flat', 'percentage']).optional(),
  discountValue: z.number().min(0).optional(),
  redemptionType: z.enum(['one-time', 'forever', 'limited']).optional(),
  maxRedemptions: z.number().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
  associatePlans: z.string().optional().nullable(),
  associateAddons: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'expired']).optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    
    // Await params for next 15 parameter compatibility
    const id = params.id;
    
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    // Verify ownership
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check code uniqueness
    if (d.code && d.code !== existing.code) {
      const duplicate = await db.coupon.findFirst({
        where: { companyId, code: d.code }
      });
      if (duplicate) return NextResponse.json({ error: `Code "${d.code}" already exists` }, { status: 409 });
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        name: d.name,
        code: d.code,
        productId: d.productId !== undefined ? d.productId : undefined,
        discountType: d.discountType,
        discountValue: d.discountValue,
        redemptionType: d.redemptionType,
        maxRedemptions: d.maxRedemptions !== undefined ? d.maxRedemptions : undefined,
        expirationDate: d.expirationDate ? new Date(d.expirationDate) : (d.expirationDate === null ? null : undefined),
        associatePlans: d.associatePlans !== undefined ? d.associatePlans : undefined,
        associateAddons: d.associateAddons !== undefined ? d.associateAddons : undefined,
        status: d.status,
      }
    });

    return NextResponse.json({ message: 'Coupon updated', coupon }, { status: 200 });
  } catch (err) {
    console.error('[PUT /api/coupons/[id]]', err);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const id = params.id;

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Usually better to soft delete or mark inactive
    await db.coupon.update({
      where: { id },
      data: { status: 'inactive' }
    });

    return NextResponse.json({ message: 'Coupon deactivated successfully' });
  } catch (err) {
    console.error('[DELETE /api/coupons/[id]]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
