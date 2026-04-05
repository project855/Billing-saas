'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, MoreVertical, FileX } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  originalInvoiceRef?: string;
  creditNoteDate: string;
  reason?: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { id: string; displayName: string; email: string; phone?: string };
  items: any[];
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Open: 'bg-blue-100 text-blue-700',
  Closed: 'bg-green-100 text-green-700',
  Void: 'bg-red-100 text-red-500',
};

export default function CreditNotesPage() {
  const [notes, setNotes] = useState<CreditNote[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, status: statusFilter, page: String(page) });
      const res  = await fetch(`/api/credit-notes?${params}`);
      const data = await res.json();
      setNotes(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch { setNotes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, [search, statusFilter, page]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/credit-notes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { toast.success(`Credit note ${status.toLowerCase()}`); fetchNotes(); }
      else toast.error('Failed to update status');
    } catch { toast.error('Something went wrong'); }
    setActionMenu(null);
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this credit note? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/credit-notes/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Credit note deleted'); fetchNotes(); }
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
            <FileX className="w-5 h-5 text-brand" /> Credit Notes
          </h1>
          <p className="text-gray-400 mt-0.5 text-sm">Manage credit memos issued to customers.</p>
        </div>
        <Link href="/credit-notes/new">
          <Button className="bg-brand hover:brightness-90 gap-2">
            <Plus className="w-4 h-4" /> New Credit Note
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by number, invoice ref, customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9 bg-white border-gray-200" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none">
          <option value="all">All Statuses</option>
          <option>Draft</option><option>Open</option><option>Closed</option><option>Void</option>
        </select>
        <button onClick={fetchNotes} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <FileX className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-gray-400 text-sm">No credit notes found</p>
            <Link href="/credit-notes/new">
              <Button className="bg-brand hover:brightness-90 gap-2"><Plus className="w-4 h-4" />New Credit Note</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Credit Note #', 'Customer', 'Date', 'Reason', 'Invoice Ref', 'Total Credit', 'Status', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {notes.map(note => (
                  <tr key={note.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/credit-notes/${note.id}`} className="font-mono font-bold text-brand hover:underline">{note.creditNoteNumber}</Link>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-800">{note.customer?.displayName}</p>
                      <p className="text-xs text-gray-400">{note.customer?.phone || note.customer?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{format(new Date(note.creditNoteDate), 'dd MMM yyyy')}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs max-w-[120px] truncate">{note.reason || '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{note.originalInvoiceRef || '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-brand">₹{note.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[note.status] ?? 'bg-gray-100 text-gray-600'}`}>{note.status}</span>
                    </td>
                    <td className="py-3 px-4 relative">
                      <button onClick={() => setActionMenu(actionMenu === note.id ? null : note.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><MoreVertical className="w-4 h-4" /></button>
                      {actionMenu === note.id && (
                        <div className="absolute right-4 top-10 z-20 bg-white border border-gray-200 rounded-xl shadow-xl w-44 py-1 text-sm">
                          <Link href={`/credit-notes/${note.id}`} className="block px-4 py-2 hover:bg-gray-50 text-gray-700">View Details</Link>
                          {note.status === 'Draft' && <button onClick={() => updateStatus(note.id, 'Open')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-blue-600">Mark as Open</button>}
                          {note.status === 'Open' && <button onClick={() => updateStatus(note.id, 'Closed')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-green-600">Mark as Closed</button>}
                          {note.status !== 'Void' && <button onClick={() => updateStatus(note.id, 'Void')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-500">Void</button>}
                          <button onClick={() => deleteNote(note.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500">Delete</button>
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
          <span>Showing {notes.length} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => p + 1)} disabled={notes.length < 20} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
