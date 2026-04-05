import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

const EVENT_TYPES = [
  'Customer Added', 'Customer Updated', 'Customer Deleted',
  'Invoice Created', 'Invoice Sent', 'Invoice Paid', 'Invoice Partially Paid', 'Invoice Cancelled', 'Invoice Deleted',
  'Payment Recorded', 'Payment Voided',
  'Item Added', 'Item Updated', 'Item Deleted', 'Plan Added', 'Plan Updated', 'Addon Added', 'Coupon Created',
  'Subscription Created', 'Subscription Updated', 'Subscription Paused', 'Subscription Cancelled',
  'Challan Created', 'Challan Opened', 'Challan Closed', 'Challan Cancelled',
  'Credit Note Created', 'Credit Note Voided',
  'Quote Created', 'Quote Sent', 'Quote Accepted', 'Quote Declined',
  'Expense Added', 'Expense Updated', 'Expense Deleted',
  'Settings Updated',
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const { searchParams } = new URL(request.url);
    const search    = searchParams.get('search')    ?? '';
    const eventType = searchParams.get('eventType') ?? 'all';
    const source    = searchParams.get('source')    ?? 'all';
    const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit     = 25;

    const where: any = { companyId };
    if (eventType !== 'all') where.eventType = eventType;
    if (source    !== 'all') where.eventSource = source;
    if (search) {
      where.OR = [
        { eventType:  { contains: search } },
        { entityName: { contains: search } },
        { eventId:    { contains: search } },
      ];
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.event.count({ where }),
    ]);

    return NextResponse.json({ data: events, total, page, totalPages: Math.ceil(total / limit), eventTypes: EVENT_TYPES });
  } catch (err) {
    console.error('[GET /events]', err);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 1, eventTypes: EVENT_TYPES });
  }
}
