'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, MoreVertical, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Challan {
  id: string;
  challanNumber: string;
  referenceNo?: string;
  challanDate: string;
  challanType: string;
  status: string;
  total: number;
  convertedToInvoice: boolean;
  createdAt: string;
  customer: { id: string; displayName: string; email: string; phone?: string };
  items: any[];
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Open: 'bg-blue-100 text-blue-700',
  Closed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-500',
};

export default function DeliveryChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, page: String(page) });
      const res = await fetch(`/api/challans?${params}`);
      const data = await res.json();
      setChallans(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch { setChallans([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChallans(); }, [search, statusFilter, page]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/challans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Challan marked as ${status}`); fetchChallans(); }
      else toast.error('Failed to update');
    } catch { toast.error('Something went wrong'); }
    setActionMenu(null);
  };

  const deleteChallan = async (id: string) => {
    if (!confirm('Delete this challan?')) return;
    try {
      const res = await fetch(`/api/challans/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Challan deleted'); fetchChallans(); }
      else toast.error('Failed to delete');
    } catch { toast.error('Something went wrong'); }
    setActionMenu(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand" /> Delivery Challans
          </h1>
          <p className="text-gray-400 mt-0.5 text-sm">Track and manage delivery documentation.</p>
        </div>
        <Link href="/delivery-challans/new">
          <Button className="bg-brand hover:brightness-90 gap-2">
            <Plus className="w-4 h-4" /> New Challan
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by number, reference, customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-white border-gray-200" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
          <option value="all">All Statuses</option>
          <option>Draft</option>
          <option>Open</option>
          <option>Closed</option>
          <option>Cancelled</option>
        </select>
        <button onClick={fetchChallans} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : challans.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Truck className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-gray-400 text-sm">No delivery challans found</p>
            <Link href="/delivery-challans/new">
              <Button className="bg-brand hover:brightness-90 gap-2"><Plus className="w-4 h-4" />New Challan</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Challan #', 'Customer', 'Date', 'Type', 'Total', 'Status', 'Invoice', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {challans.map(ch => (
                  <tr key={ch.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/delivery-challans/${ch.id}`} className="font-mono font-bold text-brand hover:underline">
                        {ch.challanNumber}
                      </Link>
                      {ch.referenceNo && <p className="text-xs text-gray-400">Ref: {ch.referenceNo}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800">{ch.customer?.displayName}</p>
                      <p className="text-xs text-gray-400">{ch.customer?.phone || ch.customer?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{format(new Date(ch.challanDate), 'dd MMM yyyy')}</td>
                    <td className="py-3 px-4 text-gray-600 text-xs max-w-[120px] truncate">{ch.challanType}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-gray-800">₹{ch.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[ch.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {ch.convertedToInvoice
                        ? <span className="text-xs text-green-600 font-bold">✓ Invoiced</span>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="py-3 px-4 relative">
                      <button onClick={() => setActionMenu(actionMenu === ch.id ? null : ch.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {actionMenu === ch.id && (
                        <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-xl w-44 py-1 text-sm">
                          <Link href={`/delivery-challans/${ch.id}`} className="block px-4 py-2 hover:bg-gray-50 text-gray-700">View Details</Link>
                          {ch.status === 'Draft' && <button onClick={() => updateStatus(ch.id, 'Open')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-blue-600">Mark as Open</button>}
                          {ch.status === 'Open' && <button onClick={() => updateStatus(ch.id, 'Closed')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600">Mark as Closed</button>}
                          {ch.status !== 'Cancelled' && <button onClick={() => updateStatus(ch.id, 'Cancelled')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500">Cancel</button>}
                          <button onClick={() => deleteChallan(ch.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {challans.length} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={challans.length < 20}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
