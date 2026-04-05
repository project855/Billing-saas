import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateCompanyId } from '@/lib/company-context';
import { z } from 'zod';

const companySchema = z.object({
  name:       z.string().min(1, 'Company name is required'),
  email:      z.string().email().optional().nullable(),
  phone:      z.string().optional().nullable(),
  address:    z.string().optional().nullable(),
  city:       z.string().optional().nullable(),
  state:      z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country:    z.string().optional().nullable(),
  taxId:      z.string().optional().nullable(),
  currency:   z.string().default('INR'),
  logo:       z.string().optional().nullable(),
});

// GET /api/settings — returns company + all sub-settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);

    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        settings:      true,
        taxSettings:   true,
        emailSettings: { select: { id: true, fromEmail: true, fromName: true, provider: true } },
        invoiceSettings: true,
        quoteSettings: true,
        companyPlan: true,
      },
    });

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // Also return user info for Account tab
    const user = await db.user.findUnique({
      where:  { id: session.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ data: { company, user } });
  } catch (err) {
    console.error('[GET /settings]', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// PUT /api/settings — update company profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const companyId = await getOrCreateCompanyId(session.user.id, session.user.email ?? undefined);
    const body      = await request.json();

    // Handle which section is being saved
    const { section, ...data } = body;

    if (section === 'company') {
      const parsed = companySchema.safeParse(data);
      if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

      const company = await db.company.update({
        where: { id: companyId },
        data:  parsed.data,
      });
      return NextResponse.json({ message: 'Company profile saved', data: company });
    }

    if (section === 'general') {
      const settings = await db.generalSettings.upsert({
        where:  { companyId },
        update: { language: data.language, timezone: data.timezone, dateFormat: data.dateFormat, themeColor: data.themeColor },
        create: { companyId, language: data.language ?? 'en', timezone: data.timezone ?? 'Asia/Kolkata', dateFormat: data.dateFormat ?? 'dd/MM/yyyy', themeColor: data.themeColor ?? '#EF3A2A' },
      });
      return NextResponse.json({ message: 'General settings saved', data: settings });
    }

    if (section === 'tax') {
      const settings = await db.taxSettings.upsert({
        where:  { companyId },
        update: { defaultTaxRate: parseFloat(data.defaultTaxRate) || 0, taxMethod: data.taxMethod },
        create: { companyId, defaultTaxRate: parseFloat(data.defaultTaxRate) || 0, taxMethod: data.taxMethod ?? 'Exclusive' },
      });
      return NextResponse.json({ message: 'Tax settings saved', data: settings });
    }

    if (section === 'email') {
      const updateData: any = {
        fromEmail: data.fromEmail,
        fromName:  data.fromName ?? null,
        provider:  data.provider ?? 'resend',
      };
      if (data.apiKey) updateData.apiKey = data.apiKey; // only update if provided

      const settings = await db.emailSettings.upsert({
        where:  { companyId },
        update: updateData,
        create: { companyId, fromEmail: data.fromEmail ?? '', fromName: data.fromName, provider: data.provider ?? 'resend', apiKey: data.apiKey ?? null },
      });
      return NextResponse.json({ message: 'Email settings saved' });
    }

    if (section === 'invoiceSettings') {
      const settings = await db.invoiceSettings.upsert({
        where: { companyId },
        update: {
          prefix: data.prefix,
          nextNumber: parseInt(data.nextNumber) || 1,
          defaultDueDays: parseInt(data.defaultDueDays) || 30,
          defaultNotes: data.defaultNotes ?? null,
          defaultTerms: data.defaultTerms ?? null,
          showSignLine: data.showSignLine ?? true,
          showStatusStamp: data.showStatusStamp ?? true,
          accentColor: data.accentColor ?? null,
        },
        create: {
          companyId,
          prefix: data.prefix ?? 'INV-',
          nextNumber: parseInt(data.nextNumber) || 1,
          defaultDueDays: parseInt(data.defaultDueDays) || 30,
          defaultNotes: data.defaultNotes ?? null,
          defaultTerms: data.defaultTerms ?? null,
          showSignLine: data.showSignLine ?? true,
          showStatusStamp: data.showStatusStamp ?? true,
          accentColor: data.accentColor ?? null,
        },
      });
      return NextResponse.json({ message: 'Invoice settings saved', data: settings });
    }

    if (section === 'quoteSettings') {
      const settings = await db.quoteSettings.upsert({
        where: { companyId },
        update: {
          prefix: data.prefix,
          nextNumber: parseInt(data.nextNumber) || 1,
          defaultExpiryDays: parseInt(data.defaultExpiryDays) || 15,
          defaultNotes: data.defaultNotes ?? null,
          defaultTerms: data.defaultTerms ?? null,
        },
        create: {
          companyId,
          prefix: data.prefix ?? 'QT-',
          nextNumber: parseInt(data.nextNumber) || 1,
          defaultExpiryDays: parseInt(data.defaultExpiryDays) || 15,
          defaultNotes: data.defaultNotes ?? null,
          defaultTerms: data.defaultTerms ?? null,
        },
      });
      return NextResponse.json({ message: 'Quote settings saved', data: settings });
    }

    if (section === 'companyPlan') {
      // Just a stub endpoint to simulate an upgrade flow if we wanted to
      const plan = await db.companySubscription.upsert({
        where: { companyId },
        update: { planName: data.planName, status: 'Active', billingCycle: data.billingCycle ?? 'Monthly' },
        create: { companyId, planName: data.planName, status: 'Active', billingCycle: data.billingCycle ?? 'Monthly' },
      });
      return NextResponse.json({ message: 'Subscription updated successfully', data: plan });
    }

    return NextResponse.json({ error: 'Unknown settings section' }, { status: 400 });
  } catch (err) {
    console.error('[PUT /settings]', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
