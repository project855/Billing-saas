import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const quote = await db.quote.findFirst({
      where: { id: params.id, companyId },
      include: {
        company: { select: { logo: true } },
        customer: { select: { id: true, displayName: true, email: true, phone: true, billingAddress: true, shippingAddress: true } },
        items: true,
      },
    });

    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: quote });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const quote = await db.quote.findFirst({ where: { id: params.id, companyId } });
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body    = await request.json();
    const updated = await db.quote.update({
      where: { id: params.id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.convertedToInvoice !== undefined && { convertedToInvoice: body.convertedToInvoice }),
        ...(body.invoiceId !== undefined && { invoiceId: body.invoiceId }),
      },
      include: {
        customer: { select: { id: true, displayName: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const quote = await db.quote.findFirst({ where: { id: params.id, companyId } });
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.quote.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Quote deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
