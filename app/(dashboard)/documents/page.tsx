'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-400 mt-1">Upload and manage business documents.</p>
        </div>
        <Button className="bg-brand hover:brightness-90 gap-2">
          <Plus className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      <Card className="bg-white border-gray-100">
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>0 total documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No documents uploaded yet</p>
            <Button className="bg-brand hover:brightness-90 gap-2">
              <Plus className="w-4 h-4" />
              Upload Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
