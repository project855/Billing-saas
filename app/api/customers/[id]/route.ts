import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const customer = await db.customer.findFirst({
      where: { id, companyId },
      include: {
        invoices: {
          include: { payments: { select: { id: true, amount: true, status: true, date: true, method: true } } },
          orderBy: { issueDate: 'desc' },
        },
        payments: {
          include: { invoice: { select: { id: true, invoiceNumber: true } } },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const now          = new Date();
    const totalBilled  = customer.invoices.reduce((s, inv) => s + inv.amount, 0);
    const totalPaid    = customer.payments.filter(p => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
    const outstanding  = Math.max(0, totalBilled - totalPaid);
    const hasOverdue   = customer.invoices.some(inv => !['Paid','Cancelled'].includes(inv.status) && new Date(inv.dueDate) < now);
    const lastPayment  = customer.payments.find(p => p.status === 'Completed') ?? null;

    return NextResponse.json({
      data: {
        ...customer,
        stats: { totalBilled, totalPaid, outstanding, hasOverdue, lastPaymentDate: lastPayment?.date ?? null, invoiceCount: customer.invoices.length },
      },
    });
  } catch (err) {
    console.error('[GET /customers/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const existing = await db.customer.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const body = await request.json();
    const updated = await db.customer.update({
      where: { id },
      data: {
        displayName:     body.displayName     ?? existing.displayName,
        companyName:     body.companyName     ?? null,
        email:           body.email           ?? null,
        phone:           body.phone           ?? null,
        gstNumber:       body.gstNumber       ?? null,
        panNumber:       body.panNumber       ?? null,
        currency:        body.currency        ?? existing.currency,
        paymentTerms:    body.paymentTerms    ?? existing.paymentTerms,
        billingAddress:  body.billingAddress  ?? null,
        shippingAddress: body.shippingAddress ?? null,
        notes:           body.notes           ?? null,
        status:          body.status          ?? existing.status,
      },
    });

    return NextResponse.json({ message: 'Customer updated', customer: updated });
  } catch (err) {
    console.error('[PUT /customers/[id]]', err);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE /api/customers/[id] → soft deactivate
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const existing = await db.customer.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    await db.customer.update({ where: { id }, data: { status: 'inactive' } });
    return NextResponse.json({ message: 'Customer deactivated' });
  } catch (err) {
    console.error('[DELETE /customers/[id]]', err);
    return NextResponse.json({ error: 'Failed to deactivate customer' }, { status: 500 });
  }
}
