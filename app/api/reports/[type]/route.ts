import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

type Params = { params: Promise<{ type: string }> };

function dateRange(from?: string, to?: string) {
  const where: any = {};
  if (from) where.gte = new Date(from);
  if (to)   where.lte = new Date(to + 'T23:59:59');
  return Object.keys(where).length ? where : undefined;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { type } = await params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '';
    const to   = searchParams.get('to')   ?? '';
    const dr   = dateRange(from, to);

    // ── Sales by Customer ──────────────────────────────────────────────────
    if (type === 'sales-by-customer') {
      const invoices = await db.invoice.findMany({
        where: { companyId, ...(dr ? { createdAt: dr } : {}) },
        include: {
          customer: { select: { displayName: true } },
          payments: { where: { status: 'Completed' }, select: { amount: true } },
        },
      });
      const map: Record<string, { invoices: number; billed: number; paid: number }> = {};
      for (const inv of invoices) {
        const name = inv.customer?.displayName ?? 'Unknown';
        if (!map[name]) map[name] = { invoices: 0, billed: 0, paid: 0 };
        map[name].invoices++;
        map[name].billed += inv.amount;
        map[name].paid += inv.payments.reduce((s, p) => s + p.amount, 0);
      }
      const rows = Object.entries(map)
        .map(([customer, v]) => ({ customer, ...v, outstanding: v.billed - v.paid }))
        .sort((a, b) => b.billed - a.billed);
      return NextResponse.json({ columns: ['Customer', 'Invoices', 'Billed', 'Paid', 'Outstanding'], rows });
    }

    // ── Sales by Item ──────────────────────────────────────────────────────
    if (type === 'sales-by-item') {
      const items = await db.invoiceItem.findMany({
        where: { invoice: { companyId, ...(dr ? { createdAt: dr } : {}) } },
      });
      const map: Record<string, { qty: number; amount: number }> = {};
      for (const item of items) {
        const desc = item.description ?? 'Unknown';
        if (!map[desc]) map[desc] = { qty: 0, amount: 0 };
        map[desc].qty += item.quantity;
        map[desc].amount += item.total;
      }
      const rows = Object.entries(map)
        .map(([item, v]) => ({ item, ...v }))
        .sort((a, b) => b.amount - a.amount);
      return NextResponse.json({ columns: ['Item', 'Quantity', 'Amount'], rows });
    }

    // ── Sales Summary (monthly) ────────────────────────────────────────────
    if (type === 'sales-summary') {
      const invoices = await db.invoice.findMany({
        where: { companyId, status: { in: ['Paid', 'Sent', 'Partially Paid'] } },
        select: { amount: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      });
      const map: Record<string, { invoices: number; billed: number; paid: number }> = {};
      for (const inv of invoices) {
        const month = inv.createdAt.toISOString().substring(0, 7);
        if (!map[month]) map[month] = { invoices: 0, billed: 0, paid: 0 };
        map[month].invoices++;
        map[month].billed += inv.amount;
        if (inv.status === 'Paid') map[month].paid += inv.amount;
      }
      const rows = Object.entries(map).map(([month, v]) => ({ month, ...v }));
      return NextResponse.json({ columns: ['Month', 'Invoices', 'Billed', 'Paid'], rows });
    }

    // ── Invoice Details ────────────────────────────────────────────────────
    if (type === 'invoice-details') {
      const invoices = await db.invoice.findMany({
        where: { companyId, ...(dr ? { createdAt: dr } : {}) },
        include: {
          customer: { select: { displayName: true, email: true } },
          payments: { where: { status: 'Completed' }, select: { amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const rows = invoices.map(inv => ({
        invoiceNumber: inv.invoiceNumber,
        customer:      inv.customer?.displayName ?? '—',
        date:          inv.createdAt.toISOString().split('T')[0],
        dueDate:       inv.dueDate?.toISOString().split('T')[0] ?? '—',
        status:        inv.status,
        amount:        inv.amount,
        paid:          inv.payments.reduce((s, p) => s + p.amount, 0),
      }));
      return NextResponse.json({ columns: ['Invoice#', 'Customer', 'Date', 'Due Date', 'Status', 'Amount', 'Paid'], rows });
    }

    // ── Accounts Receivable ────────────────────────────────────────────────
    if (type === 'accounts-receivable') {
      const invoices = await db.invoice.findMany({
        where: { companyId, status: { in: ['Draft', 'Sent', 'Partially Paid'] } },
        include: {
          customer: { select: { displayName: true } },
          payments: { where: { status: 'Completed' }, select: { amount: true } },
        },
        orderBy: { dueDate: 'asc' },
      });
      const rows = invoices.map(inv => {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const balance = inv.amount - paid;
        const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();
        return {
          invoiceNumber: inv.invoiceNumber,
          customer:      inv.customer?.displayName ?? '—',
          dueDate:       inv.dueDate?.toISOString().split('T')[0] ?? '—',
          status:        isOverdue ? 'Overdue' : inv.status,
          amount:        inv.amount,
          paid,
          balance,
        };
      });
      return NextResponse.json({ columns: ['Invoice#', 'Customer', 'Due Date', 'Status', 'Invoice Amt', 'Paid', 'Balance Due'], rows });
    }

    // ── Aged Receivables ───────────────────────────────────────────────────
    if (type === 'aged-receivables') {
      const invoices = await db.invoice.findMany({
        where: { companyId, status: { in: ['Sent', 'Partially Paid'] } },
        include: {
          customer: { select: { displayName: true } },
          payments: { where: { status: 'Completed' }, select: { amount: true } },
        },
      });
      const now = new Date();
      const rows = invoices.map(inv => {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const balance = inv.amount - paid;
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : now;
        const days = Math.floor((now.getTime() - dueDate.getTime()) / 86400000);
        let bucket = 'Current';
        if (days > 90) bucket = '> 90 days';
        else if (days > 60) bucket = '61–90 days';
        else if (days > 30) bucket = '31–60 days';
        else if (days > 0) bucket = '1–30 days';
        return { customer: inv.customer?.displayName ?? '—', invoiceNumber: inv.invoiceNumber, daysOverdue: Math.max(0, days), bucket, balance };
      });
      return NextResponse.json({ columns: ['Customer', 'Invoice#', 'Days Overdue', 'Age Bucket', 'Balance Due'], rows: rows.sort((a, b) => b.daysOverdue - a.daysOverdue) });
    }

    // ── Customer Balance Summary ───────────────────────────────────────────
    if (type === 'customer-balance') {
      const customers = await db.customer.findMany({
        where: { companyId },
        include: {
          invoices: {
            include: { payments: { where: { status: 'Completed' }, select: { amount: true } } },
          },
        },
      });
      const rows = customers.map(c => {
        const billed = c.invoices.reduce((s, inv) => s + inv.amount, 0);
        const paid   = c.invoices.reduce((s, inv) => s + inv.payments.reduce((ps, p) => ps + p.amount, 0), 0);
        return { customer: c.displayName, invoices: c.invoices.length, billed, paid, outstanding: billed - paid };
      }).filter(r => r.billed > 0).sort((a, b) => b.outstanding - a.outstanding);
      return NextResponse.json({ columns: ['Customer', 'Invoices', 'Total Billed', 'Total Paid', 'Outstanding'], rows });
    }

    // ── Overdue Invoices ───────────────────────────────────────────────────
    if (type === 'overdue-invoices') {
      const now = new Date();
      const invoices = await db.invoice.findMany({
        where: { companyId, status: { in: ['Sent', 'Partially Paid'] }, dueDate: { lt: now } },
        include: {
          customer: { select: { displayName: true, email: true, phone: true } },
          payments: { where: { status: 'Completed' }, select: { amount: true } },
        },
        orderBy: { dueDate: 'asc' },
      });
      const rows = invoices.map(inv => {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const days = Math.floor((now.getTime() - new Date(inv.dueDate!).getTime()) / 86400000);
        return { invoiceNumber: inv.invoiceNumber, customer: inv.customer?.displayName ?? '—', phone: inv.customer?.phone ?? '—', dueDate: inv.dueDate?.toISOString().split('T')[0] ?? '—', daysOverdue: days, amount: inv.amount, paid, balance: inv.amount - paid };
      });
      return NextResponse.json({ columns: ['Invoice#', 'Customer', 'Phone', 'Due Date', 'Days Overdue', 'Amount', 'Paid', 'Balance'], rows });
    }

    // ── Payment Summary (monthly) ──────────────────────────────────────────
    if (type === 'payment-summary') {
      const payments = await db.payment.findMany({
        where: { companyId, status: 'Completed', ...(dr ? { date: dr } : {}) },
        orderBy: { date: 'asc' },
      });
      const map: Record<string, { count: number; amount: number }> = {};
      for (const p of payments) {
        const month = p.date.toISOString().substring(0, 7);
        if (!map[month]) map[month] = { count: 0, amount: 0 };
        map[month].count++;
        map[month].amount += p.amount;
      }
      const rows = Object.entries(map).map(([month, v]) => ({ month, ...v }));
      return NextResponse.json({ columns: ['Month', 'Transactions', 'Amount Received'], rows });
    }

    // ── Payment by Method ──────────────────────────────────────────────────
    if (type === 'payment-by-method') {
      const payments = await db.payment.findMany({
        where: { companyId, status: 'Completed' },
        select: { method: true, amount: true },
      });
      const map: Record<string, { count: number; amount: number }> = {};
      for (const p of payments) {
        if (!map[p.method]) map[p.method] = { count: 0, amount: 0 };
        map[p.method].count++;
        map[p.method].amount += p.amount;
      }
      const rows = Object.entries(map).map(([method, v]) => ({ method, ...v })).sort((a, b) => b.amount - a.amount);
      return NextResponse.json({ columns: ['Method', 'Transactions', 'Amount'], rows });
    }

    // ── Payment Details ────────────────────────────────────────────────────
    if (type === 'payment-details') {
      const payments = await db.payment.findMany({
        where: { companyId, ...(dr ? { date: dr } : {}) },
        include: {
          customer: { select: { displayName: true } },
          invoice:  { select: { invoiceNumber: true } },
        },
        orderBy: { date: 'desc' },
      });
      const rows = payments.map(p => ({
        date: p.date.toISOString().split('T')[0],
        invoiceNumber: p.invoice?.invoiceNumber ?? '—',
        customer: p.customer?.displayName ?? '—',
        method: p.method,
        transactionId: p.transactionId ?? '—',
        amount: p.amount,
        status: p.status,
      }));
      return NextResponse.json({ columns: ['Date', 'Invoice#', 'Customer', 'Method', 'Txn ID', 'Amount', 'Status'], rows });
    }

    // ── Expense Summary (monthly) ──────────────────────────────────────────
    if (type === 'expense-summary') {
      const expenses = await db.expense.findMany({
        where: { companyId, ...(dr ? { date: dr } : {}) },
        orderBy: { date: 'asc' },
      });
      const map: Record<string, { count: number; amount: number }> = {};
      for (const e of expenses) {
        const month = e.date.toISOString().substring(0, 7);
        if (!map[month]) map[month] = { count: 0, amount: 0 };
        map[month].count++;
        map[month].amount += e.amount;
      }
      const rows = Object.entries(map).map(([month, v]) => ({ month, ...v }));
      return NextResponse.json({ columns: ['Month', 'Expenses', 'Total Amount'], rows });
    }

    // ── Expense by Category ────────────────────────────────────────────────
    if (type === 'expense-by-category') {
      const expenses = await db.expense.findMany({
        where: { companyId, ...(dr ? { date: dr } : {}) },
        include: { category: { select: { name: true, color: true } } },
      });
      const map: Record<string, { count: number; amount: number; color: string }> = {};
      for (const e of expenses) {
        const name = e.category?.name ?? 'Uncategorized';
        if (!map[name]) map[name] = { count: 0, amount: 0, color: e.category?.color ?? '#888' };
        map[name].count++;
        map[name].amount += e.amount;
      }
      const rows = Object.entries(map).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.amount - a.amount);
      return NextResponse.json({ columns: ['Category', 'Expenses', 'Total Amount'], rows });
    }

    // ── Expense Details ────────────────────────────────────────────────────
    if (type === 'expense-details') {
      const expenses = await db.expense.findMany({
        where: { companyId, ...(dr ? { date: dr } : {}) },
        include: { category: { select: { name: true } } },
        orderBy: { date: 'desc' },
      });
      const rows = expenses.map(e => ({
        date: e.date.toISOString().split('T')[0],
        description: e.description,
        category: e.category?.name ?? '—',
        amount: e.amount,
      }));
      return NextResponse.json({ columns: ['Date', 'Description', 'Category', 'Amount'], rows });
    }

    // ── Subscription Summary ───────────────────────────────────────────────
    if (type === 'subscription-summary') {
      const subs = await db.subscription.findMany({
        where: { companyId },
        include: { customer: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const rows = subs.map(s => ({
        customer: s.customer?.displayName ?? '—',
        plan: s.planName,
        status: s.status,
        frequency: s.billingCycle,
        amount: s.amount,
        startDate: s.startDate.toISOString().split('T')[0],
        nextBilling: s.nextBillingDate?.toISOString().split('T')[0] ?? '—',
      }));
      return NextResponse.json({ columns: ['Customer', 'Plan', 'Status', 'Frequency', 'Amount', 'Start Date', 'Next Billing'], rows });
    }

    // ── Quote Summary ──────────────────────────────────────────────────────
    if (type === 'quote-summary') {
      const quotes = await db.quote.findMany({
        where: { companyId, ...(dr ? { createdAt: dr } : {}) },
        include: { customer: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const rows = quotes.map(q => ({
        quoteNumber: q.quoteNumber,
        customer: q.customer?.displayName ?? '—',
        date: q.quoteDate.toISOString().split('T')[0],
        expiry: q.expiryDate?.toISOString().split('T')[0] ?? '—',
        status: q.status,
        total: q.total,
        converted: q.convertedToInvoice ? 'Yes' : 'No',
      }));
      return NextResponse.json({ columns: ['Quote#', 'Customer', 'Date', 'Expiry', 'Status', 'Total', 'Converted'], rows });
    }

    // ── Credit Note Summary ────────────────────────────────────────────────
    if (type === 'credit-note-summary') {
      const cns = await db.creditNote.findMany({
        where: { companyId, ...(dr ? { createdAt: dr } : {}) },
        include: { customer: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
      });
      const rows = cns.map(cn => ({
        creditNoteNumber: cn.creditNoteNumber,
        customer: cn.customer?.displayName ?? '—',
        date: cn.creditNoteDate.toISOString().split('T')[0],
        status: cn.status,
        total: cn.total,
        reason: cn.reason ?? '—',
      }));
      return NextResponse.json({ columns: ['Credit Note#', 'Customer', 'Date', 'Status', 'Total', 'Reason'], rows });
    }

    // ── Customer Activity ──────────────────────────────────────────────────
    if (type === 'customer-activity') {
      const customers = await db.customer.findMany({
        where: { companyId },
        include: {
          invoices:  { select: { amount: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
          payments:  { select: { amount: true, date: true },                   orderBy: { date: 'desc' }, take: 1 },
          _count: { select: { invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const rows = customers.map(c => ({
        customer:     c.displayName,
        email:        c.email ?? '—',
        phone:        c.phone ?? '—',
        totalInvoices: c._count.invoices,
        lastInvoice:  c.invoices[0]?.createdAt?.toISOString().split('T')[0] ?? '—',
        lastPayment:  c.payments[0]?.date?.toISOString().split('T')[0] ?? '—',
      }));
      return NextResponse.json({ columns: ['Customer', 'Email', 'Phone', 'Total Invoices', 'Last Invoice', 'Last Payment'], rows });
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 404 });
  } catch (err) {
    console.error('[GET /reports/type]', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
