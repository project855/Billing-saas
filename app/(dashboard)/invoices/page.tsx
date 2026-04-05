'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Plus, Search, MoreHorizontal, Eye, Edit, Trash2,
  FileText, Send, CheckCircle, Download, RefreshCw, ChevronLeft, ChevronRight,
  Clock, AlertCircle, XCircle, CheckSquare, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import RecordPaymentModal from '@/components/invoices/RecordPaymentModal';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  Draft:     { label: 'Draft',     className: 'bg-gray-100 text-gray-600 border border-gray-200',         icon: <FileText className="w-3 h-3" /> },
  Sent:      { label: 'Sent',      className: 'bg-blue-50 text-blue-600 border border-blue-100',           icon: <Send className="w-3 h-3" /> },
  Paid:      { label: 'Paid',      className: 'bg-emerald-50 text-emerald-600 border border-emerald-100', icon: <CheckCircle className="w-3 h-3" /> },
  Overdue:   { label: 'Overdue',   className: 'bg-red-50 text-brand border border-red-100',           icon: <AlertCircle className="w-3 h-3" /> },
  Cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-400 border border-gray-200',         icon: <XCircle className="w-3 h-3" /> },
};

const TABS = ['all', 'Draft', 'Sent', 'Paid', 'Overdue'];
const formatINR = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; invoice: any }>({ open: false, invoice: null });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page) });
      if (statusTab !== 'all') params.set('status', statusTab);
      const res = await fetch(`/api/invoices?${params}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setInvoices(json.data);
        setMeta({ total: json.total ?? 0, page: json.page ?? 1, totalPages: json.totalPages ?? 1 });
      } else {
        setInvoices([]);
      }
    } catch (err) {
      toast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusTab, page]);

  useEffect(() => {
    const t = setTimeout(fetchInvoices, 350);
    return () => clearTimeout(t);
  }, [fetchInvoices]);

  const handleSend = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}/send`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success('Invoice marked as sent!');
      fetchInvoices();
    } catch { toast.error('Failed to send invoice'); }
  };

  const handleDelete = async (inv: any) => {
    const msg = inv.status === 'Draft' ? 'Delete this draft invoice?' : 'Cancel this invoice? This cannot be undone.';
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success(json.message);
      fetchInvoices();
    } catch { toast.error('Failed to delete'); }
  };

  const isOverdue = (inv: any) =>
    ['Sent', 'Draft'].includes(inv.status) && new Date(inv.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {meta.total} total invoice{meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-gray-200 text-gray-600 gap-2 h-9 text-sm"
            onClick={fetchInvoices}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Link href="/invoices/new">
            <Button className="bg-brand hover:brightness-90 text-white font-semibold gap-2 shadow-sm border-none rounded-lg px-5 h-9 text-sm">
              <Plus className="w-4 h-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Tabs + Search */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-5 flex flex-col lg:flex-row justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setStatusTab(tab); setPage(1); }}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all capitalize ${
                statusTab === tab ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'all' ? 'All' : STATUS_CONFIG[tab]?.label ?? tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search invoice # or customer..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus-visible:ring-brand/20 focus-visible:border-brand/30 h-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                <th className="py-4 px-6">Invoice #</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Issue Date</th>
                <th className="py-4 px-6">Due Date</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 text-right">Balance</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 w-14"></th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <FileText className="h-10 w-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No invoices found</p>
                      <p className="text-gray-400 text-xs">Create your first invoice to get started.</p>
                      <Link href="/invoices/new">
                        <Button className="mt-2 bg-brand hover:brightness-90 text-white gap-2 text-sm border-none shadow-sm">
                          <Plus className="w-4 h-4" /> Create Invoice
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map(inv => {
                  const overdue = isOverdue(inv);
                  const statusKey = overdue ? 'Overdue' : inv.status;
                  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.Draft;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono font-semibold text-gray-900">{inv.invoiceNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{inv.customer?.displayName}</span>
                          <span className="text-[11px] text-gray-400">{inv.customer?.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-500">{format(new Date(inv.issueDate), 'dd MMM yyyy')}</td>
                      <td className="py-4 px-6">
                        <span className={overdue ? 'text-brand font-medium' : 'text-gray-500'}>
                          {format(new Date(inv.dueDate), 'dd MMM yyyy')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-900">{formatINR(inv.amount)}</td>
                      <td className="py-4 px-6 text-right">
                        {inv.balance > 0.01 ? (
                          <span className="font-semibold text-brand">{formatINR(inv.balance)}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Settled</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.className}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-gray-100 shadow-xl min-w-[180px]">
                            <DropdownMenuItem asChild className="hover:bg-gray-50 cursor-pointer text-gray-700 gap-2.5 py-2">
                              <Link href={`/invoices/${inv.id}`}>
                                <Eye className="w-4 h-4 text-blue-500" /> View
                              </Link>
                            </DropdownMenuItem>
                            {['Draft', 'Sent'].includes(inv.status) && (
                              <DropdownMenuItem asChild className="hover:bg-gray-50 cursor-pointer text-gray-700 gap-2.5 py-2">
                                <Link href={`/invoices/${inv.id}/edit`}>
                                  <Edit className="w-4 h-4 text-amber-500" /> Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {inv.status === 'Draft' && (
                              <DropdownMenuItem
                                className="hover:bg-blue-50 cursor-pointer text-blue-600 gap-2.5 py-2 font-medium"
                                onClick={() => handleSend(inv.id)}
                              >
                                <Send className="w-4 h-4" /> Mark as Sent
                              </DropdownMenuItem>
                            )}
                            {['Sent', 'Overdue', 'Draft'].includes(inv.status) && inv.balance > 0.01 && (
                              <DropdownMenuItem
                                className="hover:bg-emerald-50 cursor-pointer text-emerald-700 gap-2.5 py-2 font-medium"
                                onClick={() => setPaymentModal({ open: true, invoice: inv })}
                              >
                                <DollarSign className="w-4 h-4" /> Record Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-gray-50" />
                            <DropdownMenuItem
                              className="text-red-500 hover:bg-red-50 cursor-pointer gap-2.5 py-2 font-medium"
                              onClick={() => handleDelete(inv)}
                            >
                              <Trash2 className="w-4 h-4" />
                              {inv.status === 'Draft' ? 'Delete' : 'Cancel'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/30">
          <span>
            Showing <span className="text-gray-900 font-bold">{invoices.length}</span> of{' '}
            <span className="text-gray-900 font-bold">{meta.total}</span> invoices
          </span>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <span className="px-2 text-gray-600 font-medium">{page} / {meta.totalPages}</span>
            <Button
              variant="outline" size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModal.open && paymentModal.invoice && (
        <RecordPaymentModal
          invoice={paymentModal.invoice}
          onClose={() => setPaymentModal({ open: false, invoice: null })}
          onSuccess={() => { fetchInvoices(); setPaymentModal({ open: false, invoice: null }); }}
        />
      )}
    </div>
  );
}
