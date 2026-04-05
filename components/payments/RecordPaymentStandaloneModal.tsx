'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  X, DollarSign, CreditCard, Building2, Banknote,
  Smartphone, CheckSquare, Search, ChevronDown, AlertCircle
} from 'lucide-react';

const METHODS = [
  { value: 'UPI',    label: 'UPI',     icon: <Smartphone  className="w-4 h-4" /> },
  { value: 'Bank',   label: 'Bank',    icon: <Building2   className="w-4 h-4" /> },
  { value: 'Card',   label: 'Card',    icon: <CreditCard  className="w-4 h-4" /> },
  { value: 'Cash',   label: 'Cash',    icon: <Banknote    className="w-4 h-4" /> },
  { value: 'Cheque', label: 'Cheque',  icon: <CheckSquare className="w-4 h-4" /> },
];

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

interface Props {
  onClose:   () => void;
  onSuccess: () => void;
  preselectedInvoice?: any;
}

export default function RecordPaymentStandaloneModal({ onClose, onSuccess, preselectedInvoice }: Props) {
  const [step, setStep]               = useState<'invoice' | 'payment'>(preselectedInvoice ? 'payment' : 'invoice');
  const [invoices, setInvoices]       = useState<any[]>([]);
  const [invoiceSearch, setInvSearch] = useState('');
  const [selectedInvoice, setSelected]= useState<any>(preselectedInvoice ?? null);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);

  // Payment form state
  const [amount,        setAmount]        = useState(preselectedInvoice ? String(preselectedInvoice.balance ?? preselectedInvoice.amount) : '');
  const [method,        setMethod]        = useState('UPI');
  const [date,          setDate]          = useState(format(new Date(), 'yyyy-MM-dd'));
  const [transactionId, setTransactionId] = useState('');
  const [notes,         setNotes]         = useState('');

  // Fetch unpaid/partially-paid invoices
  useEffect(() => {
    setLoading(true);
    const q = invoiceSearch ? `&search=${encodeURIComponent(invoiceSearch)}` : '';
    fetch(`/api/invoices?status=Sent${q}`)
      .then(r => r.json())
      .then(j => setInvoices(Array.isArray(j.data) ? j.data : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [invoiceSearch]);

  const pickInvoice = (inv: any) => {
    setSelected(inv);
    setAmount(String(inv.balance > 0 ? inv.balance : inv.amount));
    setStep('payment');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { toast.error('Enter a valid amount'); return; }

    const balance = selectedInvoice.balance ?? selectedInvoice.amount;
    if (parsedAmount > balance + 0.01) {
      toast.error(`Amount cannot exceed balance of ${formatINR(balance)}`);
      return;
    }

    setSaving(true);
    try {
      const res  = await fetch('/api/payments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId:     selectedInvoice.id,
          amount:        parsedAmount,
          method,
          date,
          transactionId: transactionId || null,
          notes:         notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success(json.message);
      onSuccess();
    } catch { toast.error('Failed to record payment'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Record Payment</h2>
              <p className="text-xs text-gray-400">
                {step === 'invoice' ? 'Select an invoice to pay' : `Invoice ${selectedInvoice?.invoiceNumber}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Step 1: Invoice Picker */}
        {step === 'invoice' && (
          <div className="p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices by # or customer..."
                value={invoiceSearch}
                onChange={e => setInvSearch(e.target.value)}
                className="pl-9 bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 h-10"
                autoFocus
              />
            </div>

            {/* Invoice List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))
              ) : invoices.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No outstanding invoices found</p>
                  <p className="text-gray-400 text-xs mt-1">All sent invoices are already paid, or none exist yet.</p>
                </div>
              ) : (
                invoices.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => pickInvoice(inv)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-brand/5 hover:border-brand/20 border border-gray-100 rounded-xl transition-all text-left group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 text-sm">{inv.invoiceNumber}</span>
                        <span className="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{inv.customer?.displayName}</p>
                      <p className="text-[11px] text-gray-400">
                        Due: {format(new Date(inv.dueDate), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand text-base">{formatINR(inv.balance ?? inv.amount)}</p>
                      <p className="text-[10px] text-gray-400">balance due</p>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-brand rotate-[-90deg] mt-1 ml-auto transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Payment Form */}
        {step === 'payment' && selectedInvoice && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Invoice summary pill */}
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-400 font-medium">Invoice</p>
                <p className="font-bold font-mono text-gray-900">{selectedInvoice.invoiceNumber}</p>
                <p className="text-xs text-gray-500">{selectedInvoice.customer?.displayName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Balance Due</p>
                <p className="text-xl font-bold text-brand">
                  {formatINR(selectedInvoice.balance ?? selectedInvoice.amount)}
                </p>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Received *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
                <Input
                  type="number" step="0.01" value={amount}
                  onChange={e => setAmount(e.target.value)} required autoFocus
                  className="pl-7 bg-gray-50 border-gray-200 text-gray-900 font-bold text-lg h-11 focus-visible:ring-emerald-500/20"
                />
              </div>
              {/* Quick fill */}
              <div className="flex gap-2 mt-2">
                {[25, 50, 75, 100].map(pct => {
                  const bal = selectedInvoice.balance ?? selectedInvoice.amount;
                  return (
                    <button key={pct} type="button"
                      onClick={() => setAmount(String(Math.round(bal * pct / 100)))}
                      className="flex-1 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
              <div className="grid grid-cols-5 gap-2">
                {METHODS.map(m => (
                  <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[11px] font-semibold transition-all ${
                      method === m.value
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date *</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="bg-gray-50 border-gray-200 text-gray-900 h-10" />
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Transaction / UTR ID <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Input value={transactionId} onChange={e => setTransactionId(e.target.value)}
                placeholder="e.g. UTR12345678 or payment reference"
                className="bg-gray-50 border-gray-200 text-gray-900 h-10" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Any additional notes"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep('invoice')}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 h-10">
                ← Back
              </Button>
              <Button type="button" variant="outline" onClick={onClose}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-10 border-none shadow-sm">
                {saving ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
