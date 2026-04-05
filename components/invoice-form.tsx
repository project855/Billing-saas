'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2 } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
}

interface InvoiceFormProps {
  onSubmit?: (data: any) => void;
  isLoading?: boolean;
}

export function InvoiceForm({ onSubmit, isLoading }: InvoiceFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: 30,
    notes: '',
    tax: 0,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, tax: 0 },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    const newId = Math.random().toString();
    setItems((prev) => [...prev, { id: newId, description: '', quantity: 1, unitPrice: 0, tax: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice + item.tax, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ ...formData, items });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer and Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Customer</label>
          <select
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-brand/40"
          >
            <option value="">Select Customer</option>
            <option value="1">Acme Corp</option>
            <option value="2">Tech Solutions Inc</option>
            <option value="3">Global Enterprises</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Issue Date</label>
          <input
            type="date"
            name="issueDate"
            value={formData.issueDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-brand/40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Due Date</label>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-brand/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Payment Terms (days)</label>
          <input
            type="number"
            name="paymentTerms"
            value={formData.paymentTerms}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-brand/40"
          />
        </div>
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Line Items</h3>
          <Button
            type="button"
            onClick={addItem}
            variant="outline"
            className="border-gray-200 text-red-500 hover:text-red-400"
          >
            <Plus size={18} className="mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                className="col-span-5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand/40 text-sm"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))}
                className="col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand/40 text-sm"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))}
                className="col-span-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand/40 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="col-span-1 flex items-center justify-center text-red-400 hover:text-red-300"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tax and Total */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Tax Rate (%)</label>
          <input
            type="number"
            name="tax"
            value={formData.tax}
            onChange={handleChange}
            step="0.01"
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-brand/40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Total Amount</label>
          <input
            type="text"
            disabled
            value={`$${calculateTotal().toFixed(2)}`}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-red-400 font-bold"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand/40 min-h-20"
          placeholder="Add invoice notes or terms"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || items.length === 0}
          className="flex-1 bg-red-500 hover:bg-red-600 text-gray-900 font-medium"
        >
          <Save size={18} className="mr-2" />
          {isLoading ? 'Creating...' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
