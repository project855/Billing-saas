import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const createSchema = z.object({
  name:          z.string().min(1, 'Item name is required'),
  type:          z.enum(['product', 'service']),
  sku:           z.string().optional().nullable(),
  unit:          z.string().min(1, 'Unit is required'),
  sellingPrice:  z.number().min(0),
  purchasePrice: z.number().optional().nullable(),
  taxable:       z.boolean().default(true),
  taxRate:       z.number().min(0).max(100).default(18),
  hsnCode:       z.string().optional().nullable(),
  description:   z.string().optional().nullable(),
  status:        z.enum(['active', 'inactive']).default('active'),
});

// GET /api/items
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const { searchParams } = new URL(request.url);
    const search  = searchParams.get('search') ?? '';
    const type    = searchParams.get('type')   ?? 'all';
    const status  = searchParams.get('status') ?? 'active'; // default: only active

    const where: any = { companyId };

    if (status !== 'all') where.status = status;
    if (type !== 'all')   where.type   = type;

    if (search) {
      where.OR = [
        { name:    { contains: search } },
        { sku:     { contains: search } },
        { hsnCode: { contains: search } },
      ];
    }

    const [items, total, productCount, serviceCount] = await Promise.all([
      db.item.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.item.count({ where: { companyId, status: 'active' } }),
      db.item.count({ where: { companyId, status: 'active', type: 'product' } }),
      db.item.count({ where: { companyId, status: 'active', type: 'service' } }),
    ]);

    return NextResponse.json({ items, stats: { total, productCount, serviceCount } });
  } catch (err) {
    console.error('[GET /api/items]', err);
    return NextResponse.json({ items: [], stats: { total: 0, productCount: 0, serviceCount: 0 } });
  }
}

// POST /api/items
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const body      = await request.json();
    const parsed    = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const d = parsed.data;

    // Auto-generate SKU if not provided
    let sku = d.sku?.trim() || null;
    if (!sku) {
      const count = await db.item.count({ where: { companyId } });
      const prefix = d.type === 'service' ? 'SVC' : 'PRD';
      sku = `${prefix}-${String(count + 1).padStart(3, '0')}`;
    } else {
      // Check duplicate SKU within company
      const existing = await db.item.findFirst({
        where: { companyId, sku: { equals: sku } },
      });
      if (existing) {
        return NextResponse.json({ error: `SKU "${sku}" already exists` }, { status: 409 });
      }
    }

    const item = await db.item.create({
      data: {
        companyId,
        name:          d.name,
        type:          d.type,
        sku,
        unit:          d.unit,
        sellingPrice:  d.sellingPrice,
        purchasePrice: d.purchasePrice ?? null,
        taxable:       d.taxable,
        taxRate:       d.taxable ? d.taxRate : 0,
        hsnCode:       d.hsnCode   ?? null,
        description:   d.description ?? null,
        status:        d.status,
      },
    });

    return NextResponse.json({ message: 'Item created', item }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/items]', err);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
