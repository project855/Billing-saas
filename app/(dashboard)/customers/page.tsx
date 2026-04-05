'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import Link from 'next/link';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive, overdue
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${search}&status=${statusFilter}`);
      const data = await res.json();
      
      // Handle non-array response (e.g., error object)
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        console.error('API Error:', data);
        setCustomers([]);
        if (data.error) {
          toast.error(data.error);
        }
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      toast.error('Failed to connect to server');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers();
    }, 400); // debounce
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this customer?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Customer deactivated successfully');
        fetchCustomers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to update customer');
      }
    } catch (err) {
      toast.error('Connection error');
    }
  };

  const openEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'overdue': return 'bg-red-50 text-red-600 border border-red-100';
      case 'inactive': return 'bg-gray-100 text-gray-500 border border-gray-200';
      default: return 'bg-gray-100 text-gray-500 border border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your clients and billing contacts in one place.</p>
        </div>
        <Button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="bg-brand hover:brightness-90 text-white font-semibold rounded-lg shadow-sm border-none px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats/Filters Row */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name, email, or company..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 text-sm text-gray-800 rounded-lg focus-visible:ring-brand/20 focus-visible:border-brand/30 h-10"
            />
          </div>
          
          <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-lg border border-gray-100 self-stretch sm:self-auto">
            {['all', 'active', 'overdue', 'inactive'].map(filter => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 rounded-md capitalize text-[13px] font-medium transition-all ${
                  statusFilter === filter 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                <th className="py-4 px-6">Customer Name</th>
                <th className="py-4 px-6">Email & Contact</th>
                <th className="py-4 px-6">GST / Tax ID</th>
                <th className="py-4 px-6">Total Billed</th>
                <th className="py-4 px-6">Outstanding</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 w-[60px]"></th>
              </tr>
            </thead>
            
            <tbody className="text-[13px] divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gray-100 rounded-full shrink-0"></div>
                        <div className="h-4 w-32 bg-gray-100 rounded"></div>
                      </div>
                    </td>
                    <td className="py-5 px-6"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                    <td className="py-5 px-6"><div className="h-4 w-28 bg-gray-100 rounded"></div></td>
                    <td className="py-5 px-6"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="py-5 px-6"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                    <td className="py-5 px-6"><div className="h-6 w-20 bg-gray-100 rounded-full mx-auto"></div></td>
                    <td className="py-5 px-6"><div className="h-8 w-8 bg-gray-100 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <User className="h-10 w-10 text-gray-300" />
                      </div>
                      <div className="text-gray-500 font-medium">No customers found</div>
                      <p className="text-gray-400 text-xs max-w-xs mx-auto text-balance">
                        Try adjusting your search filters or click &apos;Add Customer&apos; to create your first contact.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/70 transition-colors group cursor-pointer">
                    <td className="py-4 px-6" onClick={() => window.location.href = `/customers/${customer.id}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#EF3A2A]/20 to-[#EF3A2A]/5 flex items-center justify-center text-brand font-bold text-xs ring-1 ring-brand/10">
                          {customer.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                            {customer.displayName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-gray-600">{customer.email}</span>
                        {customer.phone && <span className="text-[11px] text-gray-400 font-mono">{customer.phone}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-500 text-xs">{customer.gstNumber || '—'}</td>
                    <td className="py-4 px-6 font-semibold text-gray-800">{formatINR(customer.totalBilled)}</td>
                    <td className={`py-4 px-6 font-bold ${customer.outstanding > 0 ? 'text-brand' : 'text-emerald-600'}`}>
                      {formatINR(customer.outstanding)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-gray-100 shadow-xl min-w-[160px]">
                          <DropdownMenuItem asChild className="hover:bg-gray-50 cursor-pointer text-gray-700 py-2">
                            <Link href={`/customers/${customer.id}`}>
                              <Eye className="w-4 h-4 mr-2.5 text-blue-500" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer text-gray-700 py-2" onClick={() => openEdit(customer)}>
                            <Edit className="w-4 h-4 mr-2.5 text-amber-500" /> Edit Invoice
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-50 my-1" />
                          {customer.baseStatus !== 'inactive' && (
                            <DropdownMenuItem className="text-red-500 hover:bg-red-50 cursor-pointer py-2 font-medium" onClick={() => handleDelete(customer.id)}>
                              <Trash2 className="w-4 h-4 mr-2.5" /> Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/30">
          <div className="flex items-center gap-2">
            <span>Showing <span className="text-gray-900 font-bold">{customers.length}</span> entries</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="h-8 text-[11px] border-gray-200 bg-white text-gray-500 px-4">Prev</Button>
            <Button variant="outline" size="sm" disabled className="h-8 text-[11px] border-gray-200 bg-white text-gray-500 px-4">Next</Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddCustomerModal 
          open={isModalOpen} 
          onOpenChange={setIsModalOpen} 
          onSuccess={fetchCustomers}
          initialData={editingCustomer}
        />
      )}

    </div>
  );
}
