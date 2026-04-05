import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session   = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const cat = await db.expenseCategory.findFirst({
      where: { id, companyId },
      include: { _count: { select: { expenses: true } } },
    });

    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    if (cat._count.expenses > 0) {
      return NextResponse.json(
        { error: `Cannot delete "${cat.name}" — it has ${cat._count.expenses} linked expense(s). Delete those expenses first.` },
        { status: 400 }
      );
    }

    await db.expenseCategory.delete({ where: { id } });
    return NextResponse.json({ message: `Category "${cat.name}" deleted` });
  } catch (err) {
    console.error('[DELETE /expense-categories/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
