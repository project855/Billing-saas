'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Payment {
  id: string
  invoiceNumber: string
  amount: number
  method: string
  status: string
  receivedDate: string
  reference?: string
}

export function PaymentsList() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const response = await fetch('/api/payments')
      const data = await response.json()
      if (data.success) {
        setPayments(data.data)
      }
    } catch (error) {
      toast.error('Failed to load payments')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function deletePayment(id: string) {
    if (!confirm('Are you sure you want to delete this payment?')) return

    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Payment deleted')
        setPayments(payments.filter((p) => p.id !== id))
      } else {
        toast.error('Failed to delete payment')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      COMPLETED: 'default',
      FAILED: 'destructive',
      CANCELLED: 'secondary',
      REFUNDED: 'outline',
    }
    return colors[status] || 'default'
  }

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      BANK_TRANSFER: 'Bank Transfer',
      CREDIT_CARD: 'Credit Card',
      DEBIT_CARD: 'Debit Card',
      CASH: 'Cash',
      CHECK: 'Check',
      PAYPAL: 'PayPal',
      STRIPE: 'Stripe',
      OTHER: 'Other',
    }
    return labels[method] || method
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
        <CardTitle className="text-white">All Payments</CardTitle>
        <CardDescription className="text-gray-400">Total: {payments.length} payments</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No payments recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Invoice
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Method
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-white">
                      {payment.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      ${payment.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {getMethodLabel(payment.method)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(payment.receivedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePayment(payment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
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
