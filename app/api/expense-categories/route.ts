import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const createSchema = z.object({
  name:  z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color').default('#6366f1'),
});

// GET /api/expense-categories
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const categories = await db.expenseCategory.findMany({
      where: { companyId },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: categories });
  } catch (err) {
    console.error('[GET /expense-categories]', err);
    return NextResponse.json({ data: [] });
  }
}

// POST /api/expense-categories
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    // Check for duplicate name
    const existing = await db.expenseCategory.findFirst({
      where: { companyId, name: { equals: parsed.data.name } },
    });
    if (existing) return NextResponse.json({ error: 'Category already exists' }, { status: 409 });

    const category = await db.expenseCategory.create({
      data: { companyId, ...parsed.data },
    });

    return NextResponse.json({ data: category, message: 'Category created' }, { status: 201 });
  } catch (err) {
    console.error('[POST /expense-categories]', err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
