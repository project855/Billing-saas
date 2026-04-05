'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { X, Tag, Plus, Trash2, Palette } from 'lucide-react';

interface Props {
  categories: any[];
  onClose:    () => void;
  onSuccess:  () => void;
}

// A curated palette of pleasant colors
const COLOR_PALETTE = [
  '#EF3A2A', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
  '#64748b', '#059669', '#dc2626', '#7c3aed', '#0891b2',
];

export default function ManageCategoriesModal({ categories, onClose, onSuccess }: Props) {
  const [newName,   setNewName]   = useState('');
  const [newColor,  setNewColor]  = useState('#6366f1');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Enter a category name'); return; }

    setSaving(true);
    try {
      const res  = await fetch('/api/expense-categories', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success('Category created!');
      setNewName('');
      onSuccess();
    } catch { toast.error('Failed to create category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (cat: any) => {
    if (cat._count?.expenses > 0) {
      toast.error(`Cannot delete "${cat.name}" — it has ${cat._count.expenses} expense(s) linked.`);
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    setDeleting(cat.id);
    try {
      const res  = await fetch(`/api/expense-categories/${cat.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Failed to delete'); return; }
      toast.success('Category deleted');
      onSuccess();
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center">
              <Tag className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Manage Categories</h2>
              <p className="text-xs text-gray-400">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create new */}
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand" /> Add New Category
            </h3>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      newColor === c ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* Name input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                  style={{ background: newColor }} />
                <Input
                  value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Category name (e.g. Travel, Software)"
                  className="pl-8 bg-gray-50 border-gray-200 text-gray-900 h-10 focus-visible:ring-violet-500/20"
                />
              </div>
              <Button type="submit" disabled={saving}
                className="bg-violet-600 hover:bg-violet-700 text-white font-semibold h-10 border-none px-5 shadow-sm gap-2">
                <Plus className="w-4 h-4" />
                {saving ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </form>

          {/* Existing categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Existing Categories</h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No categories yet — add one above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <div key={cat.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {cat._count?.expenses ?? 0} expense{(cat._count?.expenses ?? 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={deleting === cat.id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        (cat._count?.expenses ?? 0) > 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title={(cat._count?.expenses ?? 0) > 0 ? 'Cannot delete — has linked expenses' : 'Delete category'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="button" onClick={onClose} variant="outline"
            className="w-full border-gray-200 text-gray-600 h-10">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
