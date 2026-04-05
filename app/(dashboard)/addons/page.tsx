'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Gift, Search, Tag, Settings2, Trash2, Edit2, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';

type Addon = {
  id: string;
  name: string;
  code: string;
  type: string;
  price: number;
  products: string[];
  status: string;
  cycle?: string;
};

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  // New addon state
  const [newAddon, setNewAddon] = useState({
    name: '', code: '', type: 'One-time', price: '', cycle: '',
    products: [] as string[]
  });

  const [itemsList, setItemsList] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setItemsList(data.items);
        }
      })
      .catch(console.error);
  }, []);

  const visible = addons.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (product: string) => {
    setNewAddon(prev => ({
      ...prev,
      products: prev.products.includes(product) 
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
    }));
  };

  const createAddon = () => {
    if (!newAddon.name || !newAddon.code || !newAddon.price) {
      toast.error('Name, Code, and Price are required');
      return;
    }
    setAddons(prev => [...prev, {
      id: newAddon.code,
      name: newAddon.name,
      code: newAddon.code,
      type: newAddon.type,
      price: parseFloat(newAddon.price),
      cycle: newAddon.type === 'Recurring' ? newAddon.cycle : '',
      products: newAddon.products,
      status: 'Active'
    }]);
    toast.success('Add-on created successfully');
    setShowNew(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-brand" /> Add-ons
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage additional items or services sold alongside plans.</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-brand hover:brightness-90 text-white border-none shadow-sm gap-2 h-9 px-5 rounded-lg">
          <Plus className="w-4 h-4" /> New Add-on
        </Button>
      </div>

      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            value={search} onChange={e => setSearch(e.target.value)} 
            placeholder="Search add-ons by name or code..."
            className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg" 
          />
        </div>
      </div>

      {showNew && (
        <div className="bg-white border-2 border-brand rounded-xl p-6 mb-6 shadow-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
               Create New Add-on <span className="bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand/20">Zoho Format</span>
             </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
            <div className="space-y-1 block xl:col-span-1">
              <label className="text-xs font-semibold text-gray-600">Add-on Name *</label>
              <Input value={newAddon.name} onChange={e => setNewAddon({...newAddon, name: e.target.value})} placeholder="e.g. Priority Support" className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
            <div className="space-y-1 block xl:col-span-1">
              <label className="text-xs font-semibold text-gray-600">Add-on Code *</label>
              <Input value={newAddon.code} onChange={e => setNewAddon({...newAddon, code: e.target.value})} placeholder="e.g. addon_priority_support" className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
            <div className="space-y-1 block xl:col-span-1">
              <label className="text-xs font-semibold text-gray-600">Type</label>
              <select 
                value={newAddon.type} 
                onChange={e => setNewAddon({...newAddon, type: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option>One-time</option>
                <option>Recurring</option>
              </select>
            </div>
            {newAddon.type === 'Recurring' && (
              <div className="space-y-1 block xl:col-span-1 animate-in fade-in zoom-in duration-300">
                <label className="text-xs font-semibold text-gray-600">Billing Cycle</label>
                <select 
                  value={newAddon.cycle} 
                  onChange={e => setNewAddon({...newAddon, cycle: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="">Select cycle...</option>
                  <option>1 Month</option>
                  <option>1 Year</option>
                </select>
              </div>
            )}
            <div className="space-y-1 block xl:col-span-1">
              <label className="text-xs font-semibold text-gray-600">Price (₹) *</label>
              <Input type="number" value={newAddon.price} onChange={e => setNewAddon({...newAddon, price: e.target.value})} placeholder="e.g. 500" className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-2 mt-2 border-t pt-4">
               <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5"><PackageOpen className="w-3.5 h-3.5" /> Applicable Products & Services</label>
               <div className="flex flex-wrap gap-2">
                 {itemsList.length === 0 && <span className="text-sm text-gray-400 italic">No products available. Create items first.</span>}
                 {itemsList.map(item => (
                   <button 
                     key={item.id}
                     onClick={() => toggleProduct(item.name)}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                       newAddon.products.includes(item.name)
                         ? 'bg-blue-50 border-blue-200 text-blue-700'
                         : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                     }`}
                   >
                     {item.name}
                   </button>
                 ))}
               </div>
            </div>
          </div>
          
          <div className="flex gap-2 border-t pt-4">
            <Button onClick={createAddon} className="bg-brand hover:brightness-90 text-white border-none h-9 px-5 text-sm rounded-lg">Save Add-on</Button>
            <Button variant="outline" onClick={() => setShowNew(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50 h-9 px-4 text-sm rounded-lg">Cancel</Button>
          </div>
        </div>
      )}

      {/* Addons List view */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Add-on Name & Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4">Applicable Products</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((addon) => (
                <tr key={addon.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-gray-400" />
                      {addon.name}
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5 ml-6">{addon.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      addon.type === 'Recurring' ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {addon.type}
                    </span>
                    {addon.cycle && <span className="block text-xs text-gray-500 mt-1">{addon.cycle}</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-extrabold text-gray-900">{formatINR(addon.price)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                       {addon.products.map(p => (
                         <span key={p} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                           {p}
                         </span>
                       ))}
                       {addon.products.length === 0 && <span className="text-gray-400 text-xs italic">All Products</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      addon.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${addon.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div> {addon.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Gift className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium text-gray-900">No add-ons found</p>
                    <p className="text-xs">Adjust your search or create a new add-on.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
