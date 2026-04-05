'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, Save, Send, Eye, Edit3, Printer,
  ChevronDown, ChevronUp, FileText, Settings2, Receipt,
  CreditCard, Clock, Tag, GripVertical, Copy, Zap,
  BellRing, CalendarClock, Wallet, Building2, User,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LineItem {
  _id: string;
  itemId: string | null;
  name: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: 'percent' | 'fixed';
  discount: number;
  taxRate: number;
  taxType: 'GST' | 'IGST' | 'VAT' | 'None';
}

interface Customer { id: string; displayName: string; email: string; phone?: string; gstNumber?: string; billingAddress?: string; }
interface CatalogItem { id: string; name: string; sellingPrice: number; taxRate: number; unit: string; hsnCode?: string; description?: string; }

// ─── Constants ───────────────────────────────────────────────────────────────

const INV_TYPES = ['Standard Invoice','Proforma Invoice','Recurring Invoice','Credit Note','Debit Note','Tax Invoice (GST)','Commercial Invoice','Timesheet Invoice','Interim Invoice','Final Invoice'];
const TEMPLATES = ['Professional','Modern','Minimal','Bold','GST Compliant'];
const PAYMENT_TERMS = [{ label: 'Due on Receipt', days: 0 },{ label: 'Net 7', days: 7 },{ label: 'Net 15', days: 15 },{ label: 'Net 30', days: 30 },{ label: 'Net 45', days: 45 },{ label: 'Net 60', days: 60 },{ label: 'Custom', days: -1 }];
const CURRENCIES = ['INR','USD','EUR','GBP','AED'];
const PAY_METHODS = ['UPI','Credit Card','Debit Card','Net Banking','Bank Transfer','Cash','Wallet','Cheque'];
const UNITS = ['pcs','hrs','kg','lt','m','box','set','month'];
const COLORS = ['#EF3A2A','#2563EB','#7C3AED','#059669','#D97706','#DB2777','#374151'];

const fmtCurrency = (v: number, currency = 'INR') =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);

