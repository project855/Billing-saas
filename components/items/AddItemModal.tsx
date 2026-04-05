'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useSettings } from '@/lib/settings-context';

const schema = z.object({
  name: z.string().min(1, 'Item Name is required'),
  type: z.enum(['product', 'service']),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  sellingPrice: z.coerce.number({ invalid_type_error: 'Required' }).min(0, 'Selling price must be valid'),
  purchasePrice: z.preprocess((val) => (val === '' || Number.isNaN(val) ? null : Number(val)), z.number().nullable().optional()),
  taxable: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
  taxRate: z.preprocess((val) => (val === '' || Number.isNaN(val) ? 0 : Number(val)), z.number().optional()),
  hsnCode: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type FormData = z.infer<typeof schema>;

export function AddItemModal({ open, onOpenChange, onSuccess, initialData }: { open: boolean, onOpenChange: (o: boolean) => void, onSuccess: () => void, initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const { taxRate: defaultTaxRate } = useSettings();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      ...initialData,
      sellingPrice: Number(initialData.sellingPrice),
      purchasePrice: initialData.purchasePrice ? Number(initialData.purchasePrice) : null,
      taxRate: initialData.taxRate ? Number(initialData.taxRate) : 0,
    } : {
      type: 'product',
      unit: 'Nos',
      taxable: true,
      taxRate: defaultTaxRate,
      status: 'active',
      sellingPrice: 0,
    }
  });

  const isTaxable = form.watch('taxable');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `/api/items/${initialData.id}` : '/api/items';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Failed to save item');
      
      toast.success(initialData?.id ? 'Item updated successfully' : 'Item created successfully');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      toast.error(err.message || 'Error saving item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white text-gray-900 border-gray-200 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{initialData?.id ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label>Item Name <span className="text-red-500">*</span></Label>
              <Input {...form.register('name')} className="bg-white border-gray-200" />
              {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Item Type <span className="text-red-500">*</span></Label>
              <select {...form.register('type')} className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label>SKU / Code</Label>
              <Input {...form.register('sku')} placeholder="Auto-generated if left empty" className="bg-white border-gray-200 placeholder:text-gray-600" />
            </div>

            <div className="space-y-1.5">
              <Label>Unit <span className="text-red-500">*</span></Label>
              <select {...form.register('unit')} className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="Nos">Nos</option>
                <option value="Hours">Hours</option>
                <option value="Days">Days</option>
                <option value="Kg">Kg</option>
                <option value="Liters">Liters</option>
                <option value="Box">Box</option>
                <option value="Pack">Pack</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Selling Price (₹) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" {...form.register('sellingPrice', { valueAsNumber: true })} className="bg-white border-gray-200" />
              {form.formState.errors.sellingPrice && <p className="text-red-500 text-xs">{form.formState.errors.sellingPrice.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Purchase Price (₹)</Label>
              <Input type="number" step="0.01" {...form.register('purchasePrice', { valueAsNumber: true })} className="bg-white border-gray-200" placeholder="Optional" />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="mb-2 block">Tax Preference</Label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" value="true" {...form.register('taxable')} defaultChecked={isTaxable === true} onChange={() => form.setValue('taxable', true)} className="accent-[#22c55e]" /> Taxable
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" value="false" {...form.register('taxable')} defaultChecked={isTaxable === false} onChange={() => form.setValue('taxable', false)} className="accent-[#22c55e]" /> Non-Taxable
                </label>
              </div>
            </div>

            {isTaxable && (
              <div className="space-y-1.5">
                <Label>Tax Rate (%) <span className="text-red-500">*</span></Label>
                <select {...form.register('taxRate', { valueAsNumber: true })} className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>SAC/HSN Code</Label>
              <Input {...form.register('hsnCode')} className="bg-white border-gray-200" />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label>Description</Label>
              <Textarea {...form.register('description')} className="bg-white border-gray-200 h-20" />
            </div>
            
            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex gap-4 items-center mt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <div className={`w-10 h-5 rounded-full relative transition duration-200 ease-in-out border border-gray-200 ${form.watch('status') === 'active' ? 'bg-[#22c55e]' : 'bg-gray-600'}` } onClick={() => form.setValue('status', form.watch('status') === 'active' ? 'inactive' : 'active')}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all duration-200 ${form.watch('status') === 'active' ? 'left-[22px]' : 'left-1'}`}></div>
                  </div>
                  {form.watch('status') === 'active' ? 'Active' : 'Inactive'}
                </label>
              </div>
            </div>

          </div>

          <DialogFooter className="mt-8 border-t border-gray-200 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-brand hover:brightness-90 text-white border-none shadow-sm min-w-[120px]">
              {loading ? 'Saving...' : (initialData?.id ? 'Update Item' : 'Save Item')}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
