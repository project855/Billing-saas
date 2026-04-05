'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Tag, Percent, Check, Copy, ToggleRight, ToggleLeft } from 'lucide-react';
import { CouponModal } from '@/components/coupons/CouponModal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function CouponsPage() {
  const [coupons,       setCoupons]       = useState<any[]>([]);
  const [stats,         setStats]         = useState({ total: 0, active: 0 });
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editingItem,   setEditingItem]   = useState<any>(null);
  const [copied,        setCopied]        = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search });
      const res    = await fetch(`/api/coupons?${params}`);
      const json   = await res.json();
      if (json?.coupons) {
        setCoupons(json.coupons);
        setStats(json.stats ?? { total: 0, active: 0 });
      }
    } catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchCoupons, 300);
    return () => clearTimeout(t);
  }, [fetchCoupons]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this coupon?')) return;
    try {
      const res  = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Failed'); return; }
      toast.success('Coupon deactivated');
      fetchCoupons();
    } catch { toast.error('Failed to deactivate'); }
  };

  const toggleStatus = async (coupon: any) => {
    try {
      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      toast.success(`Coupon turned ${newStatus}`);
      fetchCoupons();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`Copied "${code}" to clipboard`);
  };

  const openEdit = (item: any) => { setEditingItem(item); setIsModalOpen(true); };
  const openNew  = ()          => { setEditingItem(null); setIsModalOpen(true); };

  const totalRedemptions = coupons.reduce((s, c) => s + (c.totalRedemptions || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-900">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand" /> Coupons
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage discounts, promotional codes, and offers.</p>
        </div>
        <Button
          suppressHydrationWarning
          onClick={openNew}
          className="bg-brand hover:brightness-90 text-white font-semibold rounded-lg shadow-sm border-none gap-2 h-9 px-5"
        >
          <Plus className="h-4 w-4" /> New Coupon
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
            <Tag className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Coupons</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? '—' : stats.total}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Coupons</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? '—' : stats.active}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50">
            <Percent className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Redemptions</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{loading ? '—' : totalRedemptions}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            suppressHydrationWarning
            placeholder="Search by name or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 text-sm text-gray-800 rounded-lg focus-visible:ring-brand/20 focus-visible:border-brand/30 h-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/70 text-[11px] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100">
                <th className="py-3.5 px-5">Name & Code</th>
                <th className="py-3.5 px-5">Discount</th>
                <th className="py-3.5 px-5">Redemption</th>
                <th className="py-3.5 px-5">Expiry</th>
                <th className="py-3.5 px-5 text-center">Status</th>
                <th className="py-3.5 px-5 w-14" />
              </tr>
            </thead>
            <tbody className="text-[13px] divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 w-36 bg-gray-100 rounded mb-2" /><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                    <td className="py-4 px-5"><div className="h-6 w-12 bg-gray-100 rounded-full mx-auto" /></td>
                    <td className="py-4 px-5"><div className="h-8 w-8 bg-gray-100 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-50 rounded-full ring-1 ring-gray-100">
                        <Tag className="h-10 w-10 text-gray-300" />
                      </div>
                      <p className="text-gray-600 font-semibold">No coupons found</p>
                      <p className="text-gray-400 text-xs max-w-xs">
                        {search ? `No results for "${search}" — try a different search.` : 'Create a coupon code to start offering discounts.'}
                      </p>
                      {!search && (
                        <Button suppressHydrationWarning onClick={openNew}
                          className="mt-2 bg-brand hover:brightness-90 text-white gap-2 border-none shadow-sm h-9 px-5">
                          <Plus className="w-4 h-4" /> New Coupon
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                coupons.map(coupon => {
                  const isExpired = coupon.expirationDate && new Date(coupon.expirationDate) < new Date();
                  const usagePct = coupon.maxRedemptions ? Math.round((coupon.totalRedemptions / coupon.maxRedemptions) * 100) : null;
                  
                  return (
                    <tr key={coupon.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                          {coupon.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 rounded text-[11px] uppercase">{coupon.code}</code>
                          <button onClick={() => copyCode(coupon.id, coupon.code)} className="text-gray-400 hover:text-gray-700 transition-colors">
                            {copied === coupon.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-bold text-gray-900">
                        {coupon.discountType === 'flat' ? `${formatINR(coupon.discountValue)} flat` : `${coupon.discountValue}% off`}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-600 capitalize">
                            {coupon.redemptionType === 'limited' ? `Max ${coupon.maxRedemptions}` : coupon.redemptionType.replace('-', ' ')}
                          </span>
                          {usagePct !== null && (
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                              <div className={`h-full rounded-full ${usagePct >= 100 ? 'bg-red-400' : usagePct >= 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(usagePct, 100)}%` }} />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className={`py-4 px-5 text-sm ${isExpired ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
                        {isExpired ? '⚠ Expired' : (coupon.expirationDate ? new Date(coupon.expirationDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never')}
                      </td>

                      <td className="py-4 px-5 text-center">
                        <button onClick={() => toggleStatus(coupon)}>
                          {coupon.status === 'active' && !isExpired
                            ? <ToggleRight className="w-6 h-6 text-emerald-500 mx-auto" />
                            : <ToggleLeft  className="w-6 h-6 text-gray-300 mx-auto" />}
                        </button>
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
                            <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer text-gray-700 py-2.5 rounded-lg gap-2" onClick={() => openEdit(coupon)}>
                              <Edit className="w-4 h-4 text-blue-500" /> Edit
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 my-1" />
                            <DropdownMenuItem className="text-red-500 hover:bg-red-50 cursor-pointer py-2.5 font-medium rounded-lg gap-2" onClick={() => handleDelete(coupon.id)}>
                              <Trash2 className="w-4 h-4" /> Deactivate
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
      </div>

      {isModalOpen && (
        <CouponModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSuccess={fetchCoupons}
          initialData={editingItem}
        />
      )}
    </div>
  );
}
