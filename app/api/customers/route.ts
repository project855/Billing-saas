import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';
import { logEvent } from '@/lib/log-event';

const createSchema = z.object({
  displayName:     z.string().min(1, 'Name is required'),
  companyName:     z.string().optional().nullable(),
  email:           z.string().email('Invalid email').optional().nullable(),
  phone:           z.string().optional().nullable(),
  gstNumber:       z.string().optional().nullable(),
  panNumber:       z.string().optional().nullable(),
  currency:        z.string().default('INR'),
  paymentTerms:    z.string().default('Net 30'),
  billingAddress:  z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  notes:           z.string().optional().nullable(),
});

// GET /api/customers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? 'all';
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit  = 50;

    const where: any = { companyId };

    if (status === 'inactive') where.status = 'inactive';

    if (search) {
      where.OR = [
        { displayName:  { contains: search } },
        { email:        { contains: search } },
        { companyName:  { contains: search } },
        { phone:        { contains: search } },
        { gstNumber:    { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          invoices: {
            select: { amount: true, status: true, dueDate: true, payments: { select: { amount: true, status: true } } },
          },
          _count: { select: { invoices: true } },
        },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      db.customer.count({ where }),
    ]);

    const now = new Date();
    const data = customers.map(c => {
      const totalBilled  = c.invoices.reduce((s, inv) => s + inv.amount, 0);
      const totalPaid    = c.invoices.reduce((s, inv) => s + inv.payments.filter(p => p.status === 'Completed').reduce((ps, p) => ps + p.amount, 0), 0);
      const outstanding  = Math.max(0, totalBilled - totalPaid);
      const hasOverdue   = c.invoices.some(inv => !['Paid', 'Cancelled'].includes(inv.status) && new Date(inv.dueDate) < now);
      const computedStatus = c.status === 'inactive' ? 'inactive' : (hasOverdue ? 'overdue' : 'active');

      return {
        id:           c.id,
        displayName:  c.displayName,
        companyName:  c.companyName,
        email:        c.email,
        phone:        c.phone,
        gstNumber:    c.gstNumber,
        paymentTerms: c.paymentTerms,
        totalBilled,
        totalPaid,
        outstanding,
        invoiceCount: c._count.invoices,
        status:       computedStatus,
        baseStatus:   c.status,
        createdAt:    c.createdAt,
      };
    });

    // Apply computed status filter
    const filtered = status === 'all' || status === 'inactive'
      ? data
      : data.filter(c => c.status === status);

    return NextResponse.json(filtered);
  } catch (err) {
    console.error('[GET /customers]', err);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/customers
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    // Duplicate check on email within same company
    if (parsed.data.email) {
      const existing = await db.customer.findFirst({
        where: { companyId, email: { equals: parsed.data.email } },
      });
      if (existing) return NextResponse.json({ error: 'A customer with this email already exists' }, { status: 409 });
    }

    const customer = await db.customer.create({
      data: { 
        companyId, 
        ...parsed.data, 
        email: parsed.data.email || '', 
        status: 'active' 
      },
    });

    await logEvent({
      companyId,
      userId: session.user.id,
      eventType: 'Customer Added',
      entityType: 'Customer',
      entityId: customer.id,
      entityName: customer.displayName,
    });

    return NextResponse.json({ message: 'Customer created successfully', customer }, { status: 201 });
  } catch (err) {
    console.error('[POST /customers]', err);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
