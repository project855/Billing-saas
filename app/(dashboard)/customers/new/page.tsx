import { AppLayout } from '@/components/app-layout';
import { CustomerForm } from '@/components/customer-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewCustomerPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Create New Customer</h1>
            <p className="text-gray-400">Add a new customer to your account</p>
          </div>
          <Link href="/customers" className="flex items-center gap-2 text-green-500 hover:text-green-400">
            <ArrowLeft size={20} />
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-100 rounded-lg p-8">
          <CustomerForm />
        </div>
      </div>
    </AppLayout>
  );
}
