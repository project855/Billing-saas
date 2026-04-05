import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/payments/[id] ────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id }      = await params;
    const companyId   = await getOrCreateCompanyId(session.user.id);
    const payment     = await db.payment.findFirst({
      where: { id, companyId },
      include: {
        invoice:  { select: { id: true, invoiceNumber: true, amount: true, status: true } },
        customer: { select: { id: true, displayName: true, email: true }                 },
      },
    });

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    return NextResponse.json({ data: payment });
  } catch (err) {
    console.error('[GET /payments/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
  }
}

// ─── DELETE /api/payments/[id] — void payment ──────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const payment = await db.payment.findFirst({ where: { id, companyId } });
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });

    // Soft-void: mark as Refunded instead of deleting (keeps audit trail)
    await db.payment.update({ where: { id }, data: { status: 'Refunded' } });

    // Recalculate invoice status after voiding this payment
    const invoice = await db.invoice.findUnique({
      where: { id: payment.invoiceId },
      include: { payments: { where: { status: 'Completed' }, select: { amount: true } } },
    });

    if (invoice) {
      const remaining = invoice.payments.reduce((s, p) => s + p.amount, 0);
      let newStatus = invoice.status;

      if (remaining >= invoice.amount - 0.01) {
        newStatus = 'Paid';
      } else if (invoice.status === 'Paid') {
        // Was paid but now has an active void — revert to Sent
        newStatus = 'Sent';
      }

      if (newStatus !== invoice.status) {
        await db.invoice.update({
          where: { id: invoice.id },
          data:  { status: newStatus, paidAt: newStatus === 'Paid' ? invoice.paidAt : null },
        });
      }
    }

    return NextResponse.json({ message: 'Payment voided (marked as Refunded)' });
  } catch (err) {
    console.error('[DELETE /payments/[id]]', err);
    return NextResponse.json({ error: 'Failed to void payment' }, { status: 500 });
  }
}
