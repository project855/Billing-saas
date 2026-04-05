import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const itemSchema = z.object({
  itemId: z.string().optional().nullable(),
  name: z.string().min(1, 'Item name required'),
  description: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  amount: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
});

const createSchema = z.object({
  customerId: z.string().min(1, 'Customer required'),
  quoteNumber: z.string().min(1),
  referenceNo: z.string().optional().nullable(),
  quoteDate: z.string(),
  expiryDate: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['percent', 'fixed']).default('percent'),
  shippingCharges: z.number().min(0).default(0),
  adjustment: z.number().default(0),
  customerNotes: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, 'At least one item required'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? 'all';
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit  = 20;

    const where: any = { companyId };
    if (status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search } },
        { referenceNo: { contains: search } },
        { subject: { contains: search } },
        { customer: { displayName: { contains: search } } },
      ];
    }

    const [quotes, total] = await Promise.all([
      db.quote.findMany({
        where,
        include: {
          customer: { select: { id: true, displayName: true, email: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.quote.count({ where }),
    ]);

    return NextResponse.json({ data: quotes, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /quotes]', err);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { customerId, quoteNumber, referenceNo, quoteDate, expiryDate, subject,
            discount, discountType, shippingCharges, adjustment,
            customerNotes, termsAndConditions, items } = parsed.data;

    const existing = await db.quote.findUnique({
      where: { companyId_quoteNumber: { companyId, quoteNumber } },
    });
    if (existing) return NextResponse.json({ error: `Quote number "${quoteNumber}" already exists` }, { status: 409 });

    const subTotal    = items.reduce((s, i) => s + i.amount, 0);
    const discountAmt = discountType === 'percent' ? (subTotal * discount) / 100 : discount;
    const total       = subTotal - discountAmt + shippingCharges + adjustment;

    const quote = await db.quote.create({
      data: {
        companyId,
        customerId,
        quoteNumber,
        referenceNo: referenceNo ?? null,
        quoteDate: new Date(quoteDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        subject: subject ?? null,
        subTotal,
        discount,
        discountType,
        shippingCharges,
        adjustment,
        total,
        customerNotes: customerNotes ?? null,
        termsAndConditions: termsAndConditions ?? null,
        items: {
          create: items.map(i => ({
            itemId: i.itemId ?? null,
            name: i.name,
            description: i.description ?? null,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            amount: i.amount,
            taxRate: i.taxRate,
          })),
        },
      },
      include: {
        customer: { select: { id: true, displayName: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: quote, message: 'Quote created successfully' }, { status: 201 });
  } catch (err) {
    console.error('[POST /quotes]', err);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
