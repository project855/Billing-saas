'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Plus, MoreHorizontal, Edit, Trash2, Package,
  LayersIcon, Wrench, Tag, ToggleLeft, ToggleRight
} from 'lucide-react';
import { AddItemModal } from '@/components/items/AddItemModal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const formatINR = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val ?? 0);

export default function ItemsPage() {
  const [items,         setItems]         = useState<any[]>([]);
  const [stats,         setStats]         = useState({ total: 0, productCount: 0, serviceCount: 0 });
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [taxFilter,     setTaxFilter]     = useState('all');
  const [statusFilter,  setStatusFilter]  = useState('active');
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editingItem,   setEditingItem]   = useState<any>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, type: typeFilter, status: statusFilter });
      const res    = await fetch(`/api/items?${params}`);
      const json   = await res.json();
      if (json?.items) {
        setItems(json.items);
        setStats(json.stats ?? { total: 0, productCount: 0, serviceCount: 0 });
      } else if (Array.isArray(json)) {
        // Legacy fallback
        setItems(json);
      }
    } catch { toast.error('Failed to load items'); }
    finally { setLoading(false); }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this item? It can be reactivated later.')) return;
    try {
      const res  = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Failed'); return; }
      toast.success('Item deactivated');
      fetchItems();
    } catch { toast.error('Failed to deactivate item'); }
  };

  const handleReactivate = async (id: string) => {
    try {
      const res  = await fetch(`/api/items/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'active' }),
      });
      if (!res.ok) { toast.error('Failed to reactivate'); return; }
      toast.success('Item reactivated');
      fetchItems();
    } catch { toast.error('Failed'); }
  };

  const openEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true); };
  const openNew  = ()          => { setEditingItem(null); setIsModalOpen(true); };

  // Client-side tax rate filter
  const visibleItems = taxFilter === 'all'
    ? items
    : items.filter(i => String(i.taxRate) === taxFilter);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-900">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Items & Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Products and services used in invoices.</p>
        </div>
        <Button
          suppressHydrationWarning
          onClick={openNew}
          className="bg-brand hover:brightness-90 text-white font-semibold rounded-lg shadow-sm border-none gap-2 h-9 px-5"
        >
          <Plus className="h-4 w-4" /> New Item
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total Items',
            value: loading ? '—' : stats.total,
            icon:  <Package className="w-5 h-5 text-brand" />,
            bg:    'bg-brand/8',
            sub:   'Active in catalog',
          },
          {
            label: 'Products',
            value: loading ? '—' : stats.productCount,
            icon:  <LayersIcon className="w-5 h-5 text-blue-600" />,
            bg:    'bg-blue-50',
            sub:   'Physical goods',
          },
          {
            label: 'Services',
            value: loading ? '—' : stats.serviceCount,
            icon:  <Wrench className="w-5 h-5 text-purple-600" />,
            bg:    'bg-purple-50',
            sub:   'Professional services',
          },
        ].map(card => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bg}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{card.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            suppressHydrationWarning
            placeholder="Search by name, SKU, or HSN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 text-sm text-gray-800 rounded-lg focus-visible:ring-brand/20 focus-visible:border-brand/30 h-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Type toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg border border-gray-100">
            {['all', 'product', 'service'].map(f => (
              <button key={f} onClick={() => setTypeFilter(f)} suppressHydrationWarning
                className={`px-3 py-1.5 rounded-md capitalize text-[12px] font-semibold transition-all ${
                  typeFilter === f ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {f === 'all' ? 'All' : f === 'product' ? '📦 Products' : '🔧 Services'}
              </button>
            ))}
          </div>

          {/* Status toggle */}
          <button
            suppressHydrationWarning
            onClick={() => setStatusFilter(s => s === 'active' ? 'all' : 'active')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-gray-100 border-gray-200 text-gray-600'
                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
            }`}
          >
            {statusFilter === 'active'
              ? <ToggleRight className="w-4 h-4" />
              : <ToggleLeft  className="w-4 h-4" />}
            {statusFilter === 'active' ? 'Active Only' : 'All Statuses'}
          </button>

          {/* Tax rate filter */}
          <select
            suppressHydrationWarning
            className="text-[12px] bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-3 py-2 outline-none focus:border-brand/40 h-9"
            value={taxFilter}
            onChange={e => setTaxFilter(e.target.value)}
          >
            <option value="all">Any Tax Rate</option>
            <option value="0">0% GST</option>
            <option value="5">5% GST</option>
            <option value="12">12% GST</option>
            <option value="18">18% GST</option>
            <option value="28">28% GST</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/70 text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                <th className="py-3.5 px-5">Name & SKU</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">Selling Price</th>
                <th className="py-3.5 px-5">Unit</th>
                <th className="py-3.5 px-5">Tax</th>
                <th className="py-3.5 px-5">HSN/SAC</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 w-14" />
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-gray-50">

              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 w-36 bg-gray-100 rounded mb-2" /><div className="h-3 w-20 bg-gray-100 rounded" /></td>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-4 px-5"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                    ))}
                    <td className="py-4 px-5"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-50 rounded-full ring-1 ring-gray-100">
                        <Package className="h-10 w-10 text-gray-300" />
                      </div>
                      <p className="text-gray-600 font-semibold">No items found</p>
                      <p className="text-gray-400 text-xs max-w-xs">
                        {search ? `No results for "${search}" — try a different search.` : 'Add your first product or service to start invoicing.'}
                      </p>
                      {!search && (
                        <Button suppressHydrationWarning onClick={openNew}
                          className="mt-2 bg-brand hover:brightness-90 text-white gap-2 border-none shadow-sm h-9 px-5">
                          <Plus className="w-4 h-4" /> Add Item
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {item.type === 'service'
                          ? <Wrench className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          : <Package className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                        {item.name}
                      </div>
                      {item.sku && <div className="text-[11px] font-mono text-gray-400 mt-0.5">{item.sku}</div>}
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${
                        item.type === 'product'
                          ? 'bg-blue-50 text-blue-600 border-blue-100'
                          : 'bg-purple-50 text-purple-600 border-purple-100'
                      }`}>
                        {item.type}
                      </span>
                    </td>

                    <td className="py-4 px-5 font-bold text-gray-900">{formatINR(item.sellingPrice)}</td>

                    <td className="py-4 px-5 text-gray-500 text-sm">per {item.unit}</td>

                    <td className="py-4 px-5">
                      {item.taxable
                        ? <span className="flex items-center gap-1 text-emerald-700 text-sm font-medium">
                            <Tag className="w-3 h-3" /> {item.taxRate}% GST
                          </span>
                        : <span className="text-gray-400 text-sm">Non-taxable</span>
                      }
                    </td>

                    <td className="py-4 px-5 text-sm text-gray-500 font-mono">
                      {item.hsnCode || <span className="text-gray-300">—</span>}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button suppressHydrationWarning variant="ghost" size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border-gray-100 shadow-xl min-w-[150px] rounded-xl">
                          <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer text-gray-700 py-2.5 rounded-lg gap-2" onClick={() => openEdit(item)}>
                            <Edit className="w-4 h-4 text-blue-500" /> Edit
                          </DropdownMenuItem>
                          <div className="h-px bg-gray-100 my-1" />
                          {item.status === 'active' ? (
                            <DropdownMenuItem className="text-red-500 hover:bg-red-50 cursor-pointer py-2.5 font-medium rounded-lg gap-2" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4" /> Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-emerald-600 hover:bg-emerald-50 cursor-pointer py-2.5 font-medium rounded-lg gap-2" onClick={() => handleReactivate(item.id)}>
                              <Package className="w-4 h-4" /> Reactivate
                            </DropdownMenuItem>
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

        {!loading && visibleItems.length > 0 && (
          <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Showing <span className="font-bold text-gray-700">{visibleItems.length}</span> item{visibleItems.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AddItemModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={fetchItems}
          initialData={editingItem}
        />
      )}
    </div>
  );
}
