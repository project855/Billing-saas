'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalInvoiced?: number;
  totalPaid?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-400 mt-2">Manage your customers and their information.</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-white border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </Card>

      {/* Customers List */}
      {isLoading ? (
        <Card className="bg-white border-gray-100 p-8">
          <p className="text-gray-400 text-center">Loading customers...</p>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="bg-white border-gray-100 p-8">
          <p className="text-gray-400 text-center">No customers found</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="bg-white border-gray-100 p-6 flex items-center justify-between hover:border-gray-200 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{customer.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{customer.email}</p>
                {customer.phone && (
                  <p className="text-gray-500 text-sm">{customer.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/customers/${customer.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
