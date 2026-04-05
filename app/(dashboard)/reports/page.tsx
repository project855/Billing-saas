'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, BarChart3, RefreshCw, Download, Printer, ChevronRight,
  TrendingUp, TrendingDown, DollarSign, FileText, Users,
  CreditCard, Tag, Repeat, Receipt, Activity, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v);

const isAmount = (col: string) =>
  ['billed', 'paid', 'outstanding', 'balance', 'amount', 'total', 'balance due', 'invoice amt', 'amount received', 'total amount', 'total billed', 'total paid'].includes(col.toLowerCase());

const isNumber = (col: string) =>
  ['invoices', 'qty', 'quantity', 'transactions', 'expenses', 'count', 'days overdue', 'total invoices'].includes(col.toLowerCase());

// ── All Reports Definition ─────────────────────────────────────────────────
const REPORTS = [
  // Sales
  { id: 'sales-by-customer', name: 'Sales by Customer',       type: 'Sales',        chart: 'Bar Chart',   icon: <Users className="w-4 h-4" /> },
  { id: 'sales-by-item',     name: 'Sales by Item',           type: 'Sales',        chart: 'Bar Chart',   icon: <Tag className="w-4 h-4" /> },
  { id: 'sales-summary',     name: 'Sales Summary',           type: 'Sales',        chart: 'Line Chart',  icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'invoice-details',   name: 'Invoice Details',         type: 'Sales',        chart: 'Table',       icon: <FileText className="w-4 h-4" /> },
  { id: 'quote-summary',     name: 'Quote Summary',           type: 'Sales',        chart: 'Table',       icon: <FileText className="w-4 h-4" /> },
  // Receivables
  { id: 'accounts-receivable', name: 'Accounts Receivable',   type: 'Receivables',  chart: 'Table',       icon: <Receipt className="w-4 h-4" /> },
  { id: 'aged-receivables',    name: 'Aged Receivables',      type: 'Receivables',  chart: 'Table',       icon: <Activity className="w-4 h-4" /> },
  { id: 'overdue-invoices',    name: 'Overdue Invoices',      type: 'Receivables',  chart: 'Table',       icon: <TrendingDown className="w-4 h-4" /> },
  { id: 'customer-balance',    name: 'Customer Balance Summary', type: 'Receivables', chart: 'Table',      icon: <Users className="w-4 h-4" /> },
  { id: 'credit-note-summary', name: 'Credit Note Details',   type: 'Receivables',  chart: 'Table',       icon: <FileText className="w-4 h-4" /> },
  // Payments
  { id: 'payment-summary',    name: 'Payment Summary',        type: 'Payments',     chart: 'Line Chart',  icon: <DollarSign className="w-4 h-4" /> },
  { id: 'payment-by-method',  name: 'Payments by Method',     type: 'Payments',     chart: 'Pie Chart',   icon: <CreditCard className="w-4 h-4" /> },
  { id: 'payment-details',    name: 'Payment Details',        type: 'Payments',     chart: 'Table',       icon: <Receipt className="w-4 h-4" /> },
  // Expenses
  { id: 'expense-summary',    name: 'Expense Summary',        type: 'Expenses',     chart: 'Line Chart',  icon: <TrendingDown className="w-4 h-4" /> },
  { id: 'expense-by-category', name: 'Expenses by Category',  type: 'Expenses',     chart: 'Pie Chart',   icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'expense-details',    name: 'Expense Details',        type: 'Expenses',     chart: 'Table',       icon: <Tag className="w-4 h-4" /> },
  // Subscriptions & Activity
  { id: 'subscription-summary', name: 'Subscription Summary', type: 'Subscriptions', chart: 'Table',     icon: <Repeat className="w-4 h-4" /> },
  { id: 'customer-activity',  name: 'Customer Activity',      type: 'Activity',     chart: 'Table',       icon: <Users className="w-4 h-4" /> },
];

const CATEGORIES = [
  { label: 'All Reports',    icon: <BarChart3 className="w-4 h-4" />,      filter: 'all' },
  { label: 'Sales',          icon: <TrendingUp className="w-4 h-4" />,     filter: 'Sales' },
  { label: 'Receivables',    icon: <Receipt className="w-4 h-4" />,        filter: 'Receivables' },
  { label: 'Payments',       icon: <DollarSign className="w-4 h-4" />,     filter: 'Payments' },
  { label: 'Expenses',       icon: <TrendingDown className="w-4 h-4" />,   filter: 'Expenses' },
  { label: 'Subscriptions',  icon: <Repeat className="w-4 h-4" />,         filter: 'Subscriptions' },
  { label: 'Activity',       icon: <Activity className="w-4 h-4" />,       filter: 'Activity' },
];

