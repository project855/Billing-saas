import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ChallansPage() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Delivery Challans</h1>
            <p className="text-gray-400">Manage delivery challans</p>
          </div>
          <Link href="/challans/new">
            <Button className="bg-brand hover:brightness-90 text-gray-950">
              <Plus size={18} className="mr-2" />
              New Challan
            </Button>
          </Link>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-400">Delivery challans management coming soon...</p>
        </div>
      </div>
    </AppLayout>
  );
}
