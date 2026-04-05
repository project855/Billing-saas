'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const schema = z.object({
  displayName: z.string().min(1, 'Display Name is required'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  gstNumber: z.string()
    .max(15, 'GST must be 15 chars max')
    .optional()
    .refine(val => !val || val.length === 15, { message: "GST must be 15 chars" }),
  panNumber: z.string().optional(),
  currency: z.enum(['INR', 'USD', 'EUR']),
  paymentTerms: z.enum(['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60']),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  sameAsBilling: z.boolean().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AddCustomerModal({ open, onOpenChange, onSuccess, initialData }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void, initialData?: any }) {
  const [loading, setLoading] = useState(false);

  const form = useHookForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      currency: 'INR',
      paymentTerms: 'Net 30',
      sameAsBilling: false,
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (data.sameAsBilling) {
        data.shippingAddress = data.billingAddress;
      }
      
      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `/api/customers/${initialData.id}` : '/api/customers';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Failed to save customer');
      
      toast.success(initialData?.id ? 'Customer updated successfully' : 'Customer created successfully');
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white text-gray-900 border-gray-200 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{initialData?.id ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Display Name <span className="text-red-500">*</span></Label>
              <Input {...form.register('displayName')} className="bg-white border-gray-200" />
              {form.formState.errors.displayName && <p className="text-red-500 text-xs">{form.formState.errors.displayName.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input {...form.register('companyName')} className="bg-white border-gray-200" />
            </div>

            <div className="space-y-1.5">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" {...form.register('email')} className="bg-white border-gray-200" />
              {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input type="tel" {...form.register('phone')} className="bg-white border-gray-200" />
            </div>

            <div className="space-y-1.5">
              <Label>GST Number</Label>
              <Input {...form.register('gstNumber')} className="bg-white border-gray-200" placeholder="15 chars" />
              {form.formState.errors.gstNumber && <p className="text-red-500 text-xs">{form.formState.errors.gstNumber.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>PAN Number</Label>
              <Input {...form.register('panNumber')} className="bg-white border-gray-200" />
            </div>
            
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <select {...form.register('currency')} className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Terms</Label>
              <select {...form.register('paymentTerms')} className="flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Billing Address</Label>
              <Textarea {...form.register('billingAddress')} className="bg-white border-gray-200 min-h-[100px]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center mb-1">
                <Label>Shipping Address</Label>
                <label className="flex items-center space-x-2 text-xs text-gray-400">
                  <input type="checkbox" {...form.register('sameAsBilling')} className="rounded border-gray-200 bg-white accent-[#22c55e]" />
                  <span>Same as Billing</span>
                </label>
              </div>
              <Textarea 
                {...form.register('shippingAddress')} 
                disabled={form.watch('sameAsBilling')} 
                className="bg-white border-gray-200 min-h-[100px] disabled:opacity-50" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...form.register('notes')} className="bg-white border-gray-200" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 hover:bg-gray-50 text-white">Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-[#22c55e] hover:bg-[#1ea34d] text-white">
              {loading ? 'Saving...' : 'Save Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
