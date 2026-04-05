import { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { InvoicesList } from '@/components/invoices-list'

export const metadata: Metadata = {
  title: 'Invoices - Augfox',
  description: 'Manage and track your invoices',
}

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-400 mt-2">
            Create and manage customer invoices
          </p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Invoices List */}
      <InvoicesList />
    </div>
  )
}
