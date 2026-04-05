'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Truck, User, CalendarDays, Tag, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Open: 'bg-blue-100 text-blue-700 border-blue-200',
  Closed: 'bg-green-100 text-green-700 border-green-200',
  Cancelled: 'bg-red-100 text-red-500 border-red-200',
};

export default function ChallanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchChallan = async () => {
    try {
      const res = await fetch(`/api/challans/${id}`);
      if (!res.ok) { toast.error('Challan not found'); router.push('/delivery-challans'); return; }
      const json = await res.json();
      setChallan(json.data);
    } catch { toast.error('Failed to load challan'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChallan(); }, [id]);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/challans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Challan marked as ${status}`); fetchChallan(); }
      else toast.error('Failed to update');
    } catch { toast.error('Something went wrong'); }
  };

  const deleteChallan = async () => {
    if (!confirm('Delete this challan? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/challans/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Challan deleted'); router.push('/delivery-challans'); }
      else toast.error('Failed to delete');
    } catch { toast.error('Something went wrong'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading…</div>;
  if (!challan) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/delivery-challans" className="p-2 hover:bg-gray-100 rounded text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand" /> {challan.challanNumber}
            </h1>
            <p className="text-xs text-gray-400">{challan.challanType}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[challan.status] ?? ''}`}>
            {challan.status}
          </span>
          {challan.convertedToInvoice && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
              <Receipt className="w-3.5 h-3.5" /> Invoiced
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {challan.status === 'Draft' && <Button variant="outline" onClick={() => updateStatus('Open')} className="text-blue-600 border-blue-200 hover:bg-blue-50">Mark as Open</Button>}
          {challan.status === 'Open' && <Button variant="outline" onClick={() => updateStatus('Closed')} className="text-green-600 border-green-200 hover:bg-green-50">Mark as Closed</Button>}
          {challan.status !== 'Cancelled' && <Button variant="outline" onClick={() => updateStatus('Cancelled')} className="text-red-500 border-red-200 hover:bg-red-50">Cancel</Button>}
          <Button onClick={() => window.print()} variant="outline" className="gap-2 text-gray-600">Print</Button>
          <Button variant="outline" onClick={deleteChallan} className="text-gray-500 border-gray-200">Delete</Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-brand" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{challan.customer?.displayName}</p>
                {challan.customer?.email && <p className="text-gray-500 text-sm">{challan.customer.email}</p>}
                {challan.customer?.phone && <p className="text-gray-400 text-sm">{challan.customer.phone}</p>}
                {challan.customer?.billingAddress && <p className="text-gray-400 text-xs mt-1">{challan.customer.billingAddress}</p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          {challan.items?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-6 py-4 border-b border-gray-100">Items</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">Item</th>
                    <th className="text-center py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Qty</th>
                    <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Rate (₹)</th>
                    <th className="text-right py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {challan.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-gray-900">{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-5 text-right text-sm text-gray-500">Sub Total</td>
                    <td className="py-2.5 px-5 text-right font-mono font-bold text-gray-800">{challan.subTotal?.toFixed(2)}</td>
                  </tr>
                  {challan.discount > 0 && (
                    <tr>
                      <td colSpan={3} className="py-2 px-5 text-right text-sm text-gray-500">
                        Discount ({challan.discountType === 'percent' ? `${challan.discount}%` : `₹${challan.discount}`})
                      </td>
                      <td className="py-2 px-5 text-right font-mono text-emerald-600">
                        -{challan.discountType === 'percent'
                          ? ((challan.subTotal * challan.discount) / 100).toFixed(2)
                          : challan.discount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {challan.adjustment !== 0 && (
                    <tr>
                      <td colSpan={3} className="py-2 px-5 text-right text-sm text-gray-500">Adjustment</td>
                      <td className="py-2 px-5 text-right font-mono text-gray-700">{challan.adjustment?.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="py-3 px-5 text-right font-black text-gray-800 uppercase tracking-wide text-xs">Total (₹)</td>
                    <td className="py-3 px-5 text-right font-black text-gray-900 font-mono text-base">{challan.total?.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Notes & Terms */}
          {(challan.customerNotes || challan.termsAndConditions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challan.customerNotes && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Notes</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{challan.customerNotes}</p>
                </div>
              )}
              {challan.termsAndConditions && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Terms & Conditions</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{challan.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Challan Details</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: <Tag className="w-4 h-4 text-gray-400" />, label: 'Number', value: challan.challanNumber },
                { icon: <FileText className="w-4 h-4 text-gray-400" />, label: 'Ref #', value: challan.referenceNo || '—' },
                { icon: <CalendarDays className="w-4 h-4 text-gray-400" />, label: 'Date', value: format(new Date(challan.challanDate), 'dd MMM yyyy') },
                { icon: <Truck className="w-4 h-4 text-gray-400" />, label: 'Type', value: challan.challanType },
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
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Activity</h2>
            <p className="text-xs text-gray-400">Created {format(new Date(challan.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
