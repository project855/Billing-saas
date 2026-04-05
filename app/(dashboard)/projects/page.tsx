'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-400 mt-1">Manage your time tracking projects.</p>
        </div>
        <Button className="bg-brand hover:brightness-90 gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <Card className="bg-white border-gray-100">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search projects..."
                className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
              />
            </div>
            <Button variant="outline" className="border-gray-200 gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-100">
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>0 total projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No projects yet</p>
            <Button className="bg-brand hover:brightness-90 gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
