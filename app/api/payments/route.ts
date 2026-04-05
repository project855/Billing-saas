import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';
import { logEvent } from '@/lib/log-event';

const createPaymentSchema = z.object({
  invoiceId:     z.string().min(1, 'Invoice is required'),
  amount:        z.number().positive('Amount must be positive'),
  method:        z.enum(['UPI', 'Bank', 'Card', 'Cash', 'Cheque', 'Other']),
  date:          z.string(),
  transactionId: z.string().optional().nullable(),
  notes:         z.string().optional().nullable(),
});

// ─── GET /api/payments ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { searchParams } = new URL(request.url);
    const search  = searchParams.get('search')  ?? '';
    const method  = searchParams.get('method')  ?? 'all';
    const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit   = 20;

    const where: any = { companyId };
    if (method !== 'all') where.method = method;
    if (search) {
      where.OR = [
        { transactionId: { contains: search } },
        { invoice: { invoiceNumber: { contains: search } } },
        { customer: { displayName:  { contains: search } } },
      ];
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          invoice:  { select: { id: true, invoiceNumber: true, amount: true } },
          customer: { select: { id: true, displayName: true, email: true }  },
        },
        orderBy: { date: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({ data: payments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /payments]', err);
    return NextResponse.json([], { status: 200 }); // safe fallback
  }
}

// ─── POST /api/payments ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await request.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { invoiceId, amount, method, date, transactionId, notes } = parsed.data;

    // Verify invoice belongs to this company
    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: { payments: { where: { status: 'Completed' }, select: { amount: true } } },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'Cancelled') return NextResponse.json({ error: 'Invoice is cancelled' }, { status: 400 });

    const alreadyPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const balance     = invoice.amount - alreadyPaid;
    if (amount > balance + 0.01) {
      return NextResponse.json({ error: `Payment exceeds balance of ₹${balance.toFixed(2)}` }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        companyId,
        invoiceId,
        customerId:    invoice.customerId,
        amount,
        method,
        date:          new Date(date),
        transactionId: transactionId ?? null,
        notes:         notes ?? null,
        status:        'Completed',
      },
      include: {
        invoice:  { select: { id: true, invoiceNumber: true } },
        customer: { select: { id: true, displayName: true }  },
      },
    });

    const totalPaid = alreadyPaid + amount;
    const fullyPaid = totalPaid >= invoice.amount - 0.01;

    if (fullyPaid) {
      await db.invoice.update({ where: { id: invoiceId }, data: { status: 'Paid', paidAt: new Date() } });
    } else if (invoice.status === 'Draft') {
      await db.invoice.update({ where: { id: invoiceId }, data: { status: 'Sent' } });
    }

    await logEvent({
      companyId,
      userId: session.user.id,
      eventType: fullyPaid ? 'Invoice Paid' : 'Payment Recorded',
      entityType: 'Invoice',
      entityId: invoice.id,
      entityName: `${invoice.invoiceNumber} – ₹${amount.toFixed(2)}`,
    });

    return NextResponse.json({
      data: payment,
      message: fullyPaid
        ? 'Invoice fully paid!'
        : `Payment recorded. Balance remaining: ₹${(invoice.amount - totalPaid).toFixed(2)}`,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /payments]', err);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
