'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileX, User, CalendarDays, FileText, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Open: 'bg-blue-100 text-blue-700 border-blue-200',
  Closed: 'bg-green-100 text-green-700 border-green-200',
  Void: 'bg-red-100 text-red-500 border-red-200',
};

export default function CreditNoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchNote = async () => {
    try {
      const res  = await fetch(`/api/credit-notes/${id}`);
      if (!res.ok) { toast.error('Credit note not found'); router.push('/credit-notes'); return; }
      const json = await res.json();
      setNote(json.data);
    } catch { toast.error('Failed to load credit note'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNote(); }, [id]);

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/credit-notes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success(`Credit note marked as ${status}`); fetchNote(); }
    else toast.error('Failed to update');
  };

  const deleteNote = async () => {
    if (!confirm('Delete this credit note?')) return;
    const res = await fetch(`/api/credit-notes/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); router.push('/credit-notes'); }
    else toast.error('Failed to delete');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading…</div>;
  if (!note) return null;

  const taxTotal = note.items?.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice * i.taxRate) / 100, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/credit-notes" className="p-2 hover:bg-gray-100 rounded text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileX className="w-5 h-5 text-brand" /> {note.creditNoteNumber}
            </h1>
            {note.reason && <p className="text-xs text-gray-400">{note.reason}</p>}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[note.status] ?? ''}`}>
            {note.status}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {note.status === 'Draft' && <Button variant="outline" onClick={() => updateStatus('Open')} className="text-blue-600 border-blue-200 hover:bg-blue-50">Mark as Open</Button>}
          {note.status === 'Open' && <Button variant="outline" onClick={() => updateStatus('Closed')} className="text-green-600 border-green-200 hover:bg-green-50">Mark as Closed</Button>}
          {note.status !== 'Void' && <Button variant="outline" onClick={() => updateStatus('Void')} className="text-red-500 border-red-200 hover:bg-red-50">Void</Button>}
          <Button onClick={() => window.print()} variant="outline" className="text-gray-600">Print</Button>
          <Button variant="outline" onClick={deleteNote} className="text-gray-500">Delete</Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-brand" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{note.customer?.displayName}</p>
                {note.customer?.email && <p className="text-gray-500 text-sm">{note.customer.email}</p>}
                {note.customer?.phone && <p className="text-gray-400 text-sm">{note.customer.phone}</p>}
                {note.customer?.billingAddress && <p className="text-gray-400 text-xs mt-1">{note.customer.billingAddress}</p>}
              </div>
            </div>
            {note.originalInvoiceRef && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Against Invoice:</span>
                <span className="font-mono font-bold text-gray-800">{note.originalInvoiceRef}</span>
              </div>
            )}
          </div>

          {/* Items */}
          {note.items?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-6 py-4 border-b border-gray-100">Items</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">Item</th>
                    <th className="text-center py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Qty</th>
                    <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Rate (₹)</th>
                    <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Tax %</th>
                    <th className="text-right py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {note.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{item.taxRate}%</td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-gray-900">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-5 text-right text-sm text-gray-500">Sub Total</td>
                    <td className="py-2.5 px-5 text-right font-mono font-bold text-gray-800">{note.subTotal?.toFixed(2)}</td>
                  </tr>
                  {taxTotal > 0 && (
                    <tr>
                      <td colSpan={4} className="py-2 px-5 text-right text-sm text-gray-500">Tax</td>
                      <td className="py-2 px-5 text-right font-mono text-gray-700">{taxTotal.toFixed(2)}</td>
                    </tr>
                  )}
                  {note.discount > 0 && (
                    <tr>
                      <td colSpan={4} className="py-2 px-5 text-right text-sm text-gray-500">Discount ({note.discountType === 'percent' ? `${note.discount}%` : `₹${note.discount}`})</td>
                      <td className="py-2 px-5 text-right font-mono text-emerald-600">
                        -{note.discountType === 'percent' ? (((note.subTotal + taxTotal) * note.discount) / 100).toFixed(2) : note.discount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {note.adjustment !== 0 && (
                    <tr>
                      <td colSpan={4} className="py-2 px-5 text-right text-sm text-gray-500">Adjustment</td>
                      <td className="py-2 px-5 text-right font-mono text-gray-700">{note.adjustment?.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={4} className="py-3 px-5 text-right font-black text-gray-800 uppercase tracking-wide text-xs">Total Credit (₹)</td>
                    <td className="py-3 px-5 text-right font-black text-brand font-mono text-lg">{note.total?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Notes & Terms */}
          {(note.customerNotes || note.termsAndConditions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {note.customerNotes && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Notes</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.customerNotes}</p>
                </div>
              )}
              {note.termsAndConditions && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Terms & Conditions</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Credit Note Details</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: <Tag className="w-4 h-4 text-gray-400" />,         label: 'Number',   value: note.creditNoteNumber },
                { icon: <CalendarDays className="w-4 h-4 text-gray-400" />, label: 'Date',     value: format(new Date(note.creditNoteDate), 'dd MMM yyyy') },
                { icon: <FileText className="w-4 h-4 text-gray-400" />,     label: 'Reason',   value: note.reason || '—' },
                { icon: <FileX className="w-4 h-4 text-gray-400" />,        label: 'Inv Ref',  value: note.originalInvoiceRef || '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="mt-0.5">{icon}</span>
                  <span className="text-gray-500 w-16 shrink-0">{label}</span>
                  <span className="font-semibold text-gray-800 flex-1">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Items</span><span>{note.items?.length ?? 0}</span></div>
              <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                <span className="text-gray-800">Total Credit</span>
                <span className="text-brand">₹{note.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Activity</h2>
            <p className="text-xs text-gray-400">Created {format(new Date(note.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
