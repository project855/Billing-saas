import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

type Params = { params: Promise<{ id: string }> };

async function verifyInvoiceAccess(invoiceId: string, userId: string) {
  const companyId = await getOrCreateCompanyId(userId);
  const invoice = await db.invoice.findFirst({ where: { id: invoiceId, companyId } });
  return { invoice, companyId };
}

// ─── GET /api/invoices/[id] ────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { invoice, companyId } = await verifyInvoiceAccess(id, session.user.id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const full = await db.invoice.findUnique({
      where: { id },
      include: {
        company: { select: { logo: true } },
        customer: true,
        salesperson: true,
        items: { include: { item: { select: { name: true, sku: true } } } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    const amountPaid = full!.payments.filter(p => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({ data: { ...full, amountPaid, balance: full!.amount - amountPaid } });
  } catch (err) {
    console.error('[GET /invoices/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// ─── PUT /api/invoices/[id] ────────────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { invoice } = await verifyInvoiceAccess(id, session.user.id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (!['Draft', 'Sent'].includes(invoice.status)) {
      return NextResponse.json({ error: 'Cannot edit a paid or cancelled invoice' }, { status: 400 });
    }

    const body = await request.json();
    const { items, ...rest } = body;

    let updateData: any = { ...rest };

    if (items && Array.isArray(items)) {
      let subtotal = 0, taxTotal = 0;
      const processed = items.map((item: any) => {
        const ls = item.quantity * item.unitPrice;
        const lt = (ls * (item.taxRate ?? 0)) / 100;
        subtotal += ls; taxTotal += lt;
        return { description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, tax: lt, total: ls + lt, itemId: item.itemId ?? null };
      });
      updateData.amount = subtotal + taxTotal - (rest.discount ?? invoice.discount ?? 0);
      updateData.tax = taxTotal;

      await db.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await db.invoiceItem.createMany({ data: processed.map(i => ({ ...i, invoiceId: id })) });
    }

    const updated = await db.invoice.update({ where: { id }, data: updateData });
    return NextResponse.json({ data: updated, message: 'Invoice updated' });
  } catch (err) {
    console.error('[PUT /invoices/[id]]', err);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// ─── DELETE /api/invoices/[id] ─────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { invoice } = await verifyInvoiceAccess(id, session.user.id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (invoice.status === 'Paid') return NextResponse.json({ error: 'Cannot delete a paid invoice' }, { status: 400 });

    // Soft cancel (keep for records) or hard delete for drafts
    if (invoice.status === 'Draft') {
      await db.invoice.delete({ where: { id } });
    } else {
      await db.invoice.update({ where: { id }, data: { status: 'Cancelled' } });
    }

    return NextResponse.json({ message: invoice.status === 'Draft' ? 'Invoice deleted' : 'Invoice cancelled' });
  } catch (err) {
    console.error('[DELETE /invoices/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
