'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, User, CalendarDays, Tag, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  Draft:    'bg-gray-100 text-gray-600 border-gray-200',
  Sent:     'bg-blue-100 text-blue-700 border-blue-200',
  Accepted: 'bg-green-100 text-green-700 border-green-200',
  Declined: 'bg-red-100 text-red-500 border-red-200',
  Expired:  'bg-orange-100 text-orange-600 border-orange-200',
  Invoiced: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuote = async () => {
    try {
      const res  = await fetch(`/api/quotes/${id}`);
      if (!res.ok) { toast.error('Quote not found'); router.push('/quotes'); return; }
      const json = await res.json();
      setQuote(json.data);
    } catch { toast.error('Failed to load quote'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuote(); }, [id]);

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success(`Quote marked as ${status}`); fetchQuote(); }
    else toast.error('Failed to update');
  };

  const deleteQuote = async () => {
    if (!confirm('Delete this quote?')) return;
    const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Quote deleted'); router.push('/quotes'); }
    else toast.error('Failed to delete');
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">Loading…</div>;
  if (!quote) return null;

  const taxTotal     = quote.items?.reduce((s: number, i: any) => s + (i.quantity * i.unitPrice * i.taxRate) / 100, 0) ?? 0;
  const isExpired    = quote.expiryDate && isPast(new Date(quote.expiryDate)) && !['Accepted', 'Invoiced'].includes(quote.status);
  const displayStatus = isExpired ? 'Expired' : quote.status;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10 font-sans print:bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/quotes" className="p-2 hover:bg-gray-100 rounded text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex gap-2 items-center">
              {quote.company?.logo && <img src={quote.company.logo} alt="Company Logo" className="h-6 object-contain" />}
              <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {!quote.company?.logo && <FileText className="w-5 h-5 text-brand" />} {quote.quoteNumber}
              </h1>
            </div>
            {quote.subject && <p className="text-xs text-gray-400">{quote.subject}</p>}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[displayStatus] ?? ''}`}>{displayStatus}</span>
          {quote.convertedToInvoice && <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold">✓ Invoiced</span>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {quote.status === 'Draft' && <Button variant="outline" onClick={() => updateStatus('Sent')} className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"><Send className="w-3.5 h-3.5" />Mark as Sent</Button>}
          {quote.status === 'Sent' && (
            <>
              <Button variant="outline" onClick={() => updateStatus('Accepted')} className="gap-1 text-green-600 border-green-200 hover:bg-green-50"><CheckCircle2 className="w-3.5 h-3.5" />Accept</Button>
              <Button variant="outline" onClick={() => updateStatus('Declined')} className="gap-1 text-red-500 border-red-200 hover:bg-red-50"><XCircle className="w-3.5 h-3.5" />Decline</Button>
            </>
          )}
          <Button onClick={() => window.print()} variant="outline" className="text-gray-600">Print</Button>
          <Button variant="outline" onClick={deleteQuote} className="text-gray-500">Delete</Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Bill To</h2>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-brand" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-lg">{quote.customer?.displayName}</p>
                {quote.customer?.email && <p className="text-gray-500 text-sm">{quote.customer.email}</p>}
                {quote.customer?.phone && <p className="text-gray-400 text-sm">{quote.customer.phone}</p>}
                {quote.customer?.billingAddress && <p className="text-gray-400 text-xs mt-1 leading-relaxed">{quote.customer.billingAddress}</p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          {quote.items?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-6 py-4 border-b border-gray-100">Items</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">#</th>
                    <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Item</th>
                    <th className="text-center py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Qty</th>
                    <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Rate</th>
                    <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase">Tax %</th>
                    <th className="text-right py-2.5 px-5 text-xs font-bold text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {quote.items.map((item: any, i: number) => (
                    <tr key={item.id}>
                      <td className="py-3 px-5 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-gray-500">{item.taxRate}%</td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-gray-900">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
                  <tr><td colSpan={5} className="py-2.5 px-5 text-right text-sm text-gray-500">Sub Total</td><td className="py-2.5 px-5 text-right font-mono font-bold text-gray-800">₹{quote.subTotal?.toFixed(2)}</td></tr>
                  {taxTotal > 0 && <tr><td colSpan={5} className="py-2 px-5 text-right text-sm text-gray-500">Tax</td><td className="py-2 px-5 text-right font-mono text-gray-700">₹{taxTotal.toFixed(2)}</td></tr>}
                  {quote.discount > 0 && (
                    <tr>
                      <td colSpan={5} className="py-2 px-5 text-right text-sm text-gray-500">Discount ({quote.discountType === 'percent' ? `${quote.discount}%` : `₹${quote.discount}`})</td>
                      <td className="py-2 px-5 text-right font-mono text-emerald-600">-₹{(quote.discountType === 'percent' ? ((quote.subTotal + taxTotal) * quote.discount) / 100 : quote.discount).toFixed(2)}</td>
                    </tr>
                  )}
                  {quote.shippingCharges > 0 && <tr><td colSpan={5} className="py-2 px-5 text-right text-sm text-gray-500">Shipping</td><td className="py-2 px-5 text-right font-mono text-gray-700">₹{quote.shippingCharges?.toFixed(2)}</td></tr>}
                  {quote.adjustment !== 0 && <tr><td colSpan={5} className="py-2 px-5 text-right text-sm text-gray-500">Adjustment</td><td className="py-2 px-5 text-right font-mono text-gray-700">₹{quote.adjustment?.toFixed(2)}</td></tr>}
                  <tr><td colSpan={5} className="py-3 px-5 text-right font-black text-gray-800 uppercase tracking-wide text-xs">Total (₹)</td><td className="py-3 px-5 text-right font-black text-gray-900 font-mono text-lg">₹{quote.total?.toFixed(2)}</td></tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Notes & Terms */}
          {(quote.customerNotes || quote.termsAndConditions) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quote.customerNotes && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Customer Notes</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.customerNotes}</p>
                </div>
              )}
              {quote.termsAndConditions && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Terms & Conditions</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{quote.termsAndConditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quote Details</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: <Tag className="w-4 h-4 text-gray-400" />,           label: 'Quote #',  value: quote.quoteNumber },
                { icon: <Tag className="w-4 h-4 text-gray-400" />,           label: 'Ref #',    value: quote.referenceNo || '—' },
                { icon: <CalendarDays className="w-4 h-4 text-gray-400" />,  label: 'Date',     value: format(new Date(quote.quoteDate), 'dd MMM yyyy') },
                { icon: <Clock className="w-4 h-4 text-gray-400" />,         label: 'Expiry',   value: quote.expiryDate ? format(new Date(quote.expiryDate), 'dd MMM yyyy') : 'No Expiry' },
                { icon: <FileText className="w-4 h-4 text-gray-400" />,      label: 'Subject',  value: quote.subject || '—' },
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
              <div className="flex justify-between text-gray-600"><span>Items</span><span>{quote.items?.length ?? 0}</span></div>
              <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                <span className="text-gray-800">Total</span>
                <span className="text-gray-900">₹{quote.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Activity</h2>
            <p className="text-xs text-gray-400">Created {format(new Date(quote.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
            <p className="text-xs text-gray-400 mt-1">Updated {format(new Date(quote.updatedAt), 'dd MMM yyyy, hh:mm a')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
