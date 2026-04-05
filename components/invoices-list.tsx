'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Eye, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  status: string
  dueDate: string
  issueDate: string
}

export function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      const response = await fetch('/api/invoices')
      const data = await response.json()
      if (data.success) {
        setInvoices(data.data)
      }
    } catch (error) {
      toast.error('Failed to load invoices')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Are you sure you want to delete this invoice?')) return

    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Invoice deleted')
        setInvoices(invoices.filter((inv) => inv.id !== id))
      } else {
        toast.error('Failed to delete invoice')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'secondary',
      SENT: 'outline',
      VIEWED: 'outline',
      PAID: 'default',
      PARTIALLY_PAID: 'secondary',
      OVERDUE: 'destructive',
      CANCELLED: 'secondary',
    }
    return colors[status] || 'default'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-white">All Invoices</CardTitle>
        <CardDescription className="text-gray-400">Total: {invoices.length} invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No invoices yet</p>
            <Link href="/dashboard/invoices/new">
              <Button className="bg-blue-600 hover:bg-blue-700">Create First Invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Invoice #
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Due Date
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="font-medium text-blue-400 hover:text-blue-300"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {invoice.customerName}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      ${invoice.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInvoice(invoice.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
