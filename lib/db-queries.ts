import { db } from "./db";

// User operations
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: { workspaces: true },
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    include: { workspaces: true },
  });
}

export async function createUser(data: {
  email: string;
  name?: string;
  password: string;
}) {
  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password,
    },
  });
}

// Workspace operations
export async function getUserWorkspaces(userId: string) {
  return db.workspace.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      company: true,
      members: {
        where: { userId },
      },
    },
  });
}

export async function getWorkspaceById(id: string) {
  return db.workspace.findUnique({
    where: { id },
    include: { company: true, members: true },
  });
}

// Company operations
export async function getCompanyById(id: string) {
  return db.company.findUnique({
    where: { id },
    include: { workspace: true },
  });
}

// Customer operations
export async function getWorkspaceCustomers(workspaceId: string) {
  return db.customer.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerById(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: { invoices: true, payments: true },
  });
}

// Invoice operations
export async function getWorkspaceInvoices(workspaceId: string) {
  return db.invoice.findMany({
    where: { workspaceId },
    include: { customer: true, items: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(id: string) {
  return db.invoice.findUnique({
    where: { id },
    include: { customer: true, items: true, payments: true },
  });
}

// Payment operations
export async function getWorkspacePayments(workspaceId: string) {
  return db.payment.findMany({
    where: { workspaceId },
    include: { invoice: true, customer: true },
    orderBy: { createdAt: "desc" },
  });
}

// Expense operations
export async function getWorkspaceExpenses(workspaceId: string) {
  return db.expense.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

// Report operations
export async function getWorkspaceReports(workspaceId: string) {
  return db.report.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}
