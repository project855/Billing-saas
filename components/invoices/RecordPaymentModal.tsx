'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X, DollarSign, CreditCard, Building2, Banknote, Smartphone, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';

const METHODS = [
  { value: 'UPI',  label: 'UPI',          icon: <Smartphone className="w-4 h-4" /> },
  { value: 'Bank', label: 'Bank Transfer', icon: <Building2 className="w-4 h-4" /> },
  { value: 'Card', label: 'Card',          icon: <CreditCard className="w-4 h-4" /> },
  { value: 'Cash', label: 'Cash',          icon: <Banknote className="w-4 h-4" /> },
  { value: 'Cheque', label: 'Cheque',      icon: <CheckSquare className="w-4 h-4" /> },
];

interface Props {
  invoice: any;
  onClose: () => void;
  onSuccess: () => void;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function RecordPaymentModal({ invoice, onClose, onSuccess }: Props) {
  const balance = invoice.balance ?? invoice.amount;
  const [amount, setAmount] = useState(String(balance));
  const [method, setMethod] = useState('UPI');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { toast.error('Enter a valid amount'); return; }
    if (parsedAmount > balance + 0.01) { toast.error(`Amount cannot exceed balance of ${formatINR(balance)}`); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount, method, date, transactionId: transactionId || undefined, notes: notes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success(json.message);
      onSuccess();
    } catch { toast.error('Failed to record payment'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Record Payment</h2>
              <p className="text-xs text-gray-400">{invoice.invoiceNumber} · Balance: {formatINR(balance)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Received</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">₹</span>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="pl-7 bg-gray-50 border-gray-200 text-gray-900 font-bold text-lg h-11 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/30"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount(String(Math.round(balance * pct / 100)))}
                  className="flex-1 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-5 gap-2">
              {METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[11px] font-medium transition-all ${
                    method === m.value
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Date</label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="bg-gray-50 border-gray-200 text-gray-900 h-10 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/30"
            />
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Transaction ID <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <Input
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              placeholder="e.g. UTR12345678"
              className="bg-gray-50 border-gray-200 text-gray-900 h-10 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500/30"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Note <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/10 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-10 border-none shadow-sm"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
