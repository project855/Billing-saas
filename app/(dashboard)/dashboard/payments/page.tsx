import { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PaymentsList } from '@/components/payments-list'

export const metadata: Metadata = {
  title: 'Payments - Augfox',
  description: 'Track and manage your payments',
}

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-400 mt-2">
            Record and manage customer payments
          </p>
        </div>
        <Link href="/dashboard/payments/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </div>

      {/* Payments List */}
      <PaymentsList />
    </div>
  )
}