const newItem = (id?: string, defaultTaxRate: number = 18): LineItem => ({
  _id: id || crypto.randomUUID(), itemId: null, name: '', description: '',
  hsnSac: '', quantity: 1, unit: 'pcs', unitPrice: 0,
  discountType: 'percent', discount: 0, taxRate: defaultTaxRate, taxType: 'GST',
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800 uppercase tracking-wider">{icon}{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 pt-1 border-t border-gray-50">{children}</div>}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">{label}{required && <span className="text-brand ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

const cls = "w-full px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all";

// ─── Main Component ───────────────────────────────────────────────────────────

import { useSettings } from '@/lib/settings-context';

export default function NewInvoicePage() {
  const router = useRouter();
  const { taxRate: defaultTaxRate, taxMethod } = useSettings();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // Core invoice state
  const [invoiceType, setInvoiceType] = useState('Standard Invoice');
  const [template, setTemplate] = useState('Professional');
  const [accentColor, setAccentColor] = useState('#EF3A2A');
  const [currency, setCurrency] = useState('INR');
  const [customerId, setCustomerId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isCustomerNew, setIsCustomerNew] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerGSTIN, setNewCustomerGSTIN] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [terms, setTerms] = useState(30);
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [notes, setNotes] = useState('');
  const [termsText, setTermsText] = useState('Payment is due within the specified period. Late payments may incur a penalty of 1.5% per month.');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');
  const [items, setItems] = useState<LineItem[]>([newItem('initial-item-1', defaultTaxRate)]); // Will be updated by useEffect below
  const [customFields, setCustomFields] = useState<{ id: string; key: string; value: string }[]>([]);

  // GST-specific
  const [sellerGSTIN, setSellerGSTIN] = useState('');
  const [buyerGSTIN, setBuyerGSTIN] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [isInterState, setIsInterState] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [partialPayment, setPartialPayment] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Recurring
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringCycle, setRecurringCycle] = useState('Monthly');
  const [recurringEnd, setRecurringEnd] = useState('');

  // Automation
  const [autoSendEmail, setAutoSendEmail] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);
  const [lateFeePercent, setLateFeePercent] = useState(0);

  // Credit/Debit Note
  const [originalInvoiceRef, setOriginalInvoiceRef] = useState('');
  const [noteReason, setNoteReason] = useState('');

  // Company logo (local preview)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Salesperson
  const [salespersons, setSalespersons] = useState<any[]>([]);
  const [salespersonId, setSalespersonId] = useState('');
  const [isSalespersonNew, setIsSalespersonNew] = useState(false);
  const [newSalespersonName, setNewSalespersonName] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/customers'), fetch('/api/items'), fetch('/api/salespersons')])
      .then(async ([cr, ir, sr]) => {
        const cd = await cr.json(); const id = await ir.json(); const sd = await sr.json();
        setCustomers(Array.isArray(cd) ? cd : cd.data ?? []);
        setCatalog(Array.isArray(id) ? id : id.data ?? []);
        setSalespersons(Array.isArray(sd) ? sd : sd.data ?? []);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (mobileNumber.length >= 10) {
      const existing = customers.find(c => c.phone && c.phone.includes(mobileNumber));
      if (existing) {
        setCustomerId(existing.id);
        setIsCustomerNew(false);
      } else {
        setCustomerId('');
        setIsCustomerNew(true);
      }
    } else {
      setCustomerId('');
      setIsCustomerNew(false);
    }
  }, [mobileNumber, customers]);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const isGST = invoiceType === 'Tax Invoice (GST)';
  const isTimesheet = invoiceType === 'Timesheet Invoice';
  const isCreditDebit = invoiceType === 'Credit Note' || invoiceType === 'Debit Note';

  // ── Item handlers ─────────────────────────────────────────────────────────
  const addItem = () => setItems(p => [...p, newItem(undefined, defaultTaxRate)]);
  const removeItem = (id: string) => setItems(p => p.filter(i => i._id !== id));
  const updateItem = (id: string, field: keyof LineItem, value: unknown) =>
    setItems(p => p.map(i => i._id === id ? { ...i, [field]: value } : i));
  const fillFromCatalog = (itemId: string, lineId: string) => {
    const cat = catalog.find(c => c.id === itemId);
    if (!cat) return;
    setItems(p => p.map(i => i._id === lineId ? {
      ...i, itemId, name: cat.name, unitPrice: cat.sellingPrice,
      taxRate: cat.taxRate, unit: cat.unit ?? 'pcs',
      hsnSac: cat.hsnCode ?? '', description: cat.description ?? '',
    } : i));
  };

  const updateDueDate = useCallback((days: number, from = issueDate) => {
    if (days >= 0) setDueDate(format(addDays(new Date(from), days), 'yyyy-MM-dd'));
    setTerms(days);
  }, [issueDate]);

  // ── Calculations ──────────────────────────────────────────────────────────
  const lineTotal = (item: LineItem) => {
    const base = item.quantity * item.unitPrice;
    const disc = item.discountType === 'percent' ? base * item.discount / 100 : item.discount;
    if (taxMethod === 'Inclusive') {
      return disc / (1 + item.taxRate / 100);
    }
    return base - disc;
  };
  const lineTax = (item: LineItem) => {
    const base = item.quantity * item.unitPrice;
    const disc = item.discountType === 'percent' ? base * item.discount / 100 : item.discount;
    if (taxMethod === 'Inclusive') {
      return disc - (disc / (1 + item.taxRate / 100));
    }
    return lineTotal(item) * item.taxRate / 100;
  };

  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const taxTotal = items.reduce((s, i) => s + lineTax(i), 0);
  const globalDisc = discountType === 'percent' ? subtotal * discount / 100 : discount;
  const grandTotal = subtotal + taxTotal - globalDisc;
  const balanceDue = grandTotal - partialPayment;

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async (sendAfter = false) => {
    let finalCustomerId = customerId;
    if (isCustomerNew) {
      if (!newCustomerName) { toast.error('Customer name is required for new customer'); return; }
      setLoading(true);
      try {
        const cRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: newCustomerName,
            phone: mobileNumber,
            email: newCustomerEmail || null,
            gstNumber: newCustomerGSTIN || null,
          }),
        });
        const cJson = await cRes.json();
        if (!cRes.ok) { toast.error(cJson.error || 'Failed to create new customer'); setLoading(false); return; }
        finalCustomerId = cJson.customer.id;
        setCustomerId(finalCustomerId);
      } catch (err) { toast.error('Failed to create new customer'); setLoading(false); return; }
    } else if (!finalCustomerId) { toast.error('Please enter a valid customer mobile number'); return; }

    if (items.some(i => !i.name && !i.description)) { toast.error('All items need a name or description'); setLoading(false); return; }
    if (!isCustomerNew) setLoading(true);
    
    let finalSalespersonId = salespersonId;
    if (isSalespersonNew && newSalespersonName.trim()) {
      try {
        const sRes = await fetch('/api/salespersons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newSalespersonName }),
        });
        const sJson = await sRes.json();
        if (sRes.ok) finalSalespersonId = sJson.salesperson.id;
        else { toast.error(sJson.error || 'Failed to create salesperson'); setLoading(false); return; }
      } catch { toast.error('Failed to create salesperson'); setLoading(false); return; }
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId, salespersonId: finalSalespersonId || null, issueDate, dueDate, discount: globalDisc,
          notes: notes || null,
          items: items.map(item => {
            const { _id, ...rest } = item;
            return {
              ...rest,
              description: rest.name + (rest.description ? ` — ${rest.description}` : ''),
              total: lineTotal(item),
            };
          }),
          type: invoiceType, template, metadata: {
            sellerGSTIN, buyerGSTIN, placeOfSupply, isInterState,
            originalInvoiceRef, noteReason, isRecurring, recurringCycle,
            recurringEnd, paymentMethod, transactionId, partialPayment,
            lateFeePercent, reminderDays, autoSendEmail, currency, invoicePrefix,
          },
          customFields: customFields.filter(f => f.key.trim() && f.value.trim()),
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to create invoice'); return; }
      toast.success(sendAfter ? `${invoiceType} created & sent!` : `${invoiceType} saved as draft`);
      setTimeout(() => router.push('/invoices'), 600);
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ─── PREVIEW MODE ─────────────────────────────────────────────────────────
  if (mode === 'preview') {
    const prefix = invoiceType === 'Credit Note' ? 'CN' : invoiceType === 'Debit Note' ? 'DN' : invoicePrefix;
    const num = `${prefix}-${Date.now().toString().slice(-5)}`;
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 mb-4 print:hidden">
            <Button onClick={() => setMode('edit')} variant="outline" className="gap-2 border-gray-200"><Edit3 className="w-4 h-4" />Back to Editor</Button>
            <Button onClick={() => window.print()} className="gap-2 bg-gray-900 hover:bg-gray-800 text-white border-none"><Printer className="w-4 h-4" />Print / Download PDF</Button>
          </div>
          <div className="bg-[#f8f9fc] rounded-xl shadow-lg border border-gray-200 overflow-hidden relative min-h-[800px] flex flex-col font-sans print:shadow-none print:rounded-none">
            
            {/* Top Banner SVG with dynamic accentColor */}
            <div className="absolute top-0 left-0 right-0 h-[200px] sm:h-[220px] z-0 print:hidden" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <svg className="w-full h-full object-fill" viewBox="0 0 1440 220" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0H1440V120C1100 240 340 40 0 140V0Z" fill={accentColor} opacity="0.9" />
                <path d="M0 0H1440V90C1100 210 340 10 0 110V0Z" fill={accentColor} />
              </svg>
            </div>
            {/* Print specific header background */}
            <div className="absolute top-0 left-0 right-0 h-[220px] z-0 hidden print:block" style={{ backgroundColor: accentColor, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>

            {/* Header Texts */}
            <div className="relative z-10 px-8 sm:px-12 pt-12 sm:pt-14 pb-8 sm:pb-12 flex flex-col sm:flex-row sm:justify-between items-start gap-4" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <div className="flex flex-col items-start gap-4">
                <h1 className="text-4xl xl:text-5xl font-extrabold text-white tracking-wider uppercase">{invoiceType.replace(' Invoice', '') || 'INVOICE'}</h1>
                <div>
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="h-16 w-auto object-contain bg-white/10 rounded-xl p-1" /> : (
                    <div className="h-16 w-16 rounded-xl flex items-center justify-center" style={{ background: `rgba(255,255,255,0.2)` }}>
                      <span className="font-black text-2xl text-white">AC</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-white sm:mt-1 text-left sm:text-right">
                <p className="text-lg xl:text-xl font-bold tracking-wide mt-1">NO: {num.replace('#', '')}</p>
                <div className="mt-4 flex gap-4 text-sm font-medium justify-start sm:justify-end opacity-90">
                  <span>Issued: {format(new Date(issueDate || Date.now()), 'dd MMM yyyy')}</span>
                  <span>Due: {format(new Date(dueDate || Date.now()), 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 px-8 sm:px-12 flex-1 space-y-8">
              
              {/* Bill To & From */}
              <div className="flex flex-col sm:flex-row justify-between gap-8 mt-4">
                <div className="text-left max-w-[280px]">
                  <h2 className="text-lg font-black mb-2 uppercase tracking-wide" style={{ color: accentColor }}>Bill To</h2>
                  <p className="font-extrabold text-gray-800 text-lg mb-1">{selectedCustomer?.displayName || newCustomerName || '—'}</p>
                  {(selectedCustomer?.phone || mobileNumber) && <p className="text-gray-500 text-sm mb-0.5">{selectedCustomer?.phone || mobileNumber}</p>}
                  {(selectedCustomer?.email || newCustomerEmail) && <p className="text-gray-500 text-sm mb-0.5">{selectedCustomer?.email || newCustomerEmail}</p>}
                  {selectedCustomer?.billingAddress && (
                    <p className="text-gray-500 text-sm leading-relaxed mt-1">{selectedCustomer.billingAddress}</p>
                  )}
                  {(selectedCustomer?.gstNumber || newCustomerGSTIN) && (
                    <p className="text-gray-500 mt-2 font-mono text-xs font-bold tracking-wide break-words">GSTIN: {selectedCustomer?.gstNumber || newCustomerGSTIN}</p>
                  )}
                </div>
                <div className="text-left sm:text-right max-w-[280px]">
                  <h2 className="text-lg font-black mb-2 uppercase tracking-wide opacity-0 hidden sm:block">From</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest block mb-1">Company Info</p>
                  <p className="font-extrabold text-gray-800 text-lg mb-1">
                    Your Company
                  </p>
                  <p className="text-gray-500 text-sm mb-0.5">company@email.com</p>
                  {isGST && sellerGSTIN && <p className="text-gray-500 text-sm mb-0.5 font-mono mt-1">GSTIN: {sellerGSTIN}</p>}
                  {isCreditDebit && originalInvoiceRef && (
                    <div className="mt-4 text-left sm:text-right">
                      <p className="text-[10px] uppercase font-black tracking-widest mb-1 text-amber-600">Original Invoice</p>
                      <p className="font-mono font-bold text-gray-800">{originalInvoiceRef}</p>
                      {noteReason && <p className="text-xs text-gray-500 mt-1.5">{noteReason}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.filter(f => f.key.trim() && f.value.trim()).length > 0 && (
                <div className="flex gap-8 p-5 border border-gray-100 bg-white shadow-sm rounded-xl text-sm flex-wrap">
                  {customFields.filter(f => f.key.trim() && f.value.trim()).map(f => (
                     <div key={f.id}>
                       <span className="font-black text-xs uppercase tracking-wider block mb-1" style={{ color: accentColor }}>{f.key}</span>
                       <span className="font-bold text-gray-800">{f.value}</span>
                     </div>
                  ))}
                </div>
              )}

              {/* GST Info Box */}
              {isGST && (sellerGSTIN || buyerGSTIN) && (
                <div className="flex gap-8 p-5 bg-white border border-gray-100 shadow-sm rounded-xl text-sm flex-wrap">
                  {sellerGSTIN && <div><span className="font-black text-[10px] uppercase tracking-widest block text-gray-400 mb-1">Seller GSTIN</span><span className="font-mono font-bold text-gray-800">{sellerGSTIN}</span></div>}
                  {buyerGSTIN && <div><span className="font-black text-[10px] uppercase tracking-widest block text-gray-400 mb-1">Buyer GSTIN</span><span className="font-mono font-bold text-gray-800">{buyerGSTIN}</span></div>}
                  {placeOfSupply && <div><span className="font-black text-[10px] uppercase tracking-widest block text-gray-400 mb-1">Place of Supply</span><span className="font-bold text-gray-800">{placeOfSupply}</span></div>}
                  <div><span className="font-black text-[10px] uppercase tracking-widest block text-gray-400 mb-1">Tax Type</span><span className="font-bold text-gray-800">{isInterState ? 'IGST' : 'CGST + SGST'}</span></div>
                </div>
              )}

              {/* Invoice Items Table */}
              <div>
                <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 bg-white">
                  <table className="w-full text-sm text-left border-collapse whitespace-nowrap min-w-[600px]">
                    <thead className="text-white" style={{ backgroundColor: accentColor, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <tr>
                        <th className="py-3 px-5 font-semibold text-left border-r border-white/20">Item / Service</th>
                        {isGST && <th className="py-3 px-4 font-semibold text-left border-r border-white/20">HSN/SAC</th>}
                        <th className="py-3 px-4 font-semibold text-center border-r border-white/20">{isTimesheet ? 'Hours' : 'Qty'}</th>
                        <th className="py-3 px-4 font-semibold text-right border-r border-white/20">{isTimesheet ? 'Rate/Hr' : 'Unit Price'}</th>
                        <th className="py-3 px-4 font-semibold text-right border-r border-white/20">Disc</th>
                        <th className="py-3 px-4 font-semibold text-right border-r border-white/20">Tax</th>
                        <th className="py-3 px-5 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 divide-y divide-gray-100">
                      {items.map((item, i) => (
                        <tr key={item._id || i} className="hover:bg-gray-50/50">
                          <td className="py-4 px-5 whitespace-normal">
                            <p className="font-bold text-gray-900">{item.name || '—'}</p>
                            {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                          </td>
                          {isGST && <td className="py-4 px-4 font-mono text-xs text-gray-500">{item.hsnSac || '—'}</td>}
                          <td className="py-4 px-4 text-center font-medium">{item.quantity} <span className="text-xs text-gray-400 ml-0.5">{item.unit}</span></td>
                          <td className="py-4 px-4 text-right font-mono">{fmtCurrency(item.unitPrice, currency)}</td>
                          <td className="py-4 px-4 text-right text-emerald-600 font-medium">{item.discount > 0 ? (item.discountType === 'percent' ? `${item.discount}%` : fmtCurrency(item.discount, currency)) : '—'}</td>
                          <td className="py-4 px-4 text-right text-gray-500 text-xs">{item.taxRate}%<br /><span className="text-[10px]">{item.taxType}</span></td>
                          <td className="py-4 px-5 text-right font-black text-gray-900 font-mono">{fmtCurrency(lineTotal(item), currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal block right-aligned */}
                <div className="flex justify-end mt-4 text-sm">
                  <div className="w-full sm:w-80 space-y-2.5 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-bold font-mono">{fmtCurrency(subtotal, currency)}</span></div>
                    {isGST && !isInterState ? (
                      <>
                        <div className="flex justify-between text-gray-500"><span>CGST</span><span className="font-mono">{fmtCurrency(taxTotal / 2, currency)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>SGST</span><span className="font-mono">{fmtCurrency(taxTotal / 2, currency)}</span></div>
                      </>
                    ) : isGST ? (
                      <div className="flex justify-between text-gray-500"><span>IGST</span><span className="font-mono">{fmtCurrency(taxTotal, currency)}</span></div>
                    ) : (
                      <div className="flex justify-between text-gray-500"><span>Tax</span><span className="font-mono">{fmtCurrency(taxTotal, currency)}</span></div>
                    )}
                    {globalDisc > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-mono">-{fmtCurrency(globalDisc, currency)}</span></div>}
                    <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
                      <span className="font-black text-gray-900 uppercase tracking-wide text-xs">Total</span>
                      <span className="text-2xl font-black font-mono" style={{ color: accentColor }}>{fmtCurrency(grandTotal, currency)}</span>
                    </div>
                    {partialPayment > 0 && (
                      <div className="pt-3 mt-2 border-t border-gray-100">
                        <div className="flex justify-between text-emerald-600 mb-1"><span>Payment Received</span><span className="font-mono">-{fmtCurrency(partialPayment, currency)}</span></div>
                        <div className="flex justify-between items-center"><span className="font-black text-gray-900 text-xs uppercase">Balance Due</span><span className="text-xl font-black font-mono" style={{ color: accentColor }}>{fmtCurrency(balanceDue, currency)}</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer notes */}
              {(notes || termsText) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 pb-8 text-xs text-gray-500 border-t border-gray-200">
                  {notes && (
                    <div>
                      <p className="font-black uppercase tracking-wider mb-2" style={{ color: accentColor }}>Notes</p>
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{notes}</p>
                    </div>
                  )}
                  {termsText && (
                    <div>
                      <p className="font-black uppercase tracking-wider mb-2" style={{ color: accentColor }}>Terms & Conditions</p>
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{termsText}</p>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── EDIT MODE ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/60 font-sans">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-base font-black text-gray-900 leading-none">Create {invoiceType}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details below</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setMode('edit')} className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${mode === 'edit' ? 'bg-white shadow text-gray-900 border border-gray-200' : 'text-gray-500'}`}><Edit3 className="w-3.5 h-3.5" />Editor</button>
            <button onClick={() => setMode('preview')} className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${mode !== 'edit' ? 'bg-white shadow text-gray-900 border border-gray-200' : 'text-gray-500'}`}><Eye className="w-3.5 h-3.5" />Preview</button>
          </div>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={loading} className="border-gray-200 text-gray-700 gap-2 h-9 text-xs font-bold"><Save className="w-3.5 h-3.5" />Save Draft</Button>
          <Button onClick={() => handleSave(true)} disabled={loading} className="bg-brand hover:brightness-90 text-white gap-2 h-9 text-xs font-bold border-none shadow-sm"><Send className="w-3.5 h-3.5" />{loading ? 'Saving…' : 'Save & Send'}</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 pb-20">
        {/* ─── LEFT SIDEBAR ─── */}
        <div className="space-y-4">
          {/* Doc Type & Template */}
          <Section title="Document Config" icon={<Settings2 className="w-4 h-4 text-brand" />}>
            <div className="space-y-4">
              <Field label="Document Type" required>
                <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className={cls}>
                  {INV_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <p className="text-[11px] text-brand bg-red-50 px-2 py-1 rounded-md mt-1 font-medium">Fields auto-adapt to {invoiceType}</p>
              </Field>
              <Field label="Invoice Prefix">
                <div className="flex gap-2">
                  <Input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} className="w-24 bg-gray-50/50 border-gray-200 font-mono font-bold" placeholder="INV" />
                  <Input value="Auto #" disabled className="flex-1 bg-gray-100 text-gray-400 text-xs" />
                </div>
              </Field>
              <Field label="Design Template">
                <select value={template} onChange={e => setTemplate(e.target.value)} className={cls}>
                  {TEMPLATES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Accent Color">
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setAccentColor(c)} style={{ background: c }} className={`w-7 h-7 rounded-full transition-all ${accentColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`} />
                  ))}
                </div>
              </Field>
              <Field label="Currency">
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={cls}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Company Logo">
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-brand/40 transition-colors">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="h-10 w-10 object-contain rounded" /> : <Building2 className="w-5 h-5 text-gray-300" />}
                  <span className="text-xs text-gray-400 font-medium">{logoPreview ? 'Change logo' : 'Upload logo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </Field>
            </div>
          </Section>

          {/* Automation */}
          <Section title="Automation" icon={<Zap className="w-4 h-4 text-amber-500" />} defaultOpen={false}>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Send className="w-4 h-4 text-blue-500" />Auto-send via Email</span>
                <button type="button" onClick={() => setAutoSendEmail(p => !p)} className={`relative w-10 h-5 rounded-full transition-colors ${autoSendEmail ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${autoSendEmail ? 'left-5' : 'left-0.5'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-purple-500" />Recurring Invoice</span>
                <button type="button" onClick={() => setIsRecurring(p => !p)} className={`relative w-10 h-5 rounded-full transition-colors ${isRecurring ? 'bg-purple-500' : 'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isRecurring ? 'left-5' : 'left-0.5'}`} />
                </button>
              </label>
              {isRecurring && (
                <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-purple-100">
                  <Field label="Cycle"><select value={recurringCycle} onChange={e => setRecurringCycle(e.target.value)} className={cls}><option>Monthly</option><option>Quarterly</option><option>Yearly</option><option>Weekly</option></select></Field>
                  <Field label="End Date"><Input type="date" value={recurringEnd} onChange={e => setRecurringEnd(e.target.value)} className="bg-gray-50/50 border-gray-200" /></Field>
                </div>
              )}
              <Field label="Payment Reminder (days before due)">
                <Input type="number" min={0} max={30} value={reminderDays} onChange={e => setReminderDays(+e.target.value)} className="bg-gray-50/50 border-gray-200" />
              </Field>
              <Field label="Late Fee (% per month)">
                <Input type="number" min={0} max={10} step={0.5} value={lateFeePercent} onChange={e => setLateFeePercent(+e.target.value)} className="bg-gray-50/50 border-gray-200" />
              </Field>
            </div>
          </Section>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div className="space-y-4">
          {/* General Details */}
          <Section title="Invoice Details" icon={<FileText className="w-4 h-4 text-brand" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Customer Mobile Number" required>
                    <Input 
                      placeholder="Enter mobile number" 
                      value={mobileNumber} 
                      onChange={e => setMobileNumber(e.target.value)} 
                      className="bg-gray-50/50 border-gray-200 h-10" 
                    />
                  </Field>
                  <Field label="Or Select Existing">
                    <select value={customerId} onChange={e => { setCustomerId(e.target.value); if (e.target.value) { const c = customers.find(x => x.id === e.target.value); if (c?.phone) setMobileNumber(c.phone); setIsCustomerNew(false); } }} className={cls + " h-10"}>
                      <option value="">— Select Customer —</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.displayName} {c.phone ? `(${c.phone})` : ''}</option>)}
                    </select>
                  </Field>
                </div>
                {selectedCustomer && !isCustomerNew && (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl grid grid-cols-3 gap-3 text-xs">
                    <div><span className="text-gray-400 block">Name</span><span className="font-medium text-gray-700">{selectedCustomer.displayName}</span></div>
                    <div><span className="text-gray-400 block">Email</span><span className="font-medium text-gray-700">{selectedCustomer.email || '—'}</span></div>
                    <div><span className="text-gray-400 block">GSTIN</span><span className="font-medium font-mono text-gray-700">{selectedCustomer.gstNumber || '—'}</span></div>
                  </div>
                )}
                {isCustomerNew && mobileNumber.length > 0 && (
                  <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">New Customer Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Customer Name" required>
                        <Input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="bg-white border-orange-200 h-10" placeholder="John Doe" />
                      </Field>
                      <Field label="Email (Optional)">
                        <Input value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} className="bg-white border-orange-200 h-10" placeholder="john@example.com" />
                      </Field>
                      <Field label="GSTIN (Optional)">
                        <Input value={newCustomerGSTIN} onChange={e => setNewCustomerGSTIN(e.target.value)} className="bg-white border-orange-200 font-mono uppercase h-10" placeholder="29XXXXX0000A1Z5" />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
              <Field label="Issue Date" required>
                <Input type="date" value={issueDate} onChange={e => { setIssueDate(e.target.value); updateDueDate(terms, e.target.value); }} className="bg-gray-50/50 border-gray-200 h-10" />
              </Field>
              <Field label="Payment Terms">
                <select value={terms} onChange={e => updateDueDate(+e.target.value)} className={cls}>
                  {PAYMENT_TERMS.map(t => <option key={t.label} value={t.days}>{t.label}</option>)}
                </select>
              </Field>
              {invoiceType !== 'Proforma Invoice' && (
                <Field label="Due Date" required>
                  <Input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setTerms(-1); }} className="bg-gray-50/50 border-gray-200 h-10" />
                </Field>
              )}
              {isCreditDebit && (
                <>
                  <Field label="Original Invoice Ref" required>
                    <Input placeholder="INV-00123" value={originalInvoiceRef} onChange={e => setOriginalInvoiceRef(e.target.value)} className="bg-gray-50/50 border-amber-200 font-mono" />
                  </Field>
                  <Field label="Reason">
                    <Input placeholder="Customer return, excess charge…" value={noteReason} onChange={e => setNoteReason(e.target.value)} className="bg-gray-50/50 border-amber-200" />
                  </Field>
                </>
              )}

              <div className="md:col-span-2">
                <Field label="Salesperson">
                  <div className="flex flex-col gap-3">
                    <select value={salespersonId} onChange={e => {
                      if (e.target.value === 'new') { setIsSalespersonNew(true); setSalespersonId(''); }
                      else { setIsSalespersonNew(false); setSalespersonId(e.target.value); }
                    }} className={cls + " h-10 w-full max-w-sm"}>
                      <option value="">— Select or Add Salesperson —</option>
                      {salespersons.map(s => <option key={s.id} value={s.id}>{s.name} {s.email ? `(${s.email})` : ''}</option>)}
                      <option value="new">+ Add New Salesperson</option>
                    </select>
                    {isSalespersonNew && (
                      <div className="flex gap-2 w-full max-w-sm">
                        <Input value={newSalespersonName} onChange={e => setNewSalespersonName(e.target.value)} placeholder="Salesperson Name" className="bg-white border-blue-200 flex-1 h-10" />
                        <Button type="button" onClick={() => { setIsSalespersonNew(false); setNewSalespersonName(''); }} variant="outline" className="h-10 text-gray-500">Cancel</Button>
                      </div>
                    )}
                  </div>
                </Field>
              </div>
            </div>
            
            {/* Custom Fields Form */}
            <div className="col-span-1 md:col-span-2 pt-5 mt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">Additional Custom Fields</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setCustomFields([...customFields, { id: crypto.randomUUID(), key: '', value: '' }])} className="h-7 text-[10px] gap-1 px-2 border-gray-200"><Plus className="w-3 h-3" /> Add Field</Button>
              </div>
              {customFields.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFields.map((field, idx) => (
                    <div key={field.id} className="flex gap-2">
                      <Input placeholder="Field Name (e.g. Vehicle No)" value={field.key} onChange={e => {
                        const newFields = [...customFields];
                        newFields[idx].key = e.target.value;
                        setCustomFields(newFields);
                      }} className="bg-gray-50/50 border-gray-200" />
                      <Input placeholder="Value" value={field.value} onChange={e => {
                        const newFields = [...customFields];
                        newFields[idx].value = e.target.value;
                        setCustomFields(newFields);
                      }} className="bg-gray-50/50 border-gray-200" />
                      <button type="button" onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No custom fields added.</p>
              )}
            </div>
          </Section>

          {/* GST Compliance */}
          {isGST && (
            <Section title="GST Compliance (India)" icon={<Receipt className="w-4 h-4 text-blue-600" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Your GSTIN" required>
                  <Input value={sellerGSTIN} onChange={e => setSellerGSTIN(e.target.value.toUpperCase())} placeholder="29XXXXX0000A1Z5" className="bg-gray-50/50 border-blue-200 font-mono uppercase" />
                </Field>
                <Field label="Customer GSTIN">
                  <Input value={buyerGSTIN} onChange={e => setBuyerGSTIN(e.target.value.toUpperCase())} placeholder="If GST-registered" className="bg-gray-50/50 border-blue-200 font-mono uppercase" />
                </Field>
                <Field label="Place of Supply">
                  <Input value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} placeholder="e.g. Karnataka (29)" className="bg-gray-50/50 border-blue-200" />
                </Field>
                <Field label="Tax Applicability">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsInterState(false)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${!isInterState ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-200'}`}>CGST + SGST (Intra-state)</button>
                    <button type="button" onClick={() => setIsInterState(true)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${isInterState ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500 hover:border-indigo-200'}`}>IGST (Inter-state)</button>
                  </div>
                </Field>
              </div>
            </Section>
          )}

          {/* Line Items */}
          <Section title="Line Items" icon={<Tag className="w-4 h-4 text-brand" />}>
            {/* Table header */}
            <div className="hidden lg:grid grid-cols-[2fr_80px_100px_90px_80px_36px] gap-2 mb-2 text-[10px] uppercase font-black text-gray-400 tracking-widest px-3 border border-transparent">
              <div>Item / Description</div>
              <div className="text-right">{isTimesheet ? 'Hours' : 'Qty'}</div>
              <div className="text-right">{isTimesheet ? 'Rate/Hr' : 'Price'}</div>
              <div className="text-right">Discount</div>
              <div className="text-right">Tax %</div>
              <div />
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item._id} className="border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow p-3">
                  <div className="grid grid-cols-1 lg:grid-cols-[2fr_80px_100px_90px_80px_36px] gap-2 items-start">
                    {/* Name + catalog datalist */}
                    <div className="space-y-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Item name or select from catalog…"
                          value={item.name}
                          onChange={e => updateItem(item._id, 'name', e.target.value)}
                          list={`cat-${item._id}`}
                          onBlur={e => {
                            const match = catalog.find(c => c.name === e.target.value);
                            if (match) fillFromCatalog(match.id, item._id);
                          }}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-semibold text-sm placeholder-gray-400 focus:outline-none focus:border-brand shadow-sm"
                        />
                        <datalist id={`cat-${item._id}`}>{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300">#{idx + 1}</span>
                      </div>
                      <input type="text" placeholder="Description (optional)" value={item.description} onChange={e => updateItem(item._id, 'description', e.target.value)} className="w-full px-3 py-1.5 bg-transparent border border-gray-100 rounded-lg text-gray-500 text-xs placeholder-gray-300 focus:outline-none focus:border-gray-300" />
                      {isGST && <input type="text" placeholder="HSN/SAC code" value={item.hsnSac} onChange={e => updateItem(item._id, 'hsnSac', e.target.value)} className="w-full px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs font-mono text-gray-700 focus:outline-none focus:border-blue-300 uppercase" />}
                    </div>
                    {/* Qty */}
                    <div className="flex flex-col gap-1">
                      <input type="number" min={0.01} step={0.01} value={item.quantity} onChange={e => updateItem(item._id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-brand shadow-sm" />
                      <select value={item.unit} onChange={e => updateItem(item._id, 'unit', e.target.value)} className="w-full px-1 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-500 focus:outline-none">
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    {/* Unit price */}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">{currency === 'INR' ? '₹' : '$'}</span>
                      <input type="number" min={0} step={0.01} value={item.unitPrice} onChange={e => updateItem(item._id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full pl-6 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-brand shadow-sm" />
                    </div>
                    {/* Discount */}
                    <div className="flex gap-1">
                      <input type="number" min={0} step={0.5} value={item.discount} onChange={e => updateItem(item._id, 'discount', parseFloat(e.target.value) || 0)} className="w-full px-2 py-2 bg-emerald-50/50 border border-emerald-100 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-emerald-400" />
                      <button type="button" onClick={() => updateItem(item._id, 'discountType', item.discountType === 'percent' ? 'fixed' : 'percent')} className="px-2 py-1 text-[10px] font-black bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 shrink-0">
                        {item.discountType === 'percent' ? '%' : '₹'}
                      </button>
                    </div>
                    {/* Tax */}
                    <div className="flex flex-col gap-1">
                      <div className="relative">
                        <input type="number" min={0} max={100} value={item.taxRate} onChange={e => updateItem(item._id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full pr-5 px-2 py-2 bg-orange-50/50 border border-orange-100 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-orange-300" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">%</span>
                      </div>
                      <select value={item.taxType} onChange={e => updateItem(item._id, 'taxType', e.target.value)} className="w-full px-1 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-500 focus:outline-none">
                        <option>GST</option><option>IGST</option><option>VAT</option><option>None</option>
                      </select>
                    </div>
                    {/* Delete */}
                    <button type="button" onClick={() => removeItem(item._id)} disabled={items.length === 1} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Line total chip */}
                  <div className="mt-2 flex justify-end">
                    <span className="text-xs font-black text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full font-mono">
                      {fmtCurrency(lineTotal(item), currency)} + {fmtCurrency(lineTax(item), currency)} tax = <span className="text-brand">{fmtCurrency(lineTotal(item) + lineTax(item), currency)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="border-gray-200 text-brand font-bold gap-1.5 h-8 text-xs hover:bg-red-50 rounded-lg"><Plus className="w-3.5 h-3.5" />Add Item</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setItems(p => [...p, { ...newItem(), ...p[p.length - 1], _id: crypto.randomUUID() }])} className="border-gray-200 text-gray-500 font-bold gap-1.5 h-8 text-xs hover:bg-gray-50 rounded-lg"><Copy className="w-3.5 h-3.5" />Duplicate Last</Button>
            </div>

            {/* Totals Summary */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="max-w-sm ml-auto bg-gray-50/80 border border-gray-100 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span className="font-bold font-mono text-gray-700">{fmtCurrency(subtotal, currency)}</span></div>
                {isGST && !isInterState ? (
                  <>
                    <div className="flex justify-between text-xs text-gray-400"><span>CGST</span><span className="font-mono">{fmtCurrency(taxTotal / 2, currency)}</span></div>
                    <div className="flex justify-between text-xs text-gray-400"><span>SGST</span><span className="font-mono">{fmtCurrency(taxTotal / 2, currency)}</span></div>
                  </>
                ) : <div className="flex justify-between text-xs text-gray-400"><span>{isGST ? 'IGST' : 'Tax'}</span><span className="font-mono">{fmtCurrency(taxTotal, currency)}</span></div>}
                {/* Global discount */}
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Global Discount</span>
                  <div className="flex gap-1 items-center">
                    <input type="number" min={0} value={discount} onChange={e => setDiscount(+e.target.value)} className="w-20 px-2 py-1 text-xs font-bold text-right bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-brand" />
                    <button type="button" onClick={() => setDiscountType(p => p === 'percent' ? 'fixed' : 'percent')} className="px-2 py-1 text-[10px] font-black bg-white border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">{discountType === 'percent' ? '%' : '₹'}</button>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-gray-700 tracking-wide">Grand Total</span>
                  <span className="text-xl font-black font-mono" style={{ color: accentColor }}>{fmtCurrency(grandTotal, currency)}</span>
                </div>
              </div>
            </div>
          </Section>

          {/* Payment Section */}
          <Section title="Payment Details" icon={<CreditCard className="w-4 h-4 text-emerald-600" />} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Payment Method">
                <div className="grid grid-cols-2 gap-1.5">
                  {PAY_METHODS.map(m => (
                    <button key={m} type="button" onClick={() => setPaymentMethod(p => p === m ? '' : m)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${paymentMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="space-y-4">
                <Field label="Transaction / Reference ID">
                  <Input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="TXN123456" className="bg-gray-50/50 border-gray-200 font-mono" />
                </Field>
                <Field label="Partial Payment Received">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency === 'INR' ? '₹' : '$'}</span>
                    <Input type="number" min={0} value={partialPayment} onChange={e => setPartialPayment(+e.target.value)} className="pl-7 bg-gray-50/50 border-emerald-200" />
                  </div>
                  {partialPayment > 0 && <p className="text-xs text-emerald-600 font-bold mt-1">Balance Due: {fmtCurrency(balanceDue, currency)}</p>}
                </Field>
                <Field label="Payment Notes">
                  <Input value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="e.g. Paid via NEFT on 28 Mar" className="bg-gray-50/50 border-gray-200" />
                </Field>
              </div>
            </div>
          </Section>

          {/* Notes & Terms */}
          <Section title="Notes & Terms" icon={<FileText className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Customer Notes">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Thank you for your business! Please send payment within 30 days." className={`${cls} resize-y min-h-[100px]`} />
              </Field>
              <Field label="Terms & Conditions">
                <textarea value={termsText} onChange={e => setTermsText(e.target.value)} rows={4} className={`${cls} resize-y min-h-[100px]`} />
              </Field>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