const TYPE_COLORS: Record<string, string> = {
  Sales:         'bg-blue-50 text-blue-700',
  Receivables:   'bg-violet-50 text-violet-700',
  Payments:      'bg-emerald-50 text-emerald-700',
  Expenses:      'bg-red-50 text-red-600',
  Subscriptions: 'bg-orange-50 text-orange-700',
  Activity:      'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  Paid:           'bg-emerald-100 text-emerald-700',
  Sent:           'bg-blue-100 text-blue-700',
  Draft:          'bg-gray-100 text-gray-500',
  Overdue:        'bg-red-100 text-red-600',
  Cancelled:      'bg-gray-100 text-gray-400',
  Active:         'bg-emerald-100 text-emerald-700',
  Paused:         'bg-amber-100 text-amber-700',
  Cancelled_:     'bg-red-100 text-red-500',
  'Partially Paid': 'bg-amber-100 text-amber-700',
  Accepted:       'bg-emerald-100 text-emerald-700',
  Declined:       'bg-red-100 text-red-600',
  Open:           'bg-blue-100 text-blue-700',
  Void:           'bg-gray-100 text-gray-400',
  Yes:            'bg-purple-100 text-purple-700',
  No:             'bg-gray-100 text-gray-500',
};

export default function ReportsCenterPage() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<typeof REPORTS[0] | null>(null);

  // Report run state
  const [reportData, setReportData] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [lastRan, setLastRan] = useState<Date | null>(null);

  const filteredReports = REPORTS.filter(r => {
    const matchCat = categoryFilter === 'all' || r.type === categoryFilter;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const runReport = useCallback(async () => {
    if (!selectedReport) return;
    setReportLoading(true);
    setReportData(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to)   params.set('to', to);
      const res  = await fetch(`/api/reports/${selectedReport.id}?${params}`);
      const json = await res.json();
      setReportData(json);
      setLastRan(new Date());
    } catch { setReportData(null); }
    finally { setReportLoading(false); }
  }, [selectedReport, from, to]);

  useEffect(() => {
    if (selectedReport) runReport();
  }, [selectedReport]);

  const handlePrint = () => window.print();

  const renderCell = (col: string, val: any) => {
    if (val === null || val === undefined) return <span className="text-gray-300">—</span>;
    if (isAmount(col)) return <span className="font-mono font-semibold">{formatINR(Number(val))}</span>;
    if (isNumber(col)) return <span className="font-mono">{val}</span>;

    const str = String(val);
    // Status badges
    if (STATUS_COLORS[str]) return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[str]}`}>{str}</span>
    );
    return <span>{str}</span>;
  };

  // Compute totals for amount columns
  const amountCols = reportData?.columns.filter(c => isAmount(c)) ?? [];
  const totals     = amountCols.reduce((acc, col) => {
    acc[col] = (reportData?.rows ?? []).reduce((s, row) => s + (Number(row[col.toLowerCase().replace(/ /g, '')] ?? row[col]) || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen bg-gray-50/50 font-sans print:bg-white">

      {/* ── Left Sidebar ───────────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col py-4 print:hidden">
        <div className="px-4 mb-5">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Reports Center</h2>
        </div>
        <nav className="space-y-0.5 px-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => { setCategoryFilter(cat.filter); setSelectedReport(null); setReportData(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                categoryFilter === cat.filter && !selectedReport
                  ? 'bg-brand/10 text-brand font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="shrink-0">{cat.icon}</span>
              {cat.label}
              <span className="ml-auto text-[11px] text-gray-400">
                {cat.filter === 'all' ? REPORTS.length : REPORTS.filter(r => r.type === cat.filter).length}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4 flex-wrap print:hidden sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {selectedReport && (
              <button onClick={() => { setSelectedReport(null); setReportData(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-gray-900 truncate">
                {selectedReport ? selectedReport.name : (categoryFilter === 'all' ? 'All Reports' : categoryFilter)}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedReport
                  ? `${selectedReport.type} · ${lastRan ? `Last run ${format(lastRan, 'hh:mm aa')}` : 'Ready to run'}`
                  : `${filteredReports.length} report${filteredReports.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedReport ? (
              <>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 border-gray-200 bg-gray-50 text-sm w-40" />
                <span className="text-gray-400 text-sm">to</span>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 border-gray-200 bg-gray-50 text-sm w-40" />
                <Button onClick={runReport} disabled={reportLoading}
                  className="bg-brand hover:brightness-90 text-white h-9 gap-2 border-none text-sm">
                  <RefreshCw className={`w-3.5 h-3.5 ${reportLoading ? 'animate-spin' : ''}`} />
                  {reportLoading ? 'Running…' : 'Run Report'}
                </Button>
                <Button onClick={handlePrint} variant="outline" className="h-9 gap-2 border-gray-200 text-gray-600 text-sm">
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
              </>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm w-56" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">

          {/* ── ALL REPORTS LIST VIEW ──────────────────────────────────────── */}
          {!selectedReport && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100 text-[11px] uppercase tracking-widest font-bold text-gray-400">
                    <th className="text-left py-3 px-5">Report Name</th>
                    <th className="text-left py-3 px-5">Report Type</th>
                    <th className="text-left py-3 px-5">Chart Type</th>
                    <th className="text-left py-3 px-5">Last Viewed</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReports.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No reports found</td></tr>
                  ) : filteredReports.map(report => (
                    <tr key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="hover:bg-gray-50/70 cursor-pointer transition-colors group">
                      <td className="py-3.5 px-5">
                        <span className="flex items-center gap-2.5">
                          <span className={`p-1.5 rounded-lg ${TYPE_COLORS[report.type] ?? 'bg-gray-100 text-gray-500'}`}>{report.icon}</span>
                          <span className="font-semibold text-blue-600 group-hover:underline">{report.name}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${TYPE_COLORS[report.type] ?? 'bg-gray-100 text-gray-500'}`}>
                          {report.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-500 text-xs">{report.chart}</td>
                      <td className="py-3.5 px-5 text-gray-400 text-xs">—</td>
                      <td className="py-3.5 px-4 text-gray-300 group-hover:text-brand transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── REPORT DETAIL VIEW ──────────────────────────────────────────── */}
          {selectedReport && (
            <div className="space-y-5">
              {/* Summary strip */}
              {!reportLoading && reportData && reportData.rows.length > 0 && amountCols.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {amountCols.slice(0, 4).map(col => {
                    const key = Object.keys(reportData.rows[0]).find(k => k.toLowerCase().replace(/ /g, '') === col.toLowerCase().replace(/ /g, '')) ?? col;
                    const total = reportData.rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
                    return (
                      <div key={col} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{col}</p>
                        <p className="text-xl font-black text-gray-900">{formatINR(total)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{reportData.rows.length} rows</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Loading */}
              {reportLoading && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-12 bg-gray-50 border-b border-gray-100" />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-12 border-b border-gray-50 px-5 flex items-center gap-8">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="h-3 bg-gray-100 rounded flex-1" />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* No data */}
              {!reportLoading && reportData && reportData.rows.length === 0 && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm text-center py-20">
                  <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-semibold">No data for this report</p>
                  <p className="text-gray-400 text-sm mt-1">Try a different date range or add more data first.</p>
                </div>
              )}

              {/* Report table */}
              {!reportLoading && reportData && reportData.rows.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden print:shadow-none print:border-none">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50 print:hidden">
                    <p className="text-xs font-semibold text-gray-500">{reportData.rows.length} records</p>
                    <button onClick={handlePrint} className="text-xs text-gray-400 hover:text-brand flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Export / Print
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider font-bold text-gray-400">
                          <th className="text-left py-3 px-4 w-8">#</th>
                          {reportData.columns.map(col => (
                            <th key={col} className={`py-3 px-4 ${isAmount(col) || isNumber(col) ? 'text-right' : 'text-left'}`}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {reportData.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                            <td className="py-3 px-4 text-gray-300 text-xs">{idx + 1}</td>
                            {reportData.columns.map(col => {
                              // Try multiple key formats
                              const key = Object.keys(row).find(k =>
                                k.toLowerCase() === col.toLowerCase() ||
                                k.toLowerCase() === col.toLowerCase().replace(/ /g, '') ||
                                k.toLowerCase() === col.toLowerCase().replace(/ /g, '_') ||
                                k.toLowerCase() === col.toLowerCase().replace(/#/g, 'Number').toLowerCase()
                              ) ?? col;
                              const val = row[key];
                              return (
                                <td key={col} className={`py-3 px-4 text-gray-700 ${isAmount(col) || isNumber(col) ? 'text-right' : ''}`}>
                                  {renderCell(col, val)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                      {/* Totals footer */}
                      {amountCols.length > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                            <td className="py-3 px-4" />
                            {reportData.columns.map(col => {
                              const key = Object.keys(reportData.rows[0] ?? {}).find(k =>
                                k.toLowerCase() === col.toLowerCase() ||
                                k.toLowerCase() === col.toLowerCase().replace(/ /g, '')
                              ) ?? col;
                              const total = isAmount(col)
                                ? reportData.rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)
                                : null;
                              return (
                                <td key={col} className={`py-3 px-4 font-black text-gray-900 ${isAmount(col) || isNumber(col) ? 'text-right' : ''}`}>
                                  {total !== null ? <span className="text-emerald-700">{formatINR(total)}</span> : (col === reportData.columns[0] ? <span className="text-xs text-gray-500 uppercase tracking-wider">Totals</span> : '')}
                                </td>
                              );
                            })}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
