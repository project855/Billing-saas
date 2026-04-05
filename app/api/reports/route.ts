import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from 'date-fns';

// GET /api/reports
// Returns all data needed for the reports page in one call for performance
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const now        = new Date();
    const yearStart  = startOfYear(now);

    // Fetch all in parallel
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
        orderBy: { date: 'desc' },
      }),
      db.expense.findMany({
        where: { companyId },
        include: { category: { select: { name: true, color: true } } },
        orderBy: { date: 'desc' },
      }),
      db.customer.findMany({
        where: { companyId, status: 'active' },
        select: { id: true, displayName: true },
      }),
    ]);

    // ── Invoice Summary ──────────────────────────────────────────────────
    const invoiceSummary = {
      total:     invoices.length,
      draft:     invoices.filter(i => i.status === 'Draft').length,
      sent:      invoices.filter(i => i.status === 'Sent').length,
      paid:      invoices.filter(i => i.status === 'Paid').length,
      overdue:   invoices.filter(i => !['Paid','Cancelled','Draft'].includes(i.status) && new Date(i.dueDate) < now).length,
      cancelled: invoices.filter(i => i.status === 'Cancelled').length,
      totalValue: invoices.reduce((s, i) => s + i.amount, 0),
      paidValue:  invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0),
    };

    // ── Monthly Revenue (last 6 months) ──────────────────────────────────
    const monthlyRevenue: { month: string; revenue: number; expenses: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d     = subMonths(now, m);
      const start = startOfMonth(d);
      const end   = endOfMonth(d);
      const label = format(d, 'MMM yy');

      const rev = payments
        .filter(p => new Date(p.date) >= start && new Date(p.date) <= end)
        .reduce((s, p) => s + p.amount, 0);

      const exp = expenses
        .filter(e => new Date(e.date) >= start && new Date(e.date) <= end)
        .reduce((s, e) => s + e.amount, 0);

      monthlyRevenue.push({ month: label, revenue: rev, expenses: exp });
    }

    // ── Revenue KPIs ────────────────────────────────────────────────────
    const thisMonthStart  = startOfMonth(now);
    const lastMonthStart  = startOfMonth(subMonths(now, 1));
    const lastMonthEnd    = endOfMonth(subMonths(now, 1));

    const revenueThisMonth = payments
      .filter(p => new Date(p.date) >= thisMonthStart)
      .reduce((s, p) => s + p.amount, 0);

    const revenueLastMonth = payments
      .filter(p => new Date(p.date) >= lastMonthStart && new Date(p.date) <= lastMonthEnd)
      .reduce((s, p) => s + p.amount, 0);

    const revenueYTD = payments
      .filter(p => new Date(p.date) >= yearStart)
      .reduce((s, p) => s + p.amount, 0);

    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);

    // ── Expense KPIs ─────────────────────────────────────────────────────
    const expenseThisMonth = expenses
      .filter(e => new Date(e.date) >= thisMonthStart)
      .reduce((s, e) => s + e.amount, 0);

    const expenseYTD = expenses
      .filter(e => new Date(e.date) >= yearStart)
      .reduce((s, e) => s + e.amount, 0);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    // ── Expense by Category ──────────────────────────────────────────────
    const expenseByCategory = expenses.reduce((acc: any, e) => {
      const key   = e.category?.name ?? 'Uncategorized';
      const color = (e.category as any)?.color ?? '#888';
      if (!acc[key]) acc[key] = { amount: 0, color, count: 0 };
      acc[key].amount += e.amount;
      acc[key].count++;
      return acc;
    }, {});

    // ── Top Customers by Revenue ─────────────────────────────────────────
    const customerRevMap: Record<string, { name: string; amount: number; invoices: number }> = {};
    for (const inv of invoices) {
      if (!inv.customer) continue;
      if (!customerRevMap[inv.customer.id]) {
        customerRevMap[inv.customer.id] = { name: inv.customer.displayName, amount: 0, invoices: 0 };
      }
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      customerRevMap[inv.customer.id].amount  += paid;
      customerRevMap[inv.customer.id].invoices++;
    }
    const topCustomers = Object.values(customerRevMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // ── Recent Invoices (for quick table) ────────────────────────────────
    const recentInvoices = invoices.slice(0, 8).map(inv => ({
      id:            inv.id,
      invoiceNumber: inv.invoiceNumber,
      customer:      inv.customer?.displayName ?? '—',
      amount:        inv.amount,
      status:        inv.status,
      dueDate:       inv.dueDate,
      paidAmount:    inv.payments.reduce((s, p) => s + p.amount, 0),
    }));

    return NextResponse.json({
      summary: {
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
        revenueYTD,
        totalExpenses,
        expenseThisMonth,
        expenseYTD,
        netProfit:      totalRevenue - totalExpenses,
        netProfitMonth: revenueThisMonth - expenseThisMonth,
        customerCount:  customers.length,
        growth: revenueLastMonth > 0
          ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
          : 0,
      },
      invoiceSummary,
      monthlyRevenue,
      expenseByCategory,
      topCustomers,
      recentInvoices,
    });
  } catch (err) {
    console.error('[GET /api/reports]', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
