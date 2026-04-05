'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface LineItem { _id: string; itemId: string | null; name: string; description: string; quantity: number; unitPrice: number; taxRate: number; }
interface Customer { id: string; displayName: string; email: string; phone?: string; billingAddress?: string; }
interface CatalogItem { id: string; name: string; sellingPrice: number; taxRate: number; description?: string; }

const cls = "w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-brand/60 transition-all";
const REASONS = ['Goods Returned', 'Post-sale Discount', 'Incorrect Billing', 'Cancellation', 'Quality Issue', 'Duplicate Invoice', 'Other'];
const newItem = (id?: string, defaultTaxRate: number = 0): LineItem => ({ _id: id || crypto.randomUUID(), itemId: null, name: '', description: '', quantity: 1, unitPrice: 0, taxRate: defaultTaxRate });

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
      <label className="text-[13px] font-medium text-red-500 sm:w-52 pt-2 shrink-0">{label}{required && '*'}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

import { useSettings } from '@/lib/settings-context';

export default function NewCreditNotePage() {
  const router = useRouter();
  const { taxRate: defaultTaxRate, taxMethod } = useSettings();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // Customer
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isCustomerNew, setIsCustomerNew] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // Credit note fields
  const [creditNoteNumber, setCreditNoteNumber] = useState('CN-00001');
  const [originalInvoiceRef, setOriginalInvoiceRef] = useState('');
  const [creditNoteDate, setCreditNoteDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [adjustment, setAdjustment] = useState(0);
  const [items, setItems] = useState<LineItem[]>([newItem('initial-item-1', defaultTaxRate)]);

  useEffect(() => {
    Promise.all([fetch('/api/customers'), fetch('/api/items')]).then(async ([cr, ir]) => {
      const cd = await cr.json(); const id = await ir.json();
      setCustomers(Array.isArray(cd) ? cd : cd.data ?? []);
      setCatalog(Array.isArray(id) ? id : id.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/credit-notes').then(r => r.json()).then(d => {
      setCreditNoteNumber(`CN-${String((d.total ?? 0) + 1).padStart(5, '0')}`);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (mobileNumber.length >= 10) {
      const found = customers.find(c => c.phone?.includes(mobileNumber));
      if (found) { setCustomerId(found.id); setIsCustomerNew(false); }
      else { setCustomerId(''); setIsCustomerNew(true); }
    } else { setCustomerId(''); setIsCustomerNew(false); }
  }, [mobileNumber, customers]);

  const selectedCustomer = customers.find(c => c.id === customerId);

  const updateItem = (id: string, field: keyof LineItem, v: any) =>
    setItems(p => p.map(i => i._id === id ? { ...i, [field]: v } : i));
  const removeItem = (id: string) => setItems(p => p.filter(i => i._id !== id));
  const addItem = () => setItems(p => [...p, newItem(undefined, defaultTaxRate)]);
  const fillFromCatalog = (name: string, lineId: string) => {
    const cat = catalog.find(c => c.name === name);
    if (!cat) return;
    setItems(p => p.map(i => i._id === lineId ? { ...i, itemId: cat.id, name: cat.name, unitPrice: cat.sellingPrice, taxRate: cat.taxRate, description: cat.description ?? '' } : i));
  };

  const lineTotal = (i: LineItem) => taxMethod === 'Inclusive' ? (i.quantity * i.unitPrice) / (1 + i.taxRate / 100) : i.quantity * i.unitPrice;
  const lineTax = (i: LineItem) => taxMethod === 'Inclusive' ? (i.quantity * i.unitPrice) - lineTotal(i) : lineTotal(i) * i.taxRate / 100;

  const subTotal    = items.reduce((s, i) => s + lineTotal(i), 0);
  const taxTotal    = items.reduce((s, i) => s + lineTax(i), 0);
  const discountAmt = discountType === 'percent' ? ((subTotal + taxTotal) * discount) / 100 : discount;
  const total       = subTotal + taxTotal - discountAmt + adjustment;

  const handleSave = async () => {
    if (!customerId && !isCustomerNew) { toast.error('Please select or enter a customer'); return; }
    if (isCustomerNew && !newCustomerName) { toast.error('Customer name is required'); return; }
    if (items.some(i => !i.name)) { toast.error('All items need a name'); return; }

    setLoading(true);
    try {
      let finalCustomerId = customerId;
      if (isCustomerNew) {
        const cRes = await fetch('/api/customers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: newCustomerName, phone: mobileNumber, email: newCustomerEmail || null }),
        });
        const cJson = await cRes.json();
        if (!cRes.ok) { toast.error(cJson.error || 'Failed to create customer'); setLoading(false); return; }
        finalCustomerId = cJson.customer.id;
      }

      const res = await fetch('/api/credit-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          creditNoteNumber,
          originalInvoiceRef: originalInvoiceRef || null,
          creditNoteDate,
          reason: reason || null,
          discount,
          discountType,
          adjustment,
          customerNotes: customerNotes || null,
          termsAndConditions: termsAndConditions || null,
          items: items.filter(i => i.name).map(({ _id, ...rest }) => ({
            ...rest,
            amount: rest.quantity * rest.unitPrice,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to create credit note'); return; }
      toast.success('Credit note created!');
      setTimeout(() => router.push('/credit-notes'), 600);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
        <Link href="/credit-notes" className="p-2 hover:bg-gray-100 rounded text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">New Credit Note</h1>
          <p className="text-xs text-gray-400">Issue a credit to a customer against an invoice</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 mt-4 bg-white shadow-sm border border-gray-100 rounded-md">

        {/* Customer */}
        <FieldRow label="Customer Name" required>
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap items-center">
              <Input placeholder="Mobile Number" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} className="max-w-xs bg-white border-gray-300" />
              {selectedCustomer && <span className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-semibold">{selectedCustomer.displayName}</span>}
              <span className="text-xs text-gray-400">or</span>
              <select value={customerId} onChange={e => {
                const v = e.target.value; setCustomerId(v);
                if (v) { const c = customers.find(x => x.id === v); if (c?.phone) setMobileNumber(c.phone); setIsCustomerNew(false); }
              }} className="text-sm border border-gray-300 rounded px-3 py-2 bg-white max-w-xs">
                <option value="">— Select or add a customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.displayName} {c.phone ? `(${c.phone})` : ''}</option>)}
              </select>
            </div>
            {isCustomerNew && mobileNumber.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-md max-w-2xl">
                <p className="text-xs font-bold text-orange-600 mb-3 uppercase tracking-wider">New Customer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Full Name *" className="bg-white" />
                  <Input value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} placeholder="Email Address" className="bg-white" />
                </div>
              </div>
            )}
          </div>
        </FieldRow>

        <div className="h-px bg-gray-100 my-4" />

        {/* Core Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <FieldRow label="Credit Note #" required>
            <Input value={creditNoteNumber} onChange={e => setCreditNoteNumber(e.target.value)} className={cls + " font-mono"} />
          </FieldRow>
          <FieldRow label="Credit Note Date" required>
            <Input type="date" value={creditNoteDate} onChange={e => setCreditNoteDate(e.target.value)} className={cls} />
          </FieldRow>
          <FieldRow label="Original Invoice Ref #">
            <Input value={originalInvoiceRef} onChange={e => setOriginalInvoiceRef(e.target.value)} placeholder="e.g. INV-0042" className={cls + " font-mono"} />
          </FieldRow>
          <FieldRow label="Reason for Credit Note">
            <select value={reason} onChange={e => setReason(e.target.value)} className={cls + " max-w-sm"}>
              <option value="">— Select Reason —</option>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </FieldRow>
        </div>

        <div className="h-px bg-gray-100 my-4" />

        {/* Item Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Item Table</h3>
          </div>
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2.5 px-4 font-semibold text-xs text-gray-500 uppercase tracking-wide">Item Details</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs text-gray-500 uppercase w-24">Qty</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs text-gray-500 uppercase w-32">Rate (₹)</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs text-gray-500 uppercase w-24">Tax %</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-xs text-gray-500 uppercase w-28">Amount</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item._id} className="bg-white hover:bg-gray-50/30 align-top">
                    <td className="p-2">
                      <input list={`cat-${idx}`} value={item.name}
                        onChange={e => updateItem(item._id, 'name', e.target.value)}
                        onBlur={e => fillFromCatalog(e.target.value, item._id)}
                        placeholder="Type or select an item"
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand/60" />
                      <datalist id={`cat-${idx}`}>{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                      <input value={item.description} onChange={e => updateItem(item._id, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-2 py-1 mt-1 rounded border border-transparent text-xs text-gray-400 focus:outline-none focus:border-gray-200 border" />
                    </td>
                    <td className="p-2"><input type="number" min={0.01} step={0.01} value={item.quantity} onChange={e => updateItem(item._id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-right focus:outline-none" /></td>
                    <td className="p-2"><input type="number" min={0} step={0.01} value={item.unitPrice} onChange={e => updateItem(item._id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-right focus:outline-none" /></td>
                    <td className="p-2"><input type="number" min={0} max={100} value={item.taxRate} onChange={e => updateItem(item._id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-right focus:outline-none" /></td>
                    <td className="p-2 text-right font-semibold text-gray-700 text-sm pt-3">
                      {(item.quantity * item.unitPrice * (1 + item.taxRate / 100)).toFixed(2)}
                    </td>
                    <td className="p-2 text-center pt-3">
                      <button type="button" onClick={() => removeItem(item._id)} disabled={items.length === 1} className="text-gray-300 hover:text-red-500 disabled:opacity-20 text-xl font-bold leading-none">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 p-3 bg-gray-50 border-t border-gray-200">
              <button type="button" onClick={addItem} className="text-sm font-medium text-brand flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add New Row
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-full max-w-sm space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Sub Total</span>
                <span className="font-semibold">{subTotal.toFixed(2)}</span>
              </div>
              {taxTotal > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">{taxTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">Discount</span>
                <div className="flex gap-2 items-center">
                  <input type="number" min={0} value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-gray-200 rounded text-right text-sm" />
                  <button type="button" onClick={() => setDiscountType(t => t === 'percent' ? 'fixed' : 'percent')} className="px-2 py-1 border border-gray-200 rounded text-xs font-bold text-gray-500 hover:bg-gray-50 w-8">
                    {discountType === 'percent' ? '%' : '₹'}
                  </button>
                  <span className="font-semibold w-16 text-right">{discountAmt.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">Adjustment</span>
                <div className="flex gap-2 items-center">
                  <input type="number" value={adjustment} onChange={e => setAdjustment(parseFloat(e.target.value) || 0)} className="w-32 px-2 py-1 border border-gray-200 rounded text-right text-sm" />
                  <span className="font-semibold w-16 text-right">{adjustment.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between pt-3 border-t-2 border-gray-200">
                <span className="font-black text-gray-800 uppercase tracking-wide text-sm">Total Credit (₹)</span>
                <span className="text-xl font-black text-brand">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-6" />

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Notes</label>
            <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} rows={4}
              placeholder="Enter any notes to be displayed in your transaction"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-brand/60 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
            <textarea value={termsAndConditions} onChange={e => setTermsAndConditions(e.target.value)} rows={4}
              placeholder="Enter the terms and conditions of your business"
              className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-brand/60 resize-none" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 z-30 left-0 right-0 bg-white border-t shadow-xl p-4 flex justify-end gap-3 px-6">
        <Button variant="outline" onClick={() => router.back()} className="rounded text-gray-600 border-gray-200">Cancel</Button>
        <Button onClick={handleSave} disabled={loading} className="bg-brand hover:brightness-90 text-white rounded border-none">
          {loading ? 'Saving…' : 'Save Credit Note'}
        </Button>
      </div>
    </div>
  );
}
