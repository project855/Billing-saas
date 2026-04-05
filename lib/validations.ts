import { z } from 'zod';

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  customerId: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.string().default('DRAFT'),
  tax: z.number().optional(),
  discountAmount: z.number().optional(),
  discountPercent: z.number().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      tax: z.number().optional(),
    })
  ).min(1),
});

export const createExpenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  date: z.string(),
  merchant: z.string().optional(),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().min(0),
  method: z.string().min(1),
  receivedDate: z.string(),
  reference: z.string().optional(),
});
