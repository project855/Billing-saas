import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

type Params = { params: Promise<{ id: string }> };

// POST /api/invoices/[id]/send — marks invoice as Sent
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const invoice = await db.invoice.findFirst({ where: { id, companyId } });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'Paid') return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    if (invoice.status === 'Cancelled') return NextResponse.json({ error: 'Invoice is cancelled' }, { status: 400 });

    const updated = await db.invoice.update({
      where: { id },
      data: { status: 'Sent', sentAt: new Date() },
    });

    // TODO: Send email via Resend when configured
    // const customer = await db.customer.findUnique({ where: { id: invoice.customerId } });
    // await sendInvoiceEmail(updated, customer);

    return NextResponse.json({ data: updated, message: 'Invoice marked as sent' });
  } catch (err) {
    console.error('[POST /invoices/[id]/send]', err);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
