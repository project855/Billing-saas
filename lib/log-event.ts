import { db } from '@/lib/db';

export type EventType =
  // Customers
  | 'Customer Added'
  | 'Customer Updated'
  | 'Customer Deleted'
  // Invoices
  | 'Invoice Created'
  | 'Invoice Sent'
  | 'Invoice Paid'
  | 'Invoice Partially Paid'
  | 'Invoice Cancelled'
  | 'Invoice Deleted'
  // Payments
  | 'Payment Recorded'
  | 'Payment Voided'
  // Items / Catalog
  | 'Item Added'
  | 'Item Updated'
  | 'Item Deleted'
  | 'Plan Added'
  | 'Plan Updated'
  | 'Addon Added'
  | 'Coupon Created'
  // Subscriptions
  | 'Subscription Created'
  | 'Subscription Updated'
  | 'Subscription Paused'
  | 'Subscription Cancelled'
  // Delivery Challans
  | 'Challan Created'
  | 'Challan Opened'
  | 'Challan Closed'
  | 'Challan Cancelled'
  // Credit Notes
  | 'Credit Note Created'
  | 'Credit Note Voided'
  // Quotes
  | 'Quote Created'
  | 'Quote Sent'
  | 'Quote Accepted'
  | 'Quote Declined'
  // Expenses
  | 'Expense Added'
  | 'Expense Updated'
  | 'Expense Deleted'
  // Settings
  | 'Settings Updated';

export type EventSource = 'User' | 'System' | 'API';

interface LogEventParams {
  companyId: string;
  userId?: string;
  eventType: EventType;
  eventSource?: EventSource;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, any>;
}

/** Generate a zero-padded 20-digit numeric event ID (like Zoho Books style) */
function generateEventId(): string {
  const ts   = Date.now();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${ts}${rand}`.padEnd(20, '0').substring(0, 20);
}

export async function logEvent({
  companyId,
  userId,
  eventType,
  eventSource = 'User',
  entityType,
  entityId,
  entityName,
  metadata,
}: LogEventParams): Promise<void> {
  try {
    await db.event.create({
      data: {
        companyId,
        userId:     userId ?? null,
        eventId:    generateEventId(),
        eventType,
        eventSource,
        entityType: entityType ?? null,
        entityId:   entityId ?? null,
        entityName: entityName ?? null,
        metadata:   metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    // Never throw — event logging must not break main flow
    console.error('[logEvent] Failed to log event:', err);
  }
}
