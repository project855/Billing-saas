'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, MoreVertical, CheckCircle2, XCircle, PauseCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  subNumber: string;
  profileName: string;
  status: string;
  billInterval: number;
  billUnit: string;
  startDate: string;
  neverExpires: boolean;
  paymentTerms: string;
  createdAt: string;
  customer: { id: string; displayName: string; email: string; phone?: string };
  items: any[];
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Paused: 'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-600',
  Expired: 'bg-gray-100 text-gray-500',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  Active: <CheckCircle2 className="w-3.5 h-3.5" />,
  Paused: <PauseCircle className="w-3.5 h-3.5" />,
  Cancelled: <XCircle className="w-3.5 h-3.5" />,
  Expired: <Clock className="w-3.5 h-3.5" />,
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, page: String(page) });
      const res = await fetch(`/api/subscriptions?${params}`);
      const data = await res.json();
      setSubscriptions(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubs(); }, [search, statusFilter, page]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Subscription ${status.toLowerCase()}`); fetchSubs(); }
      else toast.error('Failed to update status');
    } catch { toast.error('Something went wrong'); }
    setActionMenu(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-400 mt-0.5 text-sm">Manage customer subscriptions and billing cycles.</p>
        </div>
        <Link href="/subscriptions/new">
          <Button className="bg-brand hover:brightness-90 gap-2">
            <Plus className="w-4 h-4" /> New Subscription
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by number, profile, customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-white border-gray-200" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
          <option value="all">All Statuses</option>
          <option>Active</option>
          <option>Paused</option>
          <option>Cancelled</option>
          <option>Expired</option>
        </select>
        <button onClick={fetchSubs} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-gray-400">No subscriptions found</p>
            <Link href="/subscriptions/new">
              <Button className="bg-brand hover:brightness-90 gap-2"><Plus className="w-4 h-4" />New Subscription</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Subscription #', 'Customer', 'Profile', 'Billing', 'Start Date', 'Status', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/subscriptions/${sub.id}`} className="font-mono font-bold text-blue-600 hover:underline">
                      {sub.subNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-gray-800">{sub.customer?.displayName}</p>
                    <p className="text-xs text-gray-400">{sub.customer?.phone || sub.customer?.email}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{sub.profileName}</td>
                  <td className="py-3 px-4 text-gray-600">Every {sub.billInterval} {sub.billUnit}</td>
                  <td className="py-3 px-4 text-gray-600">{format(new Date(sub.startDate), 'dd MMM yyyy')}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[sub.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_ICON[sub.status]}{sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 relative">
                    <button onClick={() => setActionMenu(actionMenu === sub.id ? null : sub.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {actionMenu === sub.id && (
                      <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-xl w-44 py-1 text-sm">
                        <Link href={`/subscriptions/${sub.id}`} className="block px-4 py-2 hover:bg-gray-50 text-gray-700">View Details</Link>
                        {sub.status === 'Active' && <button onClick={() => updateStatus(sub.id, 'Paused')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-yellow-600">Pause</button>}
                        {sub.status === 'Paused' && <button onClick={() => updateStatus(sub.id, 'Active')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600">Resume</button>}
                        {sub.status !== 'Cancelled' && <button onClick={() => updateStatus(sub.id, 'Cancelled')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500">Cancel</button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {subscriptions.length} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={subscriptions.length < 20}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
