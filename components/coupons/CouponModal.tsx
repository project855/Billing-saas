'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Coupon Name is required'),
  code: z.string().min(1, 'Coupon Code is required'),
  productId: z.string().optional().nullable(),
  discountType: z.enum(['flat', 'percentage']),
  discountValue: z.coerce.number({ invalid_type_error: 'Required' }).min(0, 'Must be positive'),
  redemptionType: z.enum(['one-time', 'forever', 'limited']),
  maxRedemptions: z.preprocess((val) => (val === '' || Number.isNaN(val) ? null : Number(val)), z.number().nullable().optional()),
  expirationDate: z.string().optional().nullable(),
  associatePlans: z.string().optional(),
  associateAddons: z.string().optional(),
  status: z.enum(['active', 'inactive', 'expired']).default('active'),
});

type FormData = z.infer<typeof schema>;

export function CouponModal({ open, onOpenChange, onSuccess, initialData }: { open: boolean, onOpenChange: (o: boolean) => void, onSuccess: () => void, initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      fetch('/api/items?type=all')
        .then(res => res.json())
        .then(data => setItems(data.items || []))
        .catch(console.error);
    }
  }, [open]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      ...initialData,
      discountValue: Number(initialData.discountValue),
      maxRedemptions: initialData.maxRedemptions ? Number(initialData.maxRedemptions) : null,
      expirationDate: initialData.expirationDate ? new Date(initialData.expirationDate).toISOString().split('T')[0] : null,
    } : {
      discountType: 'flat',
      discountValue: 0,
      redemptionType: 'one-time',
      status: 'active',
      associatePlans: 'All Plans',
      associateAddons: 'All Recurring Addons',
    }
  });

  const redemptionType = form.watch('redemptionType');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `/api/coupons/${initialData.id}` : '/api/coupons';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save coupon');
      
      toast.success(initialData?.id ? 'Coupon updated' : 'Coupon created successfully');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      toast.error(err.message || 'Error saving coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white text-gray-900 border-gray-200 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{initialData?.id ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label className="text-red-500 font-medium">Product*</Label>
              <select {...form.register('productId')} className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Select Product</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            {/* Empty column to match screenshot layout */}
            <div className="hidden sm:block"></div>

            <div className="space-y-1.5">
              <Label className="text-red-500 font-medium">Coupon Name*</Label>
              <Input {...form.register('name')} className="bg-white border-blue-400 focus-visible:ring-blue-400 h-10" />
              {form.formState.errors.name && <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-red-500 font-medium">Coupon Code*</Label>
              <Input {...form.register('code')} className="bg-white border-gray-200 h-10" />
              {form.formState.errors.code && <p className="text-red-500 text-xs">{form.formState.errors.code.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-red-500 font-medium">Discount (INR)*</Label>
              <div className="flex">
                <Input type="number" step="0.01" {...form.register('discountValue', { valueAsNumber: true })} className="bg-white border-gray-200 rounded-r-none h-10 border-r-0" />
                <select {...form.register('discountType')} className="flex h-10 rounded-r-md border border-gray-200 bg-gray-50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring outline-none">
                  <option value="flat">Flat</option>
                  <option value="percentage">%</option>
                </select>
              </div>
              {form.formState.errors.discountValue && <p className="text-red-500 text-xs">{form.formState.errors.discountValue.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-red-500 font-medium">Redemption Type*</Label>
              <select {...form.register('redemptionType')} className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="one-time">One-Time</option>
                <option value="forever">Forever</option>
                <option value="limited">Limited Number of Times</option>
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-md font-bold text-gray-900 mb-4 border-b pb-2">Applicability</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-red-500 font-medium">Associate Plans*</Label>
                <select {...form.register('associatePlans')} className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="All Plans">All Plans</option>
                  <option value="Specific Plans">Specific Plans</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-red-500 font-medium">Associate Addons*</Label>
                <select {...form.register('associateAddons')} className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="All Recurring Addons">All Recurring Addons</option>
                  <option value="Specific Addons">Specific Addons</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-md font-bold text-gray-900 mb-4 border-b pb-2">Validity</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="font-medium text-gray-800">Expiration Date</Label>
                <Input type="date" {...form.register('expirationDate')} className="bg-white border-gray-200 h-10 text-gray-500" placeholder="Click or Type to select" />
              </div>

              {redemptionType === 'limited' ? (
                <div className="space-y-1.5">
                  <Label className="font-medium text-gray-800">Maximum Redemptions</Label>
                  <Input type="number" {...form.register('maxRedemptions', { valueAsNumber: true })} className="bg-white border-gray-200 h-10" placeholder="Enter a number" />
                </div>
              ) : (
                <div className="hidden sm:block"></div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-8 pt-4 sm:justify-start">
            <Button type="submit" disabled={loading} className="bg-[#10b981] hover:bg-[#059669] text-white border-none shadow-sm min-w-[80px]">
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-800 hover:bg-gray-50 ml-2">
              Cancel
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
