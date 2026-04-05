import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { formatDistanceToNow } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    // Fetch overdue invoices
    const overdueInvoices = await db.invoice.findMany({
      where: { 
        companyId, 
        status: { in: ['Sent', 'Draft'] },
        dueDate: { lt: new Date() }
      },
      include: { customer: { select: { displayName: true } } },
      orderBy: { dueDate: 'asc' },
      take: 3
    });

    // Fetch recent payments (or just invoices marked as Paid recently)
    const paidInvoices = await db.invoice.findMany({
      where: { companyId, status: 'Paid' },
      include: { customer: { select: { displayName: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 2
    });

    // Format notifications
    const notifications = [];

    // System Welcome Context (always pushed at the bottom for safety, or we could fetch recent login Event)
    notifications.push({
      id: 'sys-1',
      type: 'system',
      title: 'Welcome Back!',
      desc: 'Your billing dashboard is fully active and syncing.',
      time: 'Just now'
    });

    for (const inv of overdueInvoices) {
      notifications.push({
        id: `overdue-${inv.id}`,
        type: 'alert',
        title: 'Invoice Overdue',
        desc: `Invoice ${inv.invoiceNumber} for ${inv.customer?.displayName || 'Unknown'} is overdue as of ${inv.dueDate.toLocaleDateString()}.`,
        time: formatDistanceToNow(new Date(inv.dueDate), { addSuffix: true })
      });
    }

    for (const inv of paidInvoices) {
      notifications.push({
        id: `paid-${inv.id}`,
        type: 'payment',
        title: 'Payment Received',
        desc: `Invoice ${inv.invoiceNumber} from ${inv.customer?.displayName || 'Unknown'} has been paid!`,
        time: formatDistanceToNow(new Date(inv.updatedAt), { addSuffix: true })
      });
    }

    // Sort notifications so they look random or time-based (ideally if we had actual event logs we'd sort by time)
    // Here we'll just reverse so the most relevant are top.
    const finalNotifs = notifications.reverse();

    return NextResponse.json({ data: finalNotifs });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
