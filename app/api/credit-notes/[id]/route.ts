import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const note = await db.creditNote.findFirst({
      where: { id: params.id, companyId },
      include: {
        customer: { select: { id: true, displayName: true, email: true, phone: true, billingAddress: true } },
        items: true,
      },
    });

    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: note });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch credit note' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const note = await db.creditNote.findFirst({ where: { id: params.id, companyId } });
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body    = await request.json();
    const updated = await db.creditNote.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.reason !== undefined && { reason: body.reason }),
        ...(body.customerNotes !== undefined && { customerNotes: body.customerNotes }),
      },
      include: {
        customer: { select: { id: true, displayName: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update credit note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const note = await db.creditNote.findFirst({ where: { id: params.id, companyId } });
    if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.creditNote.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Credit note deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete credit note' }, { status: 500 });
  }
}
