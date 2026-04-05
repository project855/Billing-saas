import { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExpensesList } from '@/components/expenses-list'

export const metadata: Metadata = {
  title: 'Expenses - Augfox',
  description: 'Track and manage your business expenses',
}

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-400 mt-2">
            Log and categorize your business expenses
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Log Expense
          </Button>
        </Link>
      </div>

      {/* Expenses List */}
      <ExpensesList />
    </div>
  )
}
