'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Expense {
  id: string
  category: string
  amount: number
  currency: string
  description?: string
  date: string
  merchant?: string
  status: string
}

export function ExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchExpenses()
  }, [])

  async function fetchExpenses() {
    try {
      const response = await fetch('/api/expenses')
      const data = await response.json()
      if (data.success) {
        setExpenses(data.data)
      }
    } catch (error) {
      toast.error('Failed to load expenses')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteExpense(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Expense deleted')
        setExpenses(expenses.filter((e) => e.id !== id))
      } else {
        toast.error('Failed to delete expense')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      REIMBURSED: 'outline',
    }
    return colors[status] || 'default'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      OFFICE_SUPPLIES: 'Office Supplies',
      UTILITIES: 'Utilities',
      TRAVEL: 'Travel',
      MEALS: 'Meals',
      ENTERTAINMENT: 'Entertainment',
      MARKETING: 'Marketing',
      PROFESSIONAL_SERVICES: 'Professional Services',
      EQUIPMENT: 'Equipment',
      SOFTWARE: 'Software',
      OTHER: 'Other',
    }
    return labels[category] || category
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
        <CardTitle className="text-white">All Expenses</CardTitle>
        <CardDescription className="text-gray-400">Total: {expenses.length} expenses</CardDescription>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No expenses logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Merchant
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-600">
                    Amount
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
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-200 hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {expense.merchant || '-'}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {expense.currency} {expense.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/expenses/${expense.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteExpense(expense.id)}
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
