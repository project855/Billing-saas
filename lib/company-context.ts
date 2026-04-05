import { db } from './db';
import { auth } from './auth';

/**
 * Gets the companyId for the currently authenticated user.
 * Returns null if not authenticated or no company found.
 */
export async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Find the first Company in the first Workspace owned by this user
  const workspace = await db.workspace.findFirst({
    where: { ownerId: session.user.id },
    include: {
      companies: {
        select: { id: true },
        take: 1,
      },
    },
  });

  return workspace?.companies?.[0]?.id ?? null;
}

/**
 * Gets companyId — creates workspace + company if first time.
 */
export async function getOrCreateCompanyId(userId: string, email?: string): Promise<string> {
  // Find a workspace that already has a company
  const existingWithCompany = await db.workspace.findFirst({
    where: { ownerId: userId, companies: { some: {} } },
    include: { companies: { select: { id: true }, take: 1 } },
  });

  if (existingWithCompany?.companies?.[0]?.id) {
    return existingWithCompany.companies[0].id;
  }

  // If no workspace has a company, check if they have ANY workspace
  const existingWorkspace = await db.workspace.findFirst({
    where: { ownerId: userId },
  });

  if (existingWorkspace) {
    const newCompany = await db.company.create({
      data: {
        workspaceId: existingWorkspace.id,
        name: 'My Company',
        email: email ?? null,
        currency: 'INR',
      }
    });
    return newCompany.id;
  }

  // First login — provision a workspace + company
  const newWorkspace = await db.workspace.create({
    data: {
      name: 'My Workspace',
      ownerId: userId,
      companies: {
        create: {
          name: 'My Company',
          email: email ?? null,
          currency: 'INR',
        },
      },
    },
    include: { companies: { select: { id: true } } },
  });

  return newWorkspace.companies[0].id;
}

/** Auto-generate next invoice number for a company, e.g. INV-0042 */
export async function nextInvoiceNumber(companyId: string): Promise<string> {
  const count = await db.invoice.count({ where: { companyId } });
  return `INV-${String(count + 1).padStart(4, '0')}`;
}
