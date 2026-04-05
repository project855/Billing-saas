'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Plus, Search, RefreshCw, MoreHorizontal, Eye, Trash2,
  DollarSign, CreditCard, Building2, Banknote, Smartphone,
  CheckSquare, ChevronLeft, ChevronRight, TrendingUp, ArrowUpCircle,
  AlertCircle, Clock
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import RecordPaymentStandaloneModal from '@/components/payments/RecordPaymentStandaloneModal';

const METHOD_ICONS: Record<string, React.ReactNode> = {
  UPI:    <Smartphone className="w-3.5 h-3.5" />,
  Bank:   <Building2  className="w-3.5 h-3.5" />,
  Card:   <CreditCard className="w-3.5 h-3.5" />,
  Cash:   <Banknote   className="w-3.5 h-3.5" />,
  Cheque: <CheckSquare className="w-3.5 h-3.5" />,
  Other:  <DollarSign  className="w-3.5 h-3.5" />,
};
const METHOD_COLORS: Record<string, string> = {
  UPI:    'bg-violet-50 text-violet-600 border-violet-100',
  Bank:   'bg-blue-50 text-blue-600 border-blue-100',
  Card:   'bg-indigo-50 text-indigo-600 border-indigo-100',
  Cash:   'bg-emerald-50 text-emerald-600 border-emerald-100',
  Cheque: 'bg-amber-50 text-amber-600 border-amber-100',
  Other:  'bg-gray-50 text-gray-500 border-gray-100',
};
const STATUS_COLORS: Record<string, string> = {
  Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Pending:   'bg-amber-50 text-amber-600 border-amber-100',
  Refunded:  'bg-red-50 text-brand border-red-100',
  Failed:    'bg-gray-100 text-gray-500 border-gray-200',
};
const INV_STATUS_COLORS: Record<string, string> = {
  Draft:            'bg-gray-100 text-gray-600',
  Sent:             'bg-blue-100 text-blue-700',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Overdue:          'bg-red-100 text-red-600',
};

