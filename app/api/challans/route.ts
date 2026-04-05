import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const challanItemSchema = z.object({
  itemId: z.string().optional().nullable(),
  name: z.string().min(1, 'Item name required'),
  description: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
});

const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  challanNumber: z.string().min(1),
  referenceNo: z.string().optional().nullable(),
  challanDate: z.string(),
  challanType: z.string().default('Supply of Liquid Gas'),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['percent', 'fixed']).default('percent'),
  adjustment: z.number().default(0),
  customerNotes: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  items: z.array(challanItemSchema).min(1, 'At least one item required'),
});

// GET /api/challans
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = 20;

    const where: any = { companyId };
    if (status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { referenceNo: { contains: search } },
        { customer: { displayName: { contains: search } } },
      ];
    }

    const [challans, total] = await Promise.all([
      db.deliveryChallan.findMany({
        where,
        include: {
          customer: { select: { id: true, displayName: true, email: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.deliveryChallan.count({ where }),
    ]);

    return NextResponse.json({ data: challans, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /challans]', err);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 });
  }
}

// POST /api/challans
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createChallanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { customerId, challanNumber, referenceNo, challanDate, challanType, discount, discountType, adjustment, customerNotes, termsAndConditions, items } = parsed.data;

    // Check duplicate
    const existing = await db.deliveryChallan.findUnique({ where: { companyId_challanNumber: { companyId, challanNumber } } });
    if (existing) return NextResponse.json({ error: `Challan number "${challanNumber}" already exists` }, { status: 409 });

    const subTotal = items.reduce((s, i) => s + i.amount, 0);
    const discountAmt = discountType === 'percent' ? (subTotal * discount) / 100 : discount;
    const total = subTotal - discountAmt + adjustment;

    const challan = await db.deliveryChallan.create({
      data: {
        companyId,
        customerId,
        challanNumber,
        referenceNo: referenceNo ?? null,
        challanDate: new Date(challanDate),
        challanType,
        subTotal,
        discount,
        discountType,
        adjustment,
        total,
        customerNotes: customerNotes ?? null,
        termsAndConditions: termsAndConditions ?? null,
        items: {
          create: items.map(item => ({
            itemId: item.itemId ?? null,
            name: item.name,
            description: item.description ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        },
      },
      include: {
        customer: { select: { id: true, displayName: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: challan, message: 'Delivery challan created successfully' }, { status: 201 });
  } catch (err) {
    console.error('[POST /challans]', err);
    return NextResponse.json({ error: 'Failed to create delivery challan' }, { status: 500 });
  }
}
