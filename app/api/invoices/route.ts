import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId, nextInvoiceNumber } from '@/lib/company-context';
import { z } from 'zod';
import { logEvent } from '@/lib/log-event';

const lineItemSchema = z.object({
  itemId: z.string().optional().nullable(),
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Price must be >= 0'),
  taxRate: z.number().min(0).max(100).default(0),
});

const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  issueDate: z.string(),
  dueDate: z.string(),
  notes: z.string().optional().nullable(),
  discount: z.number().min(0).default(0),
  items: z.array(lineItemSchema).min(1, 'At least one item required'),
  type: z.string().optional(),
  template: z.string().optional(),
  salespersonId: z.string().optional().nullable(),
  metadata: z.any().optional(),
  customFields: z.array(z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.string()
  })).optional(),
});

// ─── GET /api/invoices ─────────────────────────────────────────────────────
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
        { invoiceNumber: { contains: search } },
        { customer: { displayName: { contains: search } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          customer: { select: { id: true, displayName: true, email: true } },
          items: { select: { id: true, description: true, quantity: true, unitPrice: true, tax: true, total: true } },
          payments: { select: { id: true, amount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    const data = (invoices as any[]).map(inv => {
      const paid = inv.payments.filter((p: any) => p.status === 'Completed').reduce((s: number, p: any) => s + p.amount, 0);
      return {
        ...inv,
        amountPaid: paid,
        balance: inv.amount - paid,
      };
    });

    return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET /invoices]', err);
    return NextResponse.json([], { status: 200 }); // Safe fallback
  }
}

// ─── POST /api/invoices ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { customerId, issueDate, dueDate, notes, discount, items, type, template, metadata, customFields, salespersonId } = parsed.data;

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    const processedItems = items.map(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineTax = (lineSubtotal * (item.taxRate ?? 0)) / 100;
      const lineTotal = lineSubtotal + lineTax;
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      return { ...item, tax: lineTax, total: lineTotal };
    });

    const amount = subtotal + taxTotal - (discount ?? 0);
    const invoiceNumber = await nextInvoiceNumber(companyId);

    const invoice = await db.invoice.create({
      data: {
        companyId,
        customerId,
        salespersonId: salespersonId || null,
        invoiceNumber,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: 'Draft',
        amount,
        tax: taxTotal,
        discount: discount ?? 0,
        notes: notes ?? null,
        type: type ?? 'Standard Invoice',
        template: template ?? 'Professional',
        metadata: metadata ? JSON.stringify(metadata) : null,
        customFields: customFields ? JSON.stringify(customFields) : null,
        items: {
          create: processedItems.map(item => ({
            itemId: item.itemId ?? null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: item.tax,
            total: item.total,
          })),
        },
      },
      include: {
        customer: { select: { id: true, displayName: true, email: true } },
        items: true,
      },
    });

    await logEvent({
      companyId,
      userId: session.user.id,
      eventType: 'Invoice Created',
      entityType: 'Invoice',
      entityId: invoice.id,
      entityName: `${invoice.invoiceNumber} – ${invoice.customer?.displayName}`,
    });

    return NextResponse.json({ data: invoice, message: 'Invoice created successfully' }, { status: 201 });
  } catch (err) {
    console.error('[POST /invoices]', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
