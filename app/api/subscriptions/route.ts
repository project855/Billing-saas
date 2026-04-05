import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const subItemSchema = z.object({
  itemId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const createSubSchema = z.object({
  customerId: z.string().min(1),
  subNumber: z.string().min(1),
  profileName: z.string().min(1),
  subFor: z.enum(['items', 'product']).default('items'),
  billInterval: z.number().int().positive().default(1),
  billUnit: z.string().default('Month(s)'),
  startDate: z.string(),
  neverExpires: z.boolean().default(true),
  cycles: z.number().int().optional().nullable(),
  refNumber: z.string().optional().nullable(),
  offlinePayment: z.boolean().default(false),
  paymentTerms: z.string().default('Due on Receipt'),
  notes: z.string().optional().nullable(),
  items: z.array(subItemSchema).optional().default([]),
  metadata: z.any().optional(),
});

// GET /api/subscriptions
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
        { subNumber: { contains: search } },
        { profileName: { contains: search } },
        { customer: { displayName: { contains: search } } },
      ];
    }

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        include: {
          customer: { select: { id: true, displayName: true, email: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.subscription.count({ where }),
    ]);

    return NextResponse.json({ data: subscriptions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /subscriptions]', err);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 });
  }
}

// POST /api/subscriptions
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createSubSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const {
      customerId, subNumber, profileName, subFor, billInterval, billUnit,
      startDate, neverExpires, cycles, refNumber, offlinePayment,
      paymentTerms, notes, items, metadata,
    } = parsed.data;

    // Check for duplicate subNumber
    const existing = await db.subscription.findUnique({ where: { companyId_subNumber: { companyId, subNumber } } });
    if (existing) return NextResponse.json({ error: `Subscription number "${subNumber}" already exists` }, { status: 409 });

    const subscription = await db.subscription.create({
      data: {
        companyId,
        customerId,
        subNumber,
        profileName,
        subFor,
        billInterval,
        billUnit,
        startDate: new Date(startDate),
        neverExpires,
        cycles: neverExpires ? null : (cycles ?? null),
        refNumber: refNumber ?? null,
        offlinePayment,
        paymentTerms,
        notes: notes ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        items: items.length > 0 ? {
          create: items.map(item => ({
            itemId: item.itemId ?? null,
            name: item.name,
            description: item.description ?? null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        } : undefined,
      },
      include: {
        customer: { select: { id: true, displayName: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: subscription, message: 'Subscription created successfully' }, { status: 201 });
  } catch (err) {
    console.error('[POST /subscriptions]', err);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
