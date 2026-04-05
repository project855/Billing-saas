import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const createSchema = z.object({
  name:  z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().nullable(),
  phone: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    
    const salespersons = await db.salesperson.findMany({
      where: { companyId, status: 'active' },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(salespersons);
  } catch (err) {
    console.error('[GET /salespersons]', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const salesperson = await db.salesperson.create({
      data: { 
        companyId, 
        name: parsed.data.name,
        email: parsed.data.email || '',
        phone: parsed.data.phone || '',
        status: 'active' 
      },
    });

    return NextResponse.json({ message: 'Salesperson created successfully', salesperson }, { status: 201 });
  } catch (err) {
    console.error('[POST /salespersons]', err);
    return NextResponse.json({ error: 'Failed to create salesperson' }, { status: 500 });
  }
}
