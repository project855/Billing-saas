import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  categoryId:  z.string().optional(),
  amount:      z.number().positive().optional(),
  description: z.string().min(1).optional(),
  date:        z.string().optional(),
  receiptUrl:  z.string().url().optional().nullable(),
});

// GET /api/expenses/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session   = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);
    const expense   = await db.expense.findFirst({
      where: { id, companyId },
      include: { category: true },
    });
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    return NextResponse.json({ data: expense });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

// PUT /api/expenses/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session   = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const existing = await db.expense.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    const body   = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const data: any = { ...parsed.data };
    if (data.date) data.date = new Date(data.date);

    const updated = await db.expense.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json({ data: updated, message: 'Expense updated' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session   = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const existing = await db.expense.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

    await db.expense.delete({ where: { id } });
    return NextResponse.json({ message: 'Expense deleted' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
