'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function TimesheetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Timesheet</h1>
          <p className="text-gray-400 mt-1">Log and track time entries for projects.</p>
        </div>
        <Button className="bg-brand hover:brightness-90 gap-2">
          <Plus className="w-4 h-4" />
          Log Time
        </Button>
      </div>

      <Card className="bg-white border-gray-100">
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>0 total hours logged</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No time entries yet</p>
            <Button className="bg-brand hover:brightness-90 gap-2">
              <Plus className="w-4 h-4" />
              Log Time
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
