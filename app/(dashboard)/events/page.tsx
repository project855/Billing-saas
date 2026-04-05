'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { RefreshCw, Search, Activity, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const EVENT_COLORS: Record<string, string> = {
  'Customer Added':          'bg-emerald-100 text-emerald-700',
  'Customer Updated':        'bg-blue-100 text-blue-700',
  'Customer Deleted':        'bg-red-100 text-red-600',
  'Invoice Created':         'bg-violet-100 text-violet-700',
  'Invoice Sent':            'bg-blue-100 text-blue-700',
  'Invoice Paid':            'bg-emerald-100 text-emerald-700',
  'Invoice Partially Paid':  'bg-amber-100 text-amber-700',
  'Invoice Cancelled':       'bg-red-100 text-red-600',
  'Invoice Deleted':         'bg-red-100 text-red-600',
  'Payment Recorded':        'bg-emerald-100 text-emerald-700',
  'Payment Voided':          'bg-red-100 text-red-600',
  'Item Added':              'bg-indigo-100 text-indigo-700',
  'Item Updated':            'bg-blue-100 text-blue-700',
  'Item Deleted':            'bg-red-100 text-red-600',
  'Plan Added':              'bg-purple-100 text-purple-700',
  'Plan Updated':            'bg-blue-100 text-blue-700',
  'Addon Added':             'bg-pink-100 text-pink-700',
  'Coupon Created':          'bg-orange-100 text-orange-700',
  'Subscription Created':    'bg-violet-100 text-violet-700',
  'Subscription Updated':    'bg-blue-100 text-blue-700',
  'Subscription Paused':     'bg-amber-100 text-amber-700',
  'Subscription Cancelled':  'bg-red-100 text-red-600',
  'Challan Created':         'bg-cyan-100 text-cyan-700',
  'Challan Opened':          'bg-blue-100 text-blue-700',
  'Challan Closed':          'bg-emerald-100 text-emerald-700',
  'Challan Cancelled':       'bg-red-100 text-red-600',
  'Credit Note Created':     'bg-orange-100 text-orange-700',
  'Credit Note Voided':      'bg-red-100 text-red-600',
  'Quote Created':           'bg-indigo-100 text-indigo-700',
  'Quote Sent':              'bg-blue-100 text-blue-700',
  'Quote Accepted':          'bg-emerald-100 text-emerald-700',
  'Quote Declined':          'bg-red-100 text-red-600',
  'Expense Added':           'bg-rose-100 text-rose-700',
  'Expense Updated':         'bg-amber-100 text-amber-700',
  'Expense Deleted':         'bg-red-100 text-red-600',
  'Settings Updated':        'bg-gray-100 text-gray-600',
};

const SOURCE_COLORS: Record<string, string> = {
  User:   'bg-blue-50 text-blue-600 border-blue-100',
  System: 'bg-gray-100 text-gray-600 border-gray-200',
  API:    'bg-violet-50 text-violet-600 border-violet-100',
};

const EVENT_GROUPS = [
  { label: 'All Events',    values: [] as string[] },
  { label: 'Customers',     values: ['Customer Added', 'Customer Updated', 'Customer Deleted'] },
  { label: 'Invoices',      values: ['Invoice Created', 'Invoice Sent', 'Invoice Paid', 'Invoice Partially Paid', 'Invoice Cancelled', 'Invoice Deleted'] },
  { label: 'Payments',      values: ['Payment Recorded', 'Payment Voided'] },
  { label: 'Catalog',       values: ['Item Added', 'Item Updated', 'Item Deleted', 'Plan Added', 'Plan Updated', 'Addon Added', 'Coupon Created'] },
  { label: 'Subscriptions', values: ['Subscription Created', 'Subscription Updated', 'Subscription Paused', 'Subscription Cancelled'] },
  { label: 'Challans',      values: ['Challan Created', 'Challan Opened', 'Challan Closed', 'Challan Cancelled'] },
  { label: 'Credit Notes',  values: ['Credit Note Created', 'Credit Note Voided'] },
  { label: 'Quotes',        values: ['Quote Created', 'Quote Sent', 'Quote Accepted', 'Quote Declined'] },
  { label: 'Expenses',      values: ['Expense Added', 'Expense Updated', 'Expense Deleted'] },
];

interface EventRow {
  id: string;
  eventId: string;
  eventType: string;
  eventSource: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  occurredAt: string;
}

export default function EventsPage() {
  const [events, setEvents]         = useState<EventRow[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [groupFilter, setGroupFilter] = useState('All Events');
  const [source, setSource]         = useState('all');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page) });
      if (source !== 'all') params.set('source', source);

      const res  = await fetch(`/api/events?${params}`);
      const json = await res.json();
      let data: EventRow[] = Array.isArray(json.data) ? json.data : [];

      // Client-side group filtering
      const group = EVENT_GROUPS.find(g => g.label === groupFilter);
      if (group && group.values.length > 0) {
        data = data.filter(e => group.values.includes(e.eventType));
      }

      setEvents(data);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [search, groupFilter, source, page]);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 300);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand" /> Events
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} event{total !== 1 ? 's' : ''} recorded</p>
        </div>
        <Button variant="outline" onClick={fetchEvents} className="border-gray-200 text-gray-600 gap-2 h-9 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-5 space-y-4">
        {/* Group filter tabs */}
        <div className="flex flex-wrap gap-2">
          {EVENT_GROUPS.map(g => (
            <button key={g.label} onClick={() => { setGroupFilter(g.label); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                groupFilter === g.label
                  ? 'bg-brand/10 border-brand/20 text-brand'
                  : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}>
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search event type, entity, event ID…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-gray-50 border-gray-200 h-10" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Source:</span>
            {['all', 'User', 'System', 'API'].map(s => (
              <button key={s} onClick={() => { setSource(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  source === s ? 'bg-gray-800 text-white border-gray-800' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700'
                }`}>
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] uppercase tracking-widest font-bold text-gray-400">
                <th className="py-3.5 px-6 w-52">Occurred At ↓</th>
                <th className="py-3.5 px-6">Event ID</th>
                <th className="py-3.5 px-6">Event Type</th>
                <th className="py-3.5 px-6">Entity</th>
                <th className="py-3.5 px-6">Event Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[13px]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="py-4 px-6"><div className="h-4 bg-gray-100 rounded w-28" /></td>
                    ))}
                  </tr>
                ))
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center">
                        <Activity className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No events recorded yet</p>
                      <p className="text-gray-400 text-xs max-w-xs text-center">
                        Events are automatically captured as you create invoices, add customers, record payments, and more.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                events.map(evt => (
                  <tr key={evt.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 text-blue-600 font-medium text-sm whitespace-nowrap">
                      {format(new Date(evt.occurredAt), 'dd/MM/yyyy hh:mm aa')}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-gray-600 text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 select-all">
                        {evt.eventId}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${EVENT_COLORS[evt.eventType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {evt.entityName
                        ? <span>{evt.entityType && <span className="text-gray-400 text-xs mr-1">[{evt.entityType}]</span>}{evt.entityName}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${SOURCE_COLORS[evt.eventSource] ?? SOURCE_COLORS.User}`}>
                        {evt.eventSource}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 bg-gray-50/30">
          <span>Showing <span className="text-gray-900 font-bold">{events.length}</span> of <span className="text-gray-900 font-bold">{total}</span> events</span>
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]">
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </Button>
            <span className="px-2 text-gray-600 font-medium">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="h-8 border-gray-200 bg-white text-gray-600 px-3 gap-1 text-[12px]">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
