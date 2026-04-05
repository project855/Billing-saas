import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';

type Params = { params: Promise<{ id: string }> };

// GET /api/items/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const item = await db.item.findFirst({ where: { id, companyId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    return NextResponse.json(item);
  } catch (err) {
    console.error('[GET /api/items/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT /api/items/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const existing = await db.item.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    const body = await request.json();

    // Duplicate SKU check (exclude current item)
    if (body.sku && body.sku !== existing.sku) {
      const conflict = await db.item.findFirst({
        where: { companyId, sku: { equals: body.sku }, id: { not: id } },
      });
      if (conflict) return NextResponse.json({ error: `SKU "${body.sku}" already exists` }, { status: 409 });
    }

    const updated = await db.item.update({
      where: { id },
      data: {
        name:          body.name          ?? existing.name,
        type:          body.type          ?? existing.type,
        sku:           body.sku           ?? existing.sku,
        unit:          body.unit          ?? existing.unit,
        sellingPrice:  body.sellingPrice  != null ? parseFloat(body.sellingPrice)  : existing.sellingPrice,
        purchasePrice: body.purchasePrice != null ? parseFloat(body.purchasePrice) : null,
        taxable:       body.taxable       ?? existing.taxable,
        taxRate:       body.taxable       ? (parseFloat(body.taxRate) || 0) : 0,
        hsnCode:       body.hsnCode       ?? null,
        description:   body.description   ?? null,
        status:        body.status        ?? existing.status,
      },
    });

    return NextResponse.json({ message: 'Item updated', item: updated });
  } catch (err) {
    console.error('[PUT /api/items/[id]]', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE /api/items/[id] → soft deactivate
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id }    = await params;
    const companyId = await getOrCreateCompanyId(session.user.id);

    const existing = await db.item.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    await db.item.update({ where: { id }, data: { status: 'inactive' } });
    return NextResponse.json({ message: 'Item deactivated' });
  } catch (err) {
    console.error('[DELETE /api/items/[id]]', err);
    return NextResponse.json({ error: 'Failed to deactivate item' }, { status: 500 });
  }
}
