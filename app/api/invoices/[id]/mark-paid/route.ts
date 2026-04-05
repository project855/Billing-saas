import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  amount:  z.number().positive(),
  method:  z.string().min(1), // Card, Bank, Cash, UPI, Cheque
  date:    z.string(),
  notes:   z.string().optional(),
  transactionId: z.string().optional(),
});

// POST /api/invoices/[id]/mark-paid — record payment + update invoice status
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const invoice = await db.invoice.findFirst({
      where: { id, companyId },
      include: { payments: { where: { status: 'Completed' } } },
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'Paid') return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    if (invoice.status === 'Cancelled') return NextResponse.json({ error: 'Invoice is cancelled' }, { status: 400 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { amount, method, date, notes, transactionId } = parsed.data;

    // Calculate how much is already paid
    const alreadyPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    const balance = invoice.amount - alreadyPaid;

    if (amount > balance + 0.01) {
      return NextResponse.json({ error: `Payment exceeds balance of ₹${balance.toFixed(2)}` }, { status: 400 });
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        companyId,
        invoiceId: id,
        customerId: invoice.customerId,
        amount,
        method,
        date: new Date(date),
        notes: notes ?? null,
        transactionId: transactionId ?? null,
        status: 'Completed',
      },
    });

    // Check if fully paid
    const totalPaid = alreadyPaid + amount;
    const isFullyPaid = totalPaid >= invoice.amount - 0.01;

    if (isFullyPaid) {
      await db.invoice.update({
        where: { id },
        data: { status: 'Paid', paidAt: new Date() },
      });
    }

    return NextResponse.json({
      data: payment,
      message: isFullyPaid ? 'Invoice marked as fully paid!' : `Payment recorded. Remaining balance: ₹${(invoice.amount - totalPaid).toFixed(2)}`,
      invoiceStatus: isFullyPaid ? 'Paid' : invoice.status,
    });
  } catch (err) {
    console.error('[POST /invoices/[id]/mark-paid]', err);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
