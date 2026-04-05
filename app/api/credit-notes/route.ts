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
  creditNoteNumber: z.string().min(1),
  originalInvoiceRef: z.string().optional().nullable(),
  creditNoteDate: z.string(),
  reason: z.string().optional().nullable(),
  discount: z.number().min(0).default(0),
  discountType: z.enum(['percent', 'fixed']).default('percent'),
  adjustment: z.number().default(0),
  customerNotes: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, 'At least one item required'),
});

// GET /api/credit-notes
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
        { creditNoteNumber: { contains: search } },
        { originalInvoiceRef: { contains: search } },
        { customer: { displayName: { contains: search } } },
      ];
    }

    const [notes, total] = await Promise.all([
      db.creditNote.findMany({
        where,
        include: {
          customer: { select: { id: true, displayName: true, email: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.creditNote.count({ where }),
    ]);

    return NextResponse.json({ data: notes, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /credit-notes]', err);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 });
  }
}

// POST /api/credit-notes
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { customerId, creditNoteNumber, originalInvoiceRef, creditNoteDate, reason,
            discount, discountType, adjustment, customerNotes, termsAndConditions, items } = parsed.data;

    const existing = await db.creditNote.findUnique({
      where: { companyId_creditNoteNumber: { companyId, creditNoteNumber } },
    });
    if (existing) return NextResponse.json({ error: `Credit note number "${creditNoteNumber}" already exists` }, { status: 409 });

    const subTotal    = items.reduce((s, i) => s + i.amount, 0);
    const discountAmt = discountType === 'percent' ? (subTotal * discount) / 100 : discount;
    const total       = subTotal - discountAmt + adjustment;

    const note = await db.creditNote.create({
      data: {
        companyId,
        customerId,
        creditNoteNumber,
        originalInvoiceRef: originalInvoiceRef ?? null,
        creditNoteDate: new Date(creditNoteDate),
        reason: reason ?? null,
        subTotal,
        discount,
        discountType,
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

    return NextResponse.json({ data: note, message: 'Credit note created successfully' }, { status: 201 });
  } catch (err) {
    console.error('[POST /credit-notes]', err);
    return NextResponse.json({ error: 'Failed to create credit note' }, { status: 500 });
  }
}
