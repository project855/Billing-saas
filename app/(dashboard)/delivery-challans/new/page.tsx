'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface LineItem {
  _id: string;
  itemId: string | null;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
}
interface Customer { id: string; displayName: string; email: string; phone?: string; billingAddress?: string; shippingAddress?: string; }
interface CatalogItem { id: string; name: string; sellingPrice: number; unit: string; description?: string; }

const CHALLAN_TYPES = ['Supply of Liquid Gas', 'Job Work', 'SKD/CKD Assemblies', 'Recipient Not Known', 'Line Sales', 'Others'];
const cls = "w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-brand/60 transition-all";

const newItem = (id?: string): LineItem => ({ _id: id || crypto.randomUUID(), itemId: null, name: '', description: '', quantity: 1, unitPrice: 0 });

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
      <label className="text-[13px] font-medium text-red-500 sm:w-44 pt-2 shrink-0">{label}{required && '*'}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function NewChallanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // Customer
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [isCustomerNew, setIsCustomerNew] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // Challan fields
  const [challanNumber, setChallanNumber] = useState('DC-00001');
  const [referenceNo, setReferenceNo] = useState('');
  const [challanDate, setChallanDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [challanType, setChallanType] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [adjustment, setAdjustment] = useState(0);
  const [items, setItems] = useState<LineItem[]>([newItem('initial-item-1')]);

  useEffect(() => {
    Promise.all([fetch('/api/customers'), fetch('/api/items')]).then(async ([cr, ir]) => {
      const cd = await cr.json(); const id = await ir.json();
      setCustomers(Array.isArray(cd) ? cd : cd.data ?? []);
      setCatalog(Array.isArray(id) ? id : id.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/challans').then(r => r.json()).then(data => {
      const count = data.total ?? 0;
      setChallanNumber(`DC-${String(count + 1).padStart(5, '0')}`);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (mobileNumber.length >= 10) {
      const existing = customers.find(c => c.phone && c.phone.includes(mobileNumber));
      if (existing) { setCustomerId(existing.id); setIsCustomerNew(false); }
      else { setCustomerId(''); setIsCustomerNew(true); }
    } else { setCustomerId(''); setIsCustomerNew(false); }
  }, [mobileNumber, customers]);

  const selectedCustomer = customers.find(c => c.id === customerId);

  const updateItem = (id: string, field: keyof LineItem, v: any) =>
    setItems(p => p.map(i => i._id === id ? { ...i, [field]: v } : i));
  const removeItem = (id: string) => setItems(p => p.filter(i => i._id !== id));
  const addItem = () => setItems(p => [...p, newItem()]);

  const fillFromCatalog = (name: string, lineId: string) => {
    const cat = catalog.find(c => c.name === name);
    if (!cat) return;
    setItems(p => p.map(i => i._id === lineId ? { ...i, itemId: cat.id, name: cat.name, unitPrice: cat.sellingPrice, description: cat.description ?? '' } : i));
  };

  const subTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountAmt = discountType === 'percent' ? (subTotal * discount) / 100 : discount;
  const total = subTotal - discountAmt + adjustment;

  const handleSave = async (asDraft = false) => {
    if (!customerId && !isCustomerNew) { toast.error('Please select or enter a customer'); return; }
    if (isCustomerNew && !newCustomerName) { toast.error('Customer name is required'); return; }
    if (!challanType) { toast.error('Please select a challan type'); return; }
    if (items.some(i => !i.name)) { toast.error('All items need a name'); return; }

    setLoading(true);
    try {
      let finalCustomerId = customerId;
      if (isCustomerNew) {
        const cRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: newCustomerName, phone: mobileNumber, email: newCustomerEmail || null }),
        });
        const cJson = await cRes.json();
        if (!cRes.ok) { toast.error(cJson.error || 'Failed to create customer'); setLoading(false); return; }
        finalCustomerId = cJson.customer.id;
      }

      const res = await fetch('/api/challans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          challanNumber,
          referenceNo: referenceNo || null,
          challanDate,
          challanType,
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
      if (!res.ok) { toast.error(json.error || 'Failed to create challan'); return; }
      toast.success('Delivery challan created!');
      setTimeout(() => router.push('/delivery-challans'), 600);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/delivery-challans" className="p-2 hover:bg-gray-100 rounded text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🚚 New Delivery Challan
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 mt-4 bg-white shadow-sm border border-gray-100 rounded-md space-y-2">

        {/* Customer */}
        <FieldRow label="Customer Name" required>
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap items-center">
              <Input
                placeholder="Enter mobile number…"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                className="max-w-xs bg-white border-gray-300"
              />
              {selectedCustomer && !isCustomerNew && (
                <span className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-semibold">{selectedCustomer.displayName}</span>
              )}
              <span className="text-xs text-gray-400">or</span>
              <select value={customerId} onChange={e => {
                const val = e.target.value; setCustomerId(val);
                if (val) { const c = customers.find(x => x.id === val); if (c?.phone) setMobileNumber(c.phone); setIsCustomerNew(false); }
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

        <div className="h-px bg-gray-100 my-4"></div>

        {/* Core Fields */}
        <FieldRow label="Delivery Challan#" required>
          <Input value={challanNumber} onChange={e => setChallanNumber(e.target.value)} className={cls + " max-w-xs font-mono"} />
        </FieldRow>

        <FieldRow label="Reference#">
          <Input value={referenceNo} onChange={e => setReferenceNo(e.target.value)} className={cls + " max-w-xs"} />
        </FieldRow>

        <FieldRow label="Delivery Challan Date" required>
          <Input type="date" value={challanDate} onChange={e => setChallanDate(e.target.value)} className={cls + " max-w-xs"} />
        </FieldRow>

        <FieldRow label="Challan Type" required>
          <select value={challanType} onChange={e => setChallanType(e.target.value)} className={cls + " max-w-sm"}>
            <option value="">Choose a proper challan type.</option>
            {CHALLAN_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </FieldRow>

        <div className="h-px bg-gray-100 my-6"></div>

        {/* Item Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Item Table</h3>
          </div>
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold uppercase text-xs tracking-wide">Item Details</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-xs tracking-wide text-right w-28">Quantity</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-xs tracking-wide text-right w-32">Rate (₹)</th>
                  <th className="py-2.5 px-4 font-semibold uppercase text-xs tracking-wide text-right w-28">Amount</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item._id} className="bg-white hover:bg-gray-50/40 align-top">
                    <td className="p-2">
                      <input
                        list={`catalog-${idx}`}
                        value={item.name}
                        onChange={e => updateItem(item._id, 'name', e.target.value)}
                        onBlur={e => fillFromCatalog(e.target.value, item._id)}
                        placeholder="Type or click to select an item."
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-brand/60"
                      />
                      <datalist id={`catalog-${idx}`}>{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                      <input
                        value={item.description}
                        onChange={e => updateItem(item._id, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full px-2 py-1 mt-1 rounded border-transparent text-xs text-gray-400 focus:outline-none focus:border-gray-200 border"
                      />
                    </td>
                    <td className="p-2">
                      <input type="number" min={0.01} step={0.01} value={item.quantity}
                        onChange={e => updateItem(item._id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-right focus:outline-none" />
                    </td>
                    <td className="p-2">
                      <input type="number" min={0} step={0.01} value={item.unitPrice}
                        onChange={e => updateItem(item._id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-right focus:outline-none" />
                    </td>
                    <td className="p-2 text-right font-semibold text-gray-700 text-sm pt-3">
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                    <td className="p-2 text-center pt-3">
                      <button type="button" onClick={() => removeItem(item._id)} disabled={items.length === 1}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-20 text-lg font-bold leading-none">×</button>
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
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Sub Total</span>
                <span className="font-semibold text-gray-800">{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">Discount</span>
                <div className="flex gap-2 items-center">
                  <input type="number" min={0} value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-200 rounded text-right text-sm" />
                  <button type="button" onClick={() => setDiscountType(t => t === 'percent' ? 'fixed' : 'percent')}
                    className="px-2 py-1 border border-gray-200 rounded text-xs font-bold text-gray-500 hover:bg-gray-50 w-8">
                    {discountType === 'percent' ? '%' : '₹'}
                  </button>
                  <span className="font-semibold text-gray-800 w-16 text-right">{discountAmt.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-600">Adjustment</span>
                <div className="flex gap-2 items-center">
                  <input type="number" value={adjustment} onChange={e => setAdjustment(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2 py-1 border border-gray-200 rounded text-right text-sm" />
                  <span className="font-semibold text-gray-800 w-16 text-right">{adjustment.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                <span className="font-bold text-gray-800 uppercase tracking-wide text-sm">Total (₹)</span>
                <span className="text-xl font-black text-gray-900">{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 my-6"></div>

        {/* Notes and Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Notes</label>
            <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} rows={4}
              placeholder="Enter any notes to be displayed in your transaction"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-brand/60 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
            <textarea value={termsAndConditions} onChange={e => setTermsAndConditions(e.target.value)} rows={4}
              placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-brand/60 resize-none" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 z-30 left-0 right-0 bg-white border-t shadow-xl p-4 flex justify-end gap-3 px-6">
        <Button variant="outline" onClick={() => router.back()} className="rounded text-gray-600 border-gray-200">Cancel</Button>
        <Button onClick={() => handleSave()} disabled={loading} className="bg-brand hover:brightness-90 text-white rounded border-none">
          {loading ? 'Saving…' : 'Save Challan'}
        </Button>
      </div>
    </div>
  );
}
