'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewInvoicePage() {
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Redirect to invoices list
        window.location.href = '/dashboard/invoices';
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-400 mt-2">Create a new invoice for your customer.</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <Card className="bg-white border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Invoice Number</label>
              <Input
                type="text"
                placeholder="INV-001"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="bg-gray-50 border-gray-200 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Customer</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-white"
                required
              >
                <option value="">Select a customer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Issue Date</label>
              <Input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="bg-gray-50 border-gray-200 text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Due Date</label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-gray-50 border-gray-200 text-gray-900"
                required
              />
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card className="bg-white border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Invoice Items</h2>
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Item description"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].description = e.target.value;
                    setFormData({ ...formData, items: newItems });
                  }}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].quantity = parseFloat(e.target.value);
                    setFormData({ ...formData, items: newItems });
                  }}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
                <Input
                  type="number"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={(e) => {
                    const newItems = [...formData.items];
                    newItems[index].unitPrice = parseFloat(e.target.value);
                    setFormData({ ...formData, items: newItems });
                  }}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Summary */}
        <Card className="bg-white border-gray-100 p-6">
          <div className="flex justify-end mb-6">
            <div className="w-full md:w-64">
              <div className="flex justify-between text-white mb-2">
                <span>Subtotal:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/dashboard/invoices">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Create Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
