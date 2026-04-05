'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Plus, Receipt, Banknote, Clock, UserPlus,
  ArrowUpRight, ArrowDownRight, Bell, TrendingUp, TrendingDown,
  AlertCircle, Users, DollarSign, RefreshCw, CheckCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useLanguage } from '@/lib/language-context';

const formatINR = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value ?? 0);

const BRAND = '#EF3A2A';

const EMPTY_DATA = {
  revenue:             0,
  revenueTrend:        0,
  revenueThisMonth:    0,
  outstanding:         0,
  outstandingInvoices: 0,
  overdue:             0,
  overdueInvoices:     0,
  activeClients:       0,
  activeClientsNew:    0,
  totalInvoices:       0,
  totalExpenses:       0,
  revenueChart:        [] as any[],
  pendingInvoices:     [] as any[],
  recentActivity:      [] as any[],
};

export default function DashboardPage() {
  const [data,    setData]    = useState<typeof EMPTY_DATA>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/dashboard/stats');
      const json = await res.json();
      if (res.ok) setData({ ...EMPTY_DATA, ...json });
    } catch { /* silent — keep previous data */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkPaid = async (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res  = await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Failed to mark paid'); return; }
      toast.success('Invoice marked as paid!');
      fetchData();
    } catch { toast.error('Failed to mark paid'); }
  };

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`bg-gray-100 rounded-lg animate-pulse ${className ?? ''}`} />
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            {greeting} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), 'EEEE, dd MMMM yyyy')} · Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}
            className="border-gray-200 text-gray-600 h-9 px-3 gap-1.5 text-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/invoices/new">
            <Button className="bg-brand hover:brightness-90 text-white font-medium rounded-lg px-4 gap-2 shadow-sm border-none text-sm h-9">
              <Plus className="h-4 w-4" /> New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* ── METRIC CARDS ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Revenue */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('dash.revenue')}</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          {loading ? <Skeleton className="h-8 w-32 mb-2" /> : (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{formatINR(data.revenue)}</h2>
          )}
          <p className={`text-[11px] flex items-center gap-1 w-fit px-2 py-0.5 rounded-full font-medium ${
            data.revenueTrend >= 0
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-brand bg-brand/8'
          }`}>
            {data.revenueTrend >= 0
              ? <ArrowUpRight className="h-3 w-3" />
              : <ArrowDownRight className="h-3 w-3" />}
            {loading ? '—' : `${data.revenueTrend >= 0 ? '+' : ''}${data.revenueTrend}% vs last month`}
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">This Month</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          {loading ? <Skeleton className="h-8 w-32 mb-2" /> : (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{formatINR(data.revenueThisMonth)}</h2>
          )}
          <p className="text-[11px] text-blue-600 flex items-center gap-1 bg-blue-50 w-fit px-2 py-0.5 rounded-full font-medium">
            {loading ? '—' : `${data.totalInvoices} invoice${data.totalInvoices !== 1 ? 's' : ''} total`}
          </p>
        </div>

        {/* Outstanding */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('dash.outstanding')}</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          {loading ? <Skeleton className="h-8 w-28 mb-2" /> : (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{formatINR(data.outstanding)}</h2>
          )}
          <p className="text-[11px] text-amber-600 flex items-center gap-1 bg-amber-50 w-fit px-2 py-0.5 rounded-full font-medium">
            {loading ? '—' : `${data.outstandingInvoices} invoice${data.outstandingInvoices !== 1 ? 's' : ''} open`}
          </p>
        </div>

        {/* Overdue */}
        <div className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${
          data.overdueInvoices > 0 ? 'border-red-100 bg-red-50/30' : 'border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{t('dash.overdue')}</p>
            <div className="w-9 h-9 rounded-xl bg-brand/8 flex items-center justify-center">
              <AlertCircle className={`w-4 h-4 ${data.overdueInvoices > 0 ? 'text-brand' : 'text-gray-400'}`} />
            </div>
          </div>
          {loading ? <Skeleton className="h-8 w-28 mb-2" /> : (
            <h2 className={`text-2xl font-bold mb-2 ${data.overdueInvoices > 0 ? 'text-brand' : 'text-gray-400'}`}>
              {data.overdue > 0 ? formatINR(data.overdue) : '₹0'}
            </h2>
          )}
          <p className={`text-[11px] flex items-center gap-1 w-fit px-2 py-0.5 rounded-full font-medium ${
            data.overdueInvoices > 0 ? 'text-brand bg-brand/8' : 'text-gray-400 bg-gray-100'
          }`}>
            {loading ? '—' : `${data.overdueInvoices} invoice${data.overdueInvoices !== 1 ? 's' : ''} overdue`}
          </p>
        </div>
      </div>

      {/* ── CHART + SIDEBAR ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly collected payments — last 6 months</p>
            </div>
          </div>
          <div className="flex-1 min-h-[200px] w-full">
            {loading ? (
              <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
            ) : data.revenueChart.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-gray-300">
                <BarChart className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm text-gray-400">No revenue data yet</p>
                <p className="text-xs text-gray-400 mt-1">Start creating invoices and recording payments</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.revenueChart}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={8} />
                  <YAxis
                    tickFormatter={val => val === 0 ? '₹0' : `₹${(val / 1000).toFixed(0)}k`}
                    axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(239,58,42,0.04)' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '13px' }}
                    formatter={(value: number) => [formatINR(value), 'Revenue']}
                    labelStyle={{ color: '#6b7280', marginBottom: '4px', fontWeight: 600 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {data.revenueChart.map((_: any, index: number) => (
                      <Cell key={index}
                        fill={index === data.revenueChart.length - 1 ? BRAND : '#EF3A2A22'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right sidebar: Activity + Quick Actions */}
        <div className="flex flex-col gap-5">

          {/* Recent Activity */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex-1">
            <h3 className="text-sm font-bold text-gray-800 mb-4">{t('dash.recent_activity')}</h3>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-100 flex-shrink-0 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                      <div className="h-2.5 bg-gray-100 rounded animate-pulse w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data.recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Bell className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No activity yet.<br />Create an invoice to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentActivity.map((act: any) => (
                  <div key={act.id} className="flex gap-3">
                    <div className="mt-1.5 flex-shrink-0 relative flex items-center justify-center">
                      <span className={`absolute inline-flex h-2 w-2 rounded-full opacity-50 animate-ping ${act.color}`} />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${act.color}`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-[12.5px] text-gray-700 leading-snug">{act.text}</p>
                      <span className="text-[11px] text-gray-400 mt-0.5">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/invoices/new', icon: <Receipt className="h-4 w-4 text-brand" />, label: 'Create Invoice', bg: 'bg-brand/8', hoverBg: 'bg-brand/15', hoverBorder: 'hover:border-brand/30' },
              { href: '/payments',    icon: <DollarSign className="h-4 w-4 text-emerald-600" />, label: 'Record Payment', bg: 'bg-emerald-50', hoverBg: 'bg-emerald-100', hoverBorder: 'hover:border-emerald-200' },
              { href: '/expenses',    icon: <Banknote className="h-4 w-4 text-amber-500" />, label: 'Log Expense', bg: 'bg-amber-50', hoverBg: 'bg-amber-100', hoverBorder: 'hover:border-amber-200' },
              { href: '/customers',   icon: <UserPlus className="h-4 w-4 text-blue-500" />, label: 'Add Customer', bg: 'bg-blue-50', hoverBg: 'bg-blue-100', hoverBorder: 'hover:border-blue-200' },
            ].map(action => (
              <Link key={action.href} href={action.href}
                className={`group bg-white border border-gray-100 ${action.hoverBorder} rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all shadow-sm hover:shadow-md`}
              >
                <div className={`w-9 h-9 rounded-lg ${action.bg} group-hover:${action.hoverBg} flex items-center justify-center mb-2 transition-colors`}>
                  {action.icon}
                </div>
                <span className="text-[11.5px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── PENDING INVOICES TABLE ────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{t('dash.pending_invoices')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{data.outstandingInvoices} {t('dash.open_invoices')}</p>
          </div>
          <Link href="/invoices" className="text-xs text-brand hover:brightness-90 font-semibold transition-colors">
            {t('dash.view_all')} →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/70 text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="py-3 px-5 font-bold">Invoice #</th>
                <th className="py-3 px-5 font-bold">Customer</th>
                <th className="py-3 px-5 font-bold">Balance Due</th>
                <th className="py-3 px-5 font-bold">Due Date</th>
                <th className="py-3 px-5 font-bold">Status</th>
                <th className="py-3 px-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-4 px-5">
                        <div className="h-4 bg-gray-100 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.pendingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-full">
                        <CheckCircle className="h-9 w-9 text-emerald-400" />
                      </div>
                      <p className="text-gray-500 font-medium text-sm">All caught up!</p>
                      <p className="text-gray-400 text-xs max-w-xs">No open invoices right now.</p>
                      <Link href="/invoices/new">
                        <Button className="mt-1 bg-brand hover:brightness-90 text-white gap-2 text-sm border-none shadow-sm h-9">
                          <Plus className="w-4 h-4" /> Create Invoice
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                data.pendingInvoices.map((inv: any) => (
                  <tr key={inv.id}
                    className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/invoices/${inv.id}`}
                  >
                    <td className="py-3.5 px-5 font-bold text-blue-600 font-mono">{inv.number}</td>
                    <td className="py-3.5 px-5 text-gray-700 font-medium">{inv.customer}</td>
                    <td className="py-3.5 px-5 font-bold text-gray-900">{formatINR(inv.amount)}</td>
                    <td className={`py-3.5 px-5 text-sm ${inv.status === 'Overdue' ? 'text-brand font-medium' : 'text-gray-400'}`}>
                      {inv.dueDate}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        inv.status === 'Overdue'
                          ? 'bg-brand/8 text-brand'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {inv.status === 'Overdue' && <AlertCircle className="w-3 h-3" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/invoices/${inv.id}`} onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="outline"
                            className="h-7 text-[11px] border-gray-200 bg-white hover:bg-gray-50 text-gray-600 gap-1">
                            <FileText className="w-3 h-3" /> View
                          </Button>
                        </Link>
                        <Button size="sm"
                          className="h-7 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm gap-1"
                          onClick={e => handleMarkPaid(inv.id, e)}
                        >
                          <CheckCircle className="w-3 h-3" /> Mark Paid
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
