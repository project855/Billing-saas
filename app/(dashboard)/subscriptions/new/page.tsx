'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

interface Customer { id: string; displayName: string; email: string; phone?: string; billingAddress?: string; }
interface CatalogItem { id: string; name: string; sellingPrice: number; unit: string; description?: string; }

const cls = "w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:border-green-500 transition-all";

const newItem = (id?: string): LineItem => ({
  _id: id || crypto.randomUUID(), itemId: null, name: '', description: '', quantity: 1, unitPrice: 0
});

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
      <label className="text-[13px] font-medium text-red-500 sm:w-48 pt-2 shrink-0">{label}{required && '*'}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function NewSubscriptionPage() {
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

  // Sub config
  const [subFor, setSubFor] = useState<'product' | 'items'>('items');
  const [items, setItems] = useState<LineItem[]>([newItem('initial-item-1')]);

  // Subscription terms
  const [subNumber, setSubNumber] = useState('SUB-00001');
  const [profileName, setProfileName] = useState('');
  const [billInterval, setBillInterval] = useState(1);
  const [billUnit, setBillUnit] = useState('Month(s)');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [neverExpires, setNeverExpires] = useState(true);
  const [cycles, setCycles] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [offlinePayment, setOfflinePayment] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('Due on Receipt');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/customers'), fetch('/api/items')]).then(async ([cr, ir]) => {
      const cd = await cr.json(); const id = await ir.json();
      setCustomers(Array.isArray(cd) ? cd : cd.data ?? []);
      setCatalog(Array.isArray(id) ? id : id.data ?? []);
    }).catch(() => {});
  }, []);

  // Auto-generate subscription number
  useEffect(() => {
    fetch('/api/subscriptions').then(r => r.json()).then(data => {
      const count = data.total ?? 0;
      setSubNumber(`SUB-${String(count + 1).padStart(5, '0')}`);
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

  const handleSave = async () => {
    if (!customerId && !isCustomerNew) { toast.error('Please enter a valid customer mobile number'); return; }
    if (isCustomerNew && !newCustomerName) { toast.error('Customer name is required'); return; }
    if (!profileName.trim()) { toast.error('Profile name is required'); return; }
    if (subFor === 'items' && items.some(i => !i.name)) { toast.error('All items need a name'); return; }

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

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          subNumber,
          profileName,
          subFor,
          billInterval,
          billUnit,
          startDate,
          neverExpires,
          cycles: neverExpires ? null : (parseInt(cycles) || null),
          refNumber: refNumber || null,
          offlinePayment,
          paymentTerms,
          notes: notes || null,
          items: subFor === 'items' ? items.filter(i => i.name).map(({ _id, ...rest }) => rest) : [],
        }),
      });

      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to create subscription'); return; }
      toast.success('Subscription created successfully!');
      setTimeout(() => router.push('/subscriptions'), 600);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 shadow-sm">
        <Link href="/subscriptions" className="p-2 hover:bg-gray-100 rounded text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-medium text-gray-800">New Subscription</h1>
      </div>

      <div className="max-w-5xl mx-auto p-6 mt-4 bg-white shadow-sm border border-gray-100 rounded-md">
        
        {/* Customer Selection */}
        <FieldRow label="Customer Name" required>
          <div className="space-y-3 max-w-2xl">
            <div className="flex gap-3 items-center flex-wrap">
              <Input
                placeholder="Enter mobile number to search/create…"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                className="max-w-xs bg-white border-gray-300"
              />
              {selectedCustomer && !isCustomerNew && (
                <div className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded text-sm font-semibold">
                  {selectedCustomer.displayName}
                </div>
              )}
              <span className="text-xs text-gray-400">or</span>
              <select
                value={customerId}
                onChange={e => {
                  const val = e.target.value;
                  setCustomerId(val);
                  if (val) {
                    const c = customers.find(x => x.id === val);
                    if (c?.phone) setMobileNumber(c.phone);
                    setIsCustomerNew(false);
                  }
                }}
                className="text-sm border border-gray-300 rounded px-3 py-2 bg-white max-w-xs"
              >
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.displayName} {c.phone ? `(${c.phone})` : ''}</option>)}
              </select>
            </div>

            {isCustomerNew && mobileNumber.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-md">
                <p className="text-xs font-bold text-orange-600 mb-3 uppercase tracking-wider">New Customer</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Full Name *" className="bg-white" />
                  <Input value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} placeholder="Email Address" className="bg-white" />
                </div>
              </div>
            )}

            {(selectedCustomer || isCustomerNew) && (
              <div className="grid grid-cols-2 gap-6 mt-4 pb-4 border-b border-gray-100 text-xs text-gray-500">
                <div>
                  <p className="uppercase text-[10px] text-gray-400 font-bold mb-1 tracking-widest">Billing Address</p>
                  <p className="text-blue-500">{selectedCustomer?.billingAddress || 'New Address'}</p>
                </div>
                <div>
                  <p className="uppercase text-[10px] text-gray-400 font-bold mb-1 tracking-widest">Shipping Address</p>
                  <p className="text-blue-500">New Address</p>
                </div>
              </div>
            )}
          </div>
        </FieldRow>

        {/* E-mail To */}
        <FieldRow label="E-MAIL TO">
          <div className="flex gap-3 flex-wrap">
            <button type="button" className="text-sm text-blue-500 font-medium px-4 py-2 border border-gray-200 rounded hover:bg-gray-50">
              + New Contact Person
            </button>
            {(selectedCustomer?.email || newCustomerEmail) && (
              <label className="flex items-center gap-2 border border-blue-400 bg-blue-50 px-4 py-2 rounded text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-blue-500" />
                {selectedCustomer?.email || newCustomerEmail}
              </label>
            )}
          </div>
        </FieldRow>

        <div className="h-px w-full bg-gray-100 my-6"></div>

        {/* Subscription Type */}
        <FieldRow label="Create Subscription For">
          <div className="flex gap-6 items-center pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" checked={subFor === 'product'} onChange={() => setSubFor('product')} className="accent-blue-600" />
              Product (Plan & Addons)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" checked={subFor === 'items'} onChange={() => setSubFor('items')} className="accent-blue-600" />
              Items
            </label>
          </div>
        </FieldRow>

        {/* Item Table */}
        {subFor === 'items' && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Item Table</h3>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold w-1/2">Item Details</th>
                    <th className="py-2.5 px-4 font-semibold w-24 text-right">Qty</th>
                    <th className="py-2.5 px-4 font-semibold w-36 text-right">Rate</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-24">Amount</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={item._id} className="bg-white hover:bg-gray-50/50">
                      <td className="p-2">
                        <input
                          list={`catalog-${idx}`}
                          value={item.name}
                          onChange={e => updateItem(item._id, 'name', e.target.value)}
                          onBlur={e => fillFromCatalog(e.target.value, item._id)}
                          placeholder="Type or click to select an item…"
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                        />
                        <datalist id={`catalog-${idx}`}>{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                        <input
                          value={item.description}
                          onChange={e => updateItem(item._id, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-2 py-1 mt-1 rounded border border-transparent text-xs text-gray-500 focus:outline-none focus:border-gray-200"
                        />
                      </td>
                      <td className="p-2">
                        <input type="number" min={0.01} step={0.01} value={item.quantity} onChange={e => updateItem(item._id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-right focus:outline-none focus:border-green-500" />
                      </td>
                      <td className="p-2">
                        <input type="number" min={0} step={0.01} value={item.unitPrice} onChange={e => updateItem(item._id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm text-right focus:outline-none focus:border-green-500" />
                      </td>
                      <td className="p-2 text-right font-semibold text-gray-700 text-sm">
                        {(item.quantity * item.unitPrice).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => removeItem(item._id)} disabled={items.length === 1}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-4 p-3 bg-gray-50 border-t border-gray-200">
                <button type="button" onClick={addItem} className="text-sm font-medium text-blue-500 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add New Row
                </button>
              </div>
            </div>
          </div>
        )}

        {subFor === 'product' && (
          <div className="mt-6 p-8 border border-dashed border-gray-300 rounded bg-gray-50 text-center text-sm text-gray-500">
            Product & Plan selection — connect your plans and add-ons here.
          </div>
        )}

        {/* Subscription Terms */}
        <div className="mt-10 border-t border-gray-100 pt-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-6">Subscription Term</h3>

          <FieldRow label="Subscription Number" required>
            <Input value={subNumber} onChange={e => setSubNumber(e.target.value)} className={cls} />
          </FieldRow>

          <FieldRow label="Profile Name" required>
            <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g. Monthly Basic Plan" className={cls} />
          </FieldRow>

          <FieldRow label="Bill Every" required>
            <div className="flex gap-2 max-w-xs">
              <Input type="number" min={1} value={billInterval} onChange={e => setBillInterval(+e.target.value)} className={cls + " w-20"} />
              <select value={billUnit} onChange={e => setBillUnit(e.target.value)} className={cls + " flex-1"}>
                <option>Day(s)</option>
                <option>Week(s)</option>
                <option>Month(s)</option>
                <option>Year(s)</option>
              </select>
            </div>
          </FieldRow>

          <FieldRow label="Start Date">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={cls} />
          </FieldRow>

          <FieldRow label="Expires After">
            <div className="space-y-2">
              <div className="flex gap-3 items-center">
                <Input type="number" min={1} disabled={neverExpires} value={cycles} onChange={e => setCycles(e.target.value)}
                  className={cls + " w-24 disabled:opacity-50"} placeholder="—" />
                <span className="text-sm text-gray-500">cycles</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={neverExpires} onChange={e => { setNeverExpires(e.target.checked); if (e.target.checked) setCycles(''); }}
                  className="accent-blue-500" />
                Never Expires
              </label>
            </div>
          </FieldRow>

          <div className="my-6 border-b border-gray-100"></div>

          <FieldRow label="Reference Number">
            <Input value={refNumber} onChange={e => setRefNumber(e.target.value)} className={cls} />
          </FieldRow>

          <FieldRow label="Payment Mode">
            <label className="flex items-center gap-2 text-sm text-gray-700 pt-2 cursor-pointer">
              <input type="checkbox" checked={offlinePayment} onChange={e => setOfflinePayment(e.target.checked)} className="accent-blue-500" />
              Collect payment offline
            </label>
          </FieldRow>

          <FieldRow label="Payment Terms">
            <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={cls}>
              <option>Due on Receipt</option>
              <option>Net 7</option>
              <option>Net 15</option>
              <option>Net 30</option>
            </select>
          </FieldRow>

          <FieldRow label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Internal notes (optional)…"
              className={cls + " resize-none"} />
          </FieldRow>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 z-30 left-0 right-0 bg-white border-t shadow-xl p-4 flex justify-end gap-3 px-6">
        <Button variant="outline" onClick={() => router.back()} className="rounded text-gray-600 border-gray-200">Cancel</Button>
        <Button onClick={handleSave} disabled={loading} className="bg-brand hover:brightness-90 text-white rounded border-none">
          {loading ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
