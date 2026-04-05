'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, MoreVertical, FileText } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { toast } from 'sonner';

interface Quote {
  id: string;
  quoteNumber: string;
  referenceNo?: string;
  quoteDate: string;
  expiryDate?: string;
  subject?: string;
  status: string;
  total: number;
  convertedToInvoice: boolean;
  customer: { id: string; displayName: string; email: string; phone?: string };
  items: any[];
}

const STATUS_STYLES: Record<string, string> = {
  Draft:    'bg-gray-100 text-gray-600',
  Sent:     'bg-blue-100 text-blue-700',
  Accepted: 'bg-green-100 text-green-700',
  Declined: 'bg-red-100 text-red-500',
  Expired:  'bg-orange-100 text-orange-600',
  Invoiced: 'bg-purple-100 text-purple-700',
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, page: String(page) });
      const res  = await fetch(`/api/quotes?${params}`);
      const data = await res.json();
      setQuotes(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch { setQuotes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuotes(); }, [search, statusFilter, page]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Quote marked as ${status}`); fetchQuotes(); }
      else toast.error('Failed to update');
    } catch { toast.error('Something went wrong'); }
    setActionMenu(null);
  };

  const deleteQuote = async (id: string) => {
    if (!confirm('Delete this quote?')) return;
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Quote deleted'); fetchQuotes(); }
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
            <FileText className="w-5 h-5 text-brand" /> Quotes & Estimates
          </h1>
          <p className="text-gray-400 mt-0.5 text-sm">Create and manage customer proposals.</p>
        </div>
        <Link href="/quotes/new">
          <Button className="bg-brand hover:brightness-90 gap-2"><Plus className="w-4 h-4" />New Quote</Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Draft',    color: 'bg-gray-100 text-gray-700',   filter: 'Draft' },
          { label: 'Sent',     color: 'bg-blue-100 text-blue-700',   filter: 'Sent' },
          { label: 'Accepted', color: 'bg-green-100 text-green-700', filter: 'Accepted' },
          { label: 'Declined', color: 'bg-red-100 text-red-600',     filter: 'Declined' },
        ].map(({ label, color, filter }) => (
          <button key={label} onClick={() => setStatusFilter(statusFilter === filter ? 'all' : filter)}
            className={`${color} rounded-xl px-4 py-3 text-left transition-all hover:ring-2 hover:ring-offset-1 hover:ring-current/20 ${statusFilter === filter ? 'ring-2 ring-current/30' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
            <p className="text-lg font-black mt-0.5">—</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by number, subject, customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-white border-gray-200" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
          <option value="all">All Statuses</option>
          <option>Draft</option><option>Sent</option><option>Accepted</option><option>Declined</option><option>Expired</option><option>Invoiced</option>
        </select>
        <button onClick={fetchQuotes} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <FileText className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-gray-400 text-sm">No quotes found</p>
            <Link href="/quotes/new"><Button className="bg-brand hover:brightness-90 gap-2"><Plus className="w-4 h-4" />New Quote</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Quote #', 'Customer', 'Subject', 'Date', 'Expiry', 'Total', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotes.map(q => {
                  const isExpired = q.expiryDate && isPast(new Date(q.expiryDate)) && !['Accepted', 'Invoiced'].includes(q.status);
                  return (
                    <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/quotes/${q.id}`} className="font-mono font-bold text-brand hover:underline">{q.quoteNumber}</Link>
                        {q.referenceNo && <p className="text-xs text-gray-400">Ref: {q.referenceNo}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{q.customer?.displayName}</p>
                        <p className="text-xs text-gray-400">{q.customer?.phone || q.customer?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm max-w-[150px] truncate">{q.subject || '—'}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{format(new Date(q.quoteDate), 'dd MMM yyyy')}</td>
                      <td className="py-3 px-4">
                        {q.expiryDate ? (
                          <span className={`text-sm ${isExpired ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                            {format(new Date(q.expiryDate), 'dd MMM yyyy')}
                          </span>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">₹{q.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[isExpired ? 'Expired' : q.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {isExpired ? 'Expired' : q.status}
                        </span>
                        {q.convertedToInvoice && <span className="ml-1 text-[10px] text-purple-600 font-bold">✓ INV</span>}
                      </td>
                      <td className="py-3 px-4 relative">
                        <button onClick={() => setActionMenu(actionMenu === q.id ? null : q.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><MoreVertical className="w-4 h-4" /></button>
                        {actionMenu === q.id && (
                          <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-xl w-48 py-1 text-sm">
                            <Link href={`/quotes/${q.id}`} className="block px-4 py-2 hover:bg-gray-50 text-gray-700">View / Print</Link>
                            {q.status === 'Draft' && <button onClick={() => updateStatus(q.id, 'Sent')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-blue-600">Mark as Sent</button>}
                            {q.status === 'Sent' && <button onClick={() => updateStatus(q.id, 'Accepted')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600">Mark as Accepted</button>}
                            {q.status === 'Sent' && <button onClick={() => updateStatus(q.id, 'Declined')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500">Mark as Declined</button>}
                            <button onClick={() => deleteQuote(q.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Showing {quotes.length} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={quotes.length < 20} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
