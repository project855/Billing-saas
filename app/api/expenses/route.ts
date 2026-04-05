import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const schema = z.object({
  categoryId:  z.string().min(1, 'Category is required'),
  amount:      z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date:        z.string(),
  receiptUrl:  z.string().url().optional().nullable(),
});

// ─── GET /api/expenses ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { searchParams } = new URL(request.url);
    const search     = searchParams.get('search')     ?? '';
    const categoryId = searchParams.get('categoryId') ?? 'all';
    const from       = searchParams.get('from')       ?? '';
    const to         = searchParams.get('to')         ?? '';
    const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit      = 20;

    const where: any = { companyId };

    if (categoryId !== 'all') where.categoryId = categoryId;

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to)   where.date.lte = new Date(to + 'T23:59:59');
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: { category: { select: { id: true, name: true, color: true } } },
        orderBy: { date: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      db.expense.count({ where }),
    ]);

    // Category breakdown for summary
    const allExpenses = await db.expense.findMany({
      where: { companyId },
      include: { category: { select: { name: true, color: true } } },
    });

    const now      = new Date();
    const thisMonth = allExpenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const byCategory = allExpenses.reduce((acc: Record<string, { amount: number; color: string; count: number }>, e) => {
      const key = e.category?.name ?? 'Uncategorized';
      if (!acc[key]) acc[key] = { amount: 0, color: e.category?.color ?? '#888', count: 0 };
      acc[key].amount += e.amount;
      acc[key].count++;
      return acc;
    }, {});

    return NextResponse.json({
      data: expenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalAllTime:  allExpenses.reduce((s, e) => s + e.amount, 0),
        totalThisMonth: thisMonth.reduce((s, e) => s + e.amount, 0),
        byCategory,
      },
    });
  } catch (err) {
    console.error('[GET /expenses]', err);
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 1, stats: { totalAllTime: 0, totalThisMonth: 0, byCategory: {} } }, { status: 200 });
  }
}

// ─── POST /api/expenses ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { categoryId, amount, description, date, receiptUrl } = parsed.data;

    // Verify category belongs to this company
    const category = await db.expenseCategory.findFirst({ where: { id: categoryId, companyId } });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const expense = await db.expense.create({
      data: { companyId, categoryId, amount, description, date: new Date(date), receiptUrl: receiptUrl ?? null },
      include: { category: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json({ data: expense, message: 'Expense added successfully' }, { status: 201 });
  } catch (err) {
    console.error('[POST /expenses]', err);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}
