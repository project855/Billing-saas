'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Plus, Search, RefreshCw, MoreHorizontal, Edit, Trash2,
  TrendingDown, ChevronLeft, ChevronRight, Calendar, Tag, PieChart
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';
import ManageCategoriesModal from '@/components/expenses/ManageCategoriesModal';

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const DATE_RANGES = [
  { label: 'This Month',  from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),           to: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Last Month',  from: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd') },
  { label: 'Last 3 Months', from: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'All Time',    from: '', to: '' },
];

export default function ExpensesPage() {
  const [expenses,    setExpenses]   = useState<any[]>([]);
  const [categories,  setCategories] = useState<any[]>([]);
  const [stats,       setStats]      = useState<any>({ totalAllTime: 0, totalThisMonth: 0, byCategory: {} });
  const [meta,        setMeta]       = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,     setLoading]    = useState(true);
  const [search,      setSearch]     = useState('');
  const [catFilter,   setCatFilter]  = useState('all');
  const [dateRange,   setDateRange]  = useState(DATE_RANGES[0]);
  const [page,        setPage]       = useState(1);
  const [showAdd,     setShowAdd]    = useState(false);
  const [showCats,    setShowCats]   = useState(false);
  const [editing,     setEditing]    = useState<any>(null);

  const fetchCategories = async () => {
    try {
      const res  = await fetch('/api/expense-categories');
      const json = await res.json();
      setCategories(Array.isArray(json.data) ? json.data : []);
    } catch { setCategories([]); }
  };

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page) });
      if (catFilter !== 'all')    params.set('categoryId', catFilter);
      if (dateRange.from) params.set('from', dateRange.from);
      if (dateRange.to)   params.set('to',   dateRange.to);

      const res  = await fetch(`/api/expenses?${params}`);
      const json = await res.json();

      setExpenses(Array.isArray(json.data) ? json.data : []);
      setMeta({ total: json.total ?? 0, page: json.page ?? 1, totalPages: json.totalPages ?? 1 });
      if (json.stats) setStats(json.stats);
    } catch {
      toast.error('Failed to load expenses');
      setExpenses([]);
    } finally { setLoading(false); }
  }, [search, catFilter, dateRange, page]);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchExpenses, 350);
    return () => clearTimeout(t);
  }, [fetchExpenses]);

  const handleDelete = async (exp: any) => {
    if (!confirm(`Delete expense "${exp.description}"?`)) return;
    try {
      const res  = await fetch(`/api/expenses/${exp.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success('Expense deleted');
      fetchExpenses();
    } catch { toast.error('Failed to delete'); }
  };

  // Category breakdown sorted by amount
  const catBreakdown = Object.entries(stats.byCategory as Record<string, any>)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 5);

  const topCatTotal = catBreakdown.reduce((s, [, v]) => s + v.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total} expense{meta.total !== 1 ? 's' : ''} · {dateRange.label}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCats(true)}
            className="border-gray-200 text-gray-600 gap-2 h-9 text-sm">
            <Tag className="w-3.5 h-3.5" /> Categories
          </Button>
          <Button variant="outline" onClick={fetchExpenses}
            className="border-gray-200 text-gray-600 gap-2 h-9 text-sm">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button onClick={() => { setEditing(null); setShowAdd(true); }}
            className="bg-brand hover:brightness-90 text-white font-semibold gap-2 shadow-sm border-none rounded-lg px-5 h-9 text-sm">
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total (All Time)',  value: formatINR(stats.totalAllTime),   color: 'text-brand', bg: 'bg-red-50',    icon: <TrendingDown className="w-5 h-5 text-brand" /> },
          { label: 'This Month',        value: formatINR(stats.totalThisMonth), color: 'text-orange-600', bg: 'bg-orange-50', icon: <Calendar className="w-5 h-5 text-orange-500" />   },
          { label: 'Categories Used',   value: String(Object.keys(stats.byCategory).length), color: 'text-violet-600', bg: 'bg-violet-50', icon: <PieChart className="w-5 h-5 text-violet-600" /> },
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5">
        {/* Category breakdown mini-chart */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-brand" /> By Category
          </h3>
          {catBreakdown.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {catBreakdown.map(([name, v]: any) => {
                const pct = topCatTotal > 0 ? Math.round((v.amount / topCatTotal) * 100) : 0;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-gray-700">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.color }} />
                        {name}
                      </span>
                      <span className="text-gray-500 font-mono">{formatINR(v.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: v.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="lg:col-span-3 bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col gap-4 justify-center">
          {/* Date Range */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Period:</span>
            {DATE_RANGES.map(r => (
              <button key={r.label} onClick={() => { setDateRange(r); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                  dateRange.label === r.label
                    ? 'bg-brand/10 border-brand/20 text-brand'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider mr-1">Category:</span>
            <button
              onClick={() => { setCatFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                catFilter === 'all' ? 'bg-white border-gray-300 text-gray-900 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-gray-800'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { setCatFilter(cat.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                  catFilter === cat.id ? 'bg-white border-gray-300 text-gray-900 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                {cat.name}
                {cat._count?.expenses > 0 && (
                  <span className="text-gray-400">({cat._count.expenses})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by description or category..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus-visible:ring-brand/20 focus-visible:border-brand/30 h-10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/50 text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Amount</th>
                <th className="py-4 px-6 w-14"></th>
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <TrendingDown className="h-10 w-10 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No expenses found</p>
                      <p className="text-gray-400 text-xs">
                        {catFilter !== 'all' || search ? 'Try adjusting your filters.' : 'Start logging your business expenses.'}
                      </p>
                      <Button onClick={() => { setEditing(null); setShowAdd(true); }}
                        className="mt-2 bg-brand hover:brightness-90 text-white gap-2 text-sm border-none shadow-sm">
                        <Plus className="w-4 h-4" /> Add Expense
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-800">{exp.description}</span>
                    </td>
                    <td className="py-4 px-6">
                      {exp.category ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                          style={{
                            background: exp.category.color + '18',
                            borderColor: exp.category.color + '40',
                            color:       exp.category.color,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: exp.category.color }} />
                          {exp.category.name}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {format(new Date(exp.date), 'dd MMM yyyy')}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-brand text-base">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-gray-100 shadow-xl min-w-[160px]">
                          <DropdownMenuItem
                            className="hover:bg-gray-50 cursor-pointer text-gray-700 gap-2.5 py-2"
                            onClick={() => { setEditing(exp); setShowAdd(true); }}
                          >
                            <Edit className="w-4 h-4 text-amber-500" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gray-50" />
                          <DropdownMenuItem
                            className="text-red-500 hover:bg-red-50 cursor-pointer gap-2.5 py-2 font-medium"
                            onClick={() => handleDelete(exp)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Subtotal row */}
            {expenses.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50/50 border-t border-gray-100">
                  <td colSpan={3} className="py-3 px-6 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    Showing {expenses.length} of {meta.total}
                  </td>
                  <td className="py-3 px-6 text-right font-bold text-gray-900">
                    {formatINR(expenses.reduce((s, e) => s + e.amount, 0))}
                    <span className="text-gray-400 font-normal text-[11px] ml-1">this page</span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/30">
          <span>
            Showing <span className="text-gray-900 font-bold">{expenses.length}</span> of{' '}
            <span className="text-gray-900 font-bold">{meta.total}</span> expenses
          </span>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]">
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <span className="px-2 text-gray-600 font-medium">{page} / {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
              className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {showAdd && (
        <AddExpenseModal
          categories={categories}
          expense={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSuccess={() => { setShowAdd(false); setEditing(null); fetchExpenses(); fetchCategories(); }}
        />
      )}

      {showCats && (
        <ManageCategoriesModal
          categories={categories}
          onClose={() => setShowCats(false)}
          onSuccess={() => { setShowCats(false); fetchCategories(); fetchExpenses(); }}
        />
      )}
    </div>
  );
}
