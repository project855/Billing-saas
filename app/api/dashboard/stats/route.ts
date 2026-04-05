import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { startOfMonth, endOfMonth, subMonths, format, startOfYear } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const now        = new Date();
    const thisStart  = startOfMonth(now);
    const lastStart  = startOfMonth(subMonths(now, 1));
    const lastEnd    = endOfMonth(subMonths(now, 1));

    // Fetch everything we need in one parallel shot
    const [invoices, payments, expenses, customers] = await Promise.all([
      db.invoice.findMany({
        where: { companyId },
        include: {
          customer: { select: { id: true, displayName: true } },
          payments: { where: { status: 'Completed' }, select: { amount: true, date: true } },
        },
        orderBy: { issueDate: 'desc' },
      }),
      db.payment.findMany({
        where: { companyId, status: 'Completed' },
        include: { invoice: { select: { invoiceNumber: true } } },
        orderBy: { date: 'desc' },
      }),
      db.expense.findMany({
        where: { companyId },
        include: { category: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      db.customer.findMany({
        where: { companyId, status: 'active' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // ── Revenue ─────────────────────────────────────────────────────────
    const totalRevenue     = payments.reduce((s, p) => s + p.amount, 0);
    const revenueThisMonth = payments.filter(p => new Date(p.date) >= thisStart).reduce((s, p) => s + p.amount, 0);
    const revenueLastMonth = payments.filter(p => new Date(p.date) >= lastStart && new Date(p.date) <= lastEnd).reduce((s, p) => s + p.amount, 0);
    const revenueTrend     = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueThisMonth > 0 ? 100 : 0;

    // ── Outstanding & Overdue ─────────────────────────────────────────────
    const openInvoices = invoices.filter(inv => !['Paid', 'Cancelled'].includes(inv.status));
    const outstanding  = openInvoices.reduce((s, inv) => {
      const paid = inv.payments.reduce((ps, p) => ps + p.amount, 0);
      return s + Math.max(0, inv.amount - paid);
    }, 0);

    const overdueInvoices = openInvoices.filter(inv => new Date(inv.dueDate) < now);
    const overdue         = overdueInvoices.reduce((s, inv) => {
      const paid = inv.payments.reduce((ps, p) => ps + p.amount, 0);
      return s + Math.max(0, inv.amount - paid);
    }, 0);

    // ── Active Clients ──────────────────────────────────────────────────
    const activeClients    = customers.length;
    const activeClientsNew = customers.filter(c => new Date(c.createdAt) >= thisStart).length;

    // ── Monthly Revenue Chart (last 6 months) ────────────────────────────
    const revenueChart = [];
    for (let m = 5; m >= 0; m--) {
      const d     = subMonths(now, m);
      const start = startOfMonth(d);
      const end   = endOfMonth(d);
      const value = payments
        .filter(p => new Date(p.date) >= start && new Date(p.date) <= end)
        .reduce((s, p) => s + p.amount, 0);
      revenueChart.push({ month: format(d, 'MMM'), value });
    }

    // ── Pending Invoices (top 5 open) ────────────────────────────────────
    const pendingInvoices = openInvoices.slice(0, 5).map(inv => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const isOverdue = new Date(inv.dueDate) < now;
      return {
        id:       inv.id,
        number:   inv.invoiceNumber,
        customer: inv.customer?.displayName ?? '—',
        amount:   Math.max(0, inv.amount - paid),
        dueDate:  format(new Date(inv.dueDate), 'dd MMM yyyy'),
        status:   isOverdue ? 'Overdue' : inv.status,
      };
    });

    // ── Recent Activity (interleaved invoices + payments + expenses) ──────
    const activityItems: { time: Date; text: string; color: string }[] = [];

    // Recent payments (up to 3)
    for (const p of payments.slice(0, 3)) {
      activityItems.push({
        time:  new Date(p.date),
        text:  `Payment of ₹${p.amount.toLocaleString('en-IN')} received — ${p.invoice?.invoiceNumber ?? ''}`,
        color: 'bg-emerald-500',
      });
    }

    // Recent sent invoices (up to 3)
    for (const inv of invoices.filter(i => i.status === 'Sent').slice(0, 3)) {
      activityItems.push({
        time:  new Date(inv.issueDate),
        text:  `Invoice ${inv.invoiceNumber} sent to ${inv.customer?.displayName ?? ''}`,
        color: 'bg-blue-500',
      });
    }

    // Recent overdue (up to 2)
    for (const inv of overdueInvoices.slice(0, 2)) {
      activityItems.push({
        time:  new Date(inv.dueDate),
        text:  `${inv.invoiceNumber} is overdue — ${inv.customer?.displayName ?? ''}`,
        color: 'bg-brand',
      });
    }

    // Recent expenses (up to 2)
    for (const exp of expenses.slice(0, 2)) {
      activityItems.push({
        time:  new Date(exp.date),
        text:  `Expense logged — ${exp.description} (${exp.category?.name ?? ''})`,
        color: 'bg-amber-500',
      });
    }

    // Sort by most recent first, take 6
    const recentActivity = activityItems
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 6)
      .map((a, i) => ({
        id:    i + 1,
        text:  a.text,
        color: a.color,
        time:  formatRelativeTime(a.time, now),
      }));

    return NextResponse.json({
      revenue:              totalRevenue,
      revenueTrend,
      revenueThisMonth,
      outstanding,
      outstandingInvoices:  openInvoices.length,
      overdue,
      overdueInvoices:      overdueInvoices.length,
      activeClients,
      activeClientsNew,
      totalInvoices:        invoices.length,
      totalExpenses:        expenses.reduce((s, e) => s + e.amount, 0),
      revenueChart,
      pendingInvoices,
      recentActivity,
    });
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err);
    // Return safe zeros — never crash the dashboard
    return NextResponse.json({
      revenue: 0, revenueTrend: 0, revenueThisMonth: 0,
      outstanding: 0, outstandingInvoices: 0,
      overdue: 0, overdueInvoices: 0,
      activeClients: 0, activeClientsNew: 0,
      totalInvoices: 0, totalExpenses: 0,
      revenueChart: [],
      pendingInvoices: [],
      recentActivity: [],
    });
  }
}

function formatRelativeTime(date: Date, now: Date): string {
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return 'Yesterday';
  return format(date, 'dd MMM');
}
