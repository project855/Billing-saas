import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

// GET /api/subscriptions/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const subscription = await db.subscription.findFirst({
      where: { id: params.id, companyId },
      include: {
        customer: { select: { id: true, displayName: true, email: true, phone: true, billingAddress: true } },
        items: true,
      },
    });

    if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: subscription });
  } catch (err) {
    console.error('[GET /subscriptions/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

// PATCH /api/subscriptions/[id]  (status updates, cancellation, etc.)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const body = await request.json();

    const subscription = await db.subscription.findFirst({ where: { id: params.id, companyId } });
    if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await db.subscription.update({
      where: { id: params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.refNumber !== undefined && { refNumber: body.refNumber }),
      },
      include: {
        customer: { select: { id: true, displayName: true, email: true } },
        items: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /subscriptions/[id]]', err);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// DELETE /api/subscriptions/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const subscription = await db.subscription.findFirst({ where: { id: params.id, companyId } });
    if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.subscription.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Subscription deleted' });
  } catch (err) {
    console.error('[DELETE /subscriptions/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
