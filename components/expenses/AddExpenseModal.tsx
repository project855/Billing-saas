'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { X, TrendingDown, Plus, Tag } from 'lucide-react';

interface Props {
  categories: any[];
  expense?:   any | null;   // if set → edit mode
  onClose:    () => void;
  onSuccess:  () => void;
}

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function AddExpenseModal({ categories, expense, onClose, onSuccess }: Props) {
  const isEdit = !!expense;

  const [categoryId,   setCategoryId]   = useState(expense?.categoryId      ?? '');
  const [amount,       setAmount]       = useState(expense ? String(expense.amount) : '');
  const [description,  setDescription]  = useState(expense?.description      ?? '');
  const [date,         setDate]         = useState(
    expense ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [saving, setSaving] = useState(false);

  // Quick amount shortcuts
  const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!categoryId) { toast.error('Please select a category'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }

    setSaving(true);
    try {
      const url    = isEdit ? `/api/expenses/${expense.id}` : '/api/expenses';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, amount: parsedAmount, description: description.trim(), date }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to save expense'); return; }
      toast.success(json.message ?? (isEdit ? 'Expense updated' : 'Expense added'));
      onSuccess();
    } catch { toast.error('Something went wrong'); }
    finally { setSaving(false); }
  };

  const selectedCat = categories.find(c => c.id === categoryId);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
              <p className="text-xs text-gray-400">{isEdit ? 'Update expense details' : 'Log a new business expense'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">₹</span>
              <Input
                type="number" step="0.01" value={amount}
                onChange={e => setAmount(e.target.value)} required autoFocus
                className="pl-7 bg-gray-50 border-gray-200 text-gray-900 font-bold text-xl h-12 focus-visible:ring-brand/20 focus-visible:border-brand/30"
                placeholder="0.00"
              />
            </div>
            {/* Quick Amount chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_AMOUNTS.map(q => (
                <button key={q} type="button"
                  onClick={() => setAmount(String(q))}
                  className="px-2.5 py-1 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                >
                  ₹{q.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            {categories.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center">
                <Tag className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400">No categories yet. Close this and click <strong>"Categories"</strong> to add some.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {categories.map(cat => (
                  <button key={cat.id} type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                      categoryId === cat.id
                        ? 'border-2 shadow-sm'
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                    }`}
                    style={categoryId === cat.id ? {
                      background:   cat.color + '15',
                      borderColor:  cat.color + '60',
                      color:        cat.color,
                    } : {}}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <Input
              value={description} onChange={e => setDescription(e.target.value)} required
              placeholder="e.g. Office supplies, Domain renewal, Team lunch"
              className="bg-gray-50 border-gray-200 text-gray-900 h-10 focus-visible:ring-brand/20 focus-visible:border-brand/30"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
            <Input
              type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="bg-gray-50 border-gray-200 text-gray-900 h-10 focus-visible:ring-brand/20 focus-visible:border-brand/30"
            />
          </div>

          {/* Summary preview */}
          {amount && categoryId && description && (
            <div className="rounded-xl p-3.5 border"
              style={{ background: (selectedCat?.color ?? '#EF3A2A') + '10', borderColor: (selectedCat?.color ?? '#EF3A2A') + '30' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: selectedCat?.color ?? '#EF3A2A' }}>
                    {selectedCat?.name ?? 'Expense'}
                  </p>
                  <p className="text-sm text-gray-700 font-medium">{description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(date), 'dd MMM yyyy')}</p>
                </div>
                <p className="text-xl font-bold" style={{ color: selectedCat?.color ?? '#EF3A2A' }}>
                  ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}
              className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 h-10">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || categories.length === 0}
              className="flex-1 bg-brand hover:brightness-90 text-white font-semibold h-10 border-none shadow-sm">
              {saving ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Expense')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
