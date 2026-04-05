'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, PauseCircle, Clock, User, CalendarDays, RefreshCw, Hash, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-700 border-green-200',
  Paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-100 text-red-600 border-red-200',
  Expired: 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = async () => {
    try {
      const res = await fetch(`/api/subscriptions/${id}`);
      if (!res.ok) { toast.error('Subscription not found'); router.push('/subscriptions'); return; }
      const json = await res.json();
      setSub(json.data);
    } catch { toast.error('Failed to load subscription'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSub(); }, [id]);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Subscription ${status.toLowerCase()}`); fetchSub(); }
      else toast.error('Failed to update');
    } catch { toast.error('Something went wrong'); }
  };

  const deleteSub = async () => {
    if (!confirm('Delete this subscription? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Subscription deleted'); router.push('/subscriptions'); }
      else toast.error('Failed to delete');
    } catch { toast.error('Something went wrong'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading…</div>;
  if (!sub) return null;

  const totalAmount = sub.items?.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/subscriptions" className="p-2 hover:bg-gray-100 rounded text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">{sub.subNumber}</h1>
            <p className="text-xs text-gray-400">{sub.profileName}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[sub.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {sub.status}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sub.status === 'Active' && <Button variant="outline" onClick={() => updateStatus('Paused')} className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">Pause</Button>}
          {sub.status === 'Paused' && <Button variant="outline" onClick={() => updateStatus('Active')} className="text-green-600 border-green-200 hover:bg-green-50">Resume</Button>}
          {sub.status !== 'Cancelled' && <Button variant="outline" onClick={() => updateStatus('Cancelled')} className="text-red-500 border-red-200 hover:bg-red-50">Cancel</Button>}
          <Button variant="outline" onClick={deleteSub} className="text-gray-500 border-gray-200">Delete</Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Customer</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{sub.customer?.displayName}</p>
                <p className="text-gray-500 text-sm">{sub.customer?.email}</p>
                {sub.customer?.phone && <p className="text-gray-400 text-sm">{sub.customer.phone}</p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          {sub.items?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-6 py-4 border-b border-gray-100">Items</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">Item</th>
                    <th className="text-center py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Qty</th>
                    <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Rate</th>
                    <th className="text-right py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sub.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-5">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-gray-900">₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={3} className="py-3 px-5 text-right font-bold text-gray-700 text-sm uppercase tracking-wide">Total per Cycle</td>
                    <td className="py-3 px-5 text-right font-black text-gray-900 font-mono text-base">
                      ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Right: Subscription details */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Subscription Details</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: <Hash className="w-4 h-4 text-gray-400" />, label: 'Number', value: sub.subNumber },
                { icon: <FileText className="w-4 h-4 text-gray-400" />, label: 'Profile', value: sub.profileName },
                { icon: <RefreshCw className="w-4 h-4 text-gray-400" />, label: 'Billing', value: `Every ${sub.billInterval} ${sub.billUnit}` },
                { icon: <CalendarDays className="w-4 h-4 text-gray-400" />, label: 'Start Date', value: format(new Date(sub.startDate), 'dd MMM yyyy') },
                { icon: <Clock className="w-4 h-4 text-gray-400" />, label: 'Expires', value: sub.neverExpires ? 'Never' : (sub.cycles ? `After ${sub.cycles} cycles` : '—') },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  {icon}
                  <span className="text-gray-500 w-20 shrink-0">{label}</span>
                  <span className="font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Terms</span><span className="font-medium text-gray-800">{sub.paymentTerms}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Mode</span><span className="font-medium text-gray-800">{sub.offlinePayment ? 'Offline' : 'Online'}</span></div>
              {sub.refNumber && <div className="flex justify-between"><span className="text-gray-500">Ref #</span><span className="font-mono text-gray-700">{sub.refNumber}</span></div>}
            </div>
          </div>

          {sub.notes && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{sub.notes}</p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Activity</h2>
            <p className="text-xs text-gray-400">Created: {format(new Date(sub.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