const METHODS = ['all', 'UPI', 'Bank', 'Card', 'Cash', 'Cheque', 'Other'];
const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'payments' | 'unpaid'>('payments');

  // Payments tab
  const [payments, setPayments]   = useState<any[]>([]);
  const [meta, setMeta]           = useState({ total: 0, page: 1, totalPages: 1 });
  const [stats, setStats]         = useState({ total: 0, thisMonth: 0, count: 0 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [methodFilter, setMethod] = useState('all');
  const [page, setPage]           = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Unpaid tab
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [unpaidLoading, setUnpaidLoading]   = useState(false);
  const [unpaidSearch, setUnpaidSearch]     = useState('');
  const [unpaidTotal, setUnpaidTotal]       = useState(0);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page) });
      if (methodFilter !== 'all') params.set('method', methodFilter);
      const res  = await fetch(`/api/payments?${params}`);
      const json = await res.json();
      if (Array.isArray(json.data)) {
        setPayments(json.data);
        setMeta({ total: json.total ?? 0, page: json.page ?? 1, totalPages: json.totalPages ?? 1 });
        const all = json.data as any[];
        const completed  = all.filter((p: any) => p.status === 'Completed');
        const now        = new Date();
        const thisMonth  = completed.filter((p: any) => {
          const d = new Date(p.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setStats({
          total:     completed.reduce((s: number, p: any) => s + p.amount, 0),
          thisMonth: thisMonth.reduce((s: number, p: any) => s + p.amount, 0),
          count:     completed.length,
        });
      } else { setPayments([]); }
    } catch { toast.error('Failed to load payments'); setPayments([]); }
    finally { setLoading(false); }
  }, [search, methodFilter, page]);

  const fetchUnpaid = useCallback(async () => {
    setUnpaidLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (unpaidSearch) params.set('search', unpaidSearch);
      const res  = await fetch(`/api/invoices?${params}`);
      const json = await res.json();
      const all: any[] = Array.isArray(json.data) ? json.data : [];
      const unpaid = all.filter(inv => ['Draft', 'Sent', 'Partially Paid', 'Overdue'].includes(inv.status));
      setUnpaidInvoices(unpaid);
      setUnpaidTotal(unpaid.reduce((s, inv) => s + (inv.amount ?? 0), 0));
    } catch { setUnpaidInvoices([]); }
    finally { setUnpaidLoading(false); }
  }, [unpaidSearch]);

  useEffect(() => {
    const t = setTimeout(fetchPayments, 350);
    return () => clearTimeout(t);
  }, [fetchPayments]);

  useEffect(() => {
    if (activeTab === 'unpaid') fetchUnpaid();
  }, [activeTab, fetchUnpaid]);

  const handleVoid = async (p: any) => {
    if (!confirm(`Void this payment of ${formatINR(p.amount)}?`)) return;
    try {
      const res  = await fetch(`/api/payments/${p.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success(json.message);
      fetchPayments();
    } catch { toast.error('Failed to void payment'); }
  };

  const openPaymentModal = (invoice?: any) => {
    setSelectedInvoice(invoice ?? null);
    setShowModal(true);
  };

  const totalByMethod = METHODS.slice(1).reduce((acc, m) => {
    acc[m] = payments.filter(p => p.method === m && p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total} payment{meta.total !== 1 ? 's' : ''} recorded</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPayments} className="border-gray-200 text-gray-600 gap-2 h-9 text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button onClick={() => openPaymentModal()} className="bg-brand hover:brightness-90 text-white font-semibold gap-2 shadow-sm border-none rounded-lg px-5 h-9 text-sm">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Collected',    value: formatINR(stats.total),    icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,  bg: 'bg-emerald-50',   color: 'text-emerald-600' },
          { label: 'This Month',         value: formatINR(stats.thisMonth), icon: <ArrowUpCircle className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50',      color: 'text-blue-600' },
          { label: 'Total Transactions', value: String(meta.total),         icon: <DollarSign className="w-5 h-5 text-brand" />,  bg: 'bg-brand/8', color: 'text-brand' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>{c.icon}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{c.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5 border border-gray-200">
        <button onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'payments' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          <DollarSign className="w-4 h-4" /> Recorded Payments
        </button>
        <button onClick={() => { setActiveTab('unpaid'); fetchUnpaid(); }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'unpaid' ? 'bg-white shadow text-brand' : 'text-gray-500 hover:text-gray-700'}`}>
          <AlertCircle className="w-4 h-4" /> Unpaid Invoices
          {unpaidInvoices.length > 0 && (
            <span className="bg-brand text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unpaidInvoices.length}</span>
          )}
        </button>
      </div>

      {/* ── PAYMENTS TAB ── */}
      {activeTab === 'payments' && (
        <>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-5 flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg border border-gray-100 overflow-x-auto flex-wrap">
              {METHODS.map(m => (
                <button key={m} onClick={() => { setMethod(m); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all capitalize ${methodFilter === m ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
                  {m !== 'all' && METHOD_ICONS[m]}
                  {m === 'all' ? 'All Methods' : m}
                  {m !== 'all' && totalByMethod[m] > 0 && <span className="text-[10px] text-gray-400">({formatINR(totalByMethod[m])})</span>}
                </button>
              ))}
            </div>
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search invoice # or customer..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-gray-50 border-gray-200 h-10" />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50/50 text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                    <th className="py-4 px-6">Invoice #</th><th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Date</th><th className="py-4 px-6 text-center">Method</th>
                    <th className="py-4 px-6">Ref / Txn ID</th><th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center">Status</th><th className="py-4 px-6 w-14"></th>
                  </tr>
                </thead>
                <tbody className="text-[13px] divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="p-4 bg-gray-50 rounded-full"><DollarSign className="h-10 w-10 text-gray-300" /></div>
                          <p className="text-gray-500 font-medium">No payments recorded yet</p>
                          <p className="text-gray-400 text-xs">Payments made against invoices will appear here.</p>
                          <Button onClick={() => openPaymentModal()} className="mt-2 bg-brand hover:brightness-90 text-white gap-2 text-sm border-none shadow-sm">
                            <Plus className="w-4 h-4" /> Record Payment
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors group">
                        <td className="py-4 px-6">
                          <Link href={`/invoices/${p.invoice?.id}`} className="font-mono font-semibold text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                            {p.invoice?.invoiceNumber ?? '—'}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{p.customer?.displayName ?? '—'}</span>
                            <span className="text-[11px] text-gray-400">{p.customer?.email ?? ''}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-500">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${METHOD_COLORS[p.method] ?? METHOD_COLORS.Other}`}>
                            {METHOD_ICONS[p.method] ?? <DollarSign className="w-3 h-3" />} {p.method}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {p.transactionId ? <span className="font-mono text-[12px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded">{p.transactionId}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-emerald-600 text-base">{formatINR(p.amount)}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_COLORS[p.status] ?? STATUS_COLORS.Pending}`}>{p.status}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border-gray-100 shadow-xl min-w-[160px]">
                              <DropdownMenuItem asChild className="hover:bg-gray-50 cursor-pointer text-gray-700 gap-2.5 py-2">
                                <Link href={`/invoices/${p.invoice?.id}`}><Eye className="w-4 h-4 text-blue-500" /> View Invoice</Link>
                              </DropdownMenuItem>
                              {p.status === 'Completed' && (
                                <>
                                  <DropdownMenuSeparator className="bg-gray-50" />
                                  <DropdownMenuItem className="text-red-500 hover:bg-red-50 cursor-pointer gap-2.5 py-2 font-medium" onClick={() => handleVoid(p)}>
                                    <Trash2 className="w-4 h-4" /> Void Payment
                                  </DropdownMenuItem>
                                </>
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
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/30">
              <span>Showing <span className="text-gray-900 font-bold">{payments.length}</span> of <span className="text-gray-900 font-bold">{meta.total}</span> payments</span>
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <span className="px-2 text-gray-600 font-medium">{page} / {meta.totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── UNPAID INVOICES TAB ── */}
      {activeTab === 'unpaid' && (
        <>
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search invoice # or customer..." value={unpaidSearch} onChange={e => setUnpaidSearch(e.target.value)} className="pl-9 bg-white border-gray-200 h-10" />
            </div>
            <button onClick={fetchUnpaid} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {unpaidInvoices.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">{unpaidInvoices.length} Unpaid Invoice{unpaidInvoices.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-amber-600">Total outstanding: <span className="font-black">{formatINR(unpaidTotal)}</span></p>
                </div>
              </div>
              <Button onClick={() => openPaymentModal()} className="bg-amber-600 hover:bg-amber-700 text-white gap-2 text-sm border-none">
                <Plus className="w-4 h-4" /> Record Payment
              </Button>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            {unpaidLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>
            ) : unpaidInvoices.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <DollarSign className="w-7 h-7 text-green-500" />
                </div>
                <p className="font-semibold text-gray-700">All invoices are paid!</p>
                <p className="text-gray-400 text-sm">No outstanding invoices found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Invoice #', 'Customer', 'Invoice Date', 'Due Date', 'Invoice Total', 'Paid', 'Balance Due', 'Status', ''].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {unpaidInvoices.map(inv => {
                      const paid    = inv.payments?.filter((p: any) => p.status === 'Completed').reduce((s: number, p: any) => s + p.amount, 0) ?? 0;
                      const balance = inv.amount - paid;
                      const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status !== 'Paid';
                      const displayStatus = isOverdue ? 'Overdue' : inv.status;

                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <Link href={`/invoices/${inv.id}`} className="font-mono font-bold text-blue-600 hover:underline">{inv.invoiceNumber}</Link>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-gray-800">{inv.customer?.displayName}</p>
                            <p className="text-xs text-gray-400">{inv.customer?.phone || inv.customer?.email}</p>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">{format(new Date(inv.date || inv.createdAt), 'dd MMM yyyy')}</td>
                          <td className="py-3 px-4">
                            {inv.dueDate
                              ? <span className={`text-sm flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                                  {isOverdue && <Clock className="w-3.5 h-3.5" />}
                                  {format(new Date(inv.dueDate), 'dd MMM yyyy')}
                                </span>
                              : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-gray-800">{formatINR(inv.amount)}</td>
                          <td className="py-3 px-4 font-mono text-emerald-600">{paid > 0 ? formatINR(paid) : '—'}</td>
                          <td className="py-3 px-4 font-mono font-black text-brand text-base">{formatINR(balance)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${INV_STATUS_COLORS[displayStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button size="sm" onClick={() => openPaymentModal(inv)}
                              className="bg-brand hover:brightness-90 text-white gap-1.5 text-xs border-none shadow-sm">
                              <Plus className="w-3.5 h-3.5" /> Pay
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <RecordPaymentStandaloneModal
          onClose={() => { setShowModal(false); setSelectedInvoice(null); }}
          onSuccess={() => { setShowModal(false); setSelectedInvoice(null); fetchPayments(); if (activeTab === 'unpaid') fetchUnpaid(); }}
          preselectedInvoice={selectedInvoice}
        />
      )}
    </div>
  );
}
