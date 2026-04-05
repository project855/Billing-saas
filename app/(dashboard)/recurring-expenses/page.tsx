'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function RecurringExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Recurring Expenses</h1>
          <p className="text-gray-400 mt-1">Set up automated recurring charges.</p>
        </div>
        <Button className="bg-brand hover:brightness-90 gap-2">
          <Plus className="w-4 h-4" />
          Create Recurring Expense
        </Button>
      </div>

      <Card className="bg-white border-gray-100">
        <CardHeader>
          <CardTitle>All Recurring Expenses</CardTitle>
          <CardDescription>0 total recurring expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No recurring expenses yet</p>
            <Button className="bg-brand hover:brightness-90 gap-2">
              <Plus className="w-4 h-4" />
              Create Recurring Expense
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
