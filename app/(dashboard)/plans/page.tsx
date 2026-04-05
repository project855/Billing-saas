'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Layers, Check, Search, Package, MoreVertical, Edit2, Trash2,
  ArrowLeft, Share2, Edit, Copy, CheckCircle2, BarChart3, Image as ImageIcon, MessageSquare, History, X
} from 'lucide-react';
import { toast } from 'sonner';

type Plan = {
  id: string;
  name: string;
  code: string;
  product: string;
  pricingModel: string;
  price: number;
  cycle: string;
  trial: number;
  setupFee: number;
  status: string;
  unitName?: string;
  creationDate?: string;
};

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('plan details');

  // New plan state
  const [newPlan, setNewPlan] = useState({
    name: '', code: '', product: '', pricingModel: 'Flat Fee',
    price: '', cycle: '1 Month', trial: '14', setupFee: '0'
  });

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setProducts(data.items);
          if (data.items.length > 0) {
            setNewPlan(prev => ({ ...prev, product: data.items[0].name }));
          }
        }
      })
      .catch(console.error);
  }, []);

  const visible = plans.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const createPlan = () => {
    if (!newPlan.name || !newPlan.code || !newPlan.price) {
      toast.error('Name, Code, and Price are required');
      return;
    }
    const newId = newPlan.code;
    setPlans(prev => [...prev, {
      id: newId,
      name: newPlan.name,
      code: newPlan.code,
      product: newPlan.product,
      pricingModel: newPlan.pricingModel,
      price: parseFloat(newPlan.price),
      cycle: newPlan.cycle,
      trial: parseInt(newPlan.trial) || 0,
      setupFee: parseFloat(newPlan.setupFee) || 0,
      status: 'Active',
      creationDate: new Date().toLocaleDateString('en-GB')
    }]);
    toast.success('Plan created successfully');
    setShowNew(false);
  };

  if (selectedPlan) {
    // DETAIL VIEW
    return (
      <div className="flex-1 flex flex-col bg-[#F9FAFB] min-h-screen font-sans">
        <div className="px-8 py-4 border-b border-gray-200 bg-white">
          <button 
            onClick={() => setSelectedPlanId(null)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Plans
          </button>
        </div>

        {/* Detail Header */}
        <div className="bg-[#F9FAFB] px-8 py-5 flex items-center justify-between z-10 mt-2">
          <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">{selectedPlan.name}</h2>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors bg-white shadow-sm border border-gray-200">
              <MessageSquare className="w-4 h-4" />
            </button>
            <button onClick={() => setSelectedPlanId(null)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors bg-white shadow-sm border border-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-[#F9FAFB] px-8 py-3 flex items-center gap-5 text-[13px] font-semibold text-gray-600 border-b border-gray-200 shadow-sm">
           <button className="flex items-center gap-2 hover:text-gray-900 transition-colors"><Edit className="w-4 h-4 opacity-70" /> Edit</button>
           <span className="w-1 h-1 rounded-full bg-gray-300" />
           <button className="flex items-center gap-2 hover:text-gray-900 transition-colors"><CheckCircle2 className="w-4 h-4 opacity-70" /> Mark as Inactive</button>
           <span className="w-1 h-1 rounded-full bg-gray-300" />
           <button className="flex items-center gap-1 hover:text-gray-900 transition-colors border px-2 py-0.5 rounded border-gray-200 bg-white"><MoreVertical className="w-4 h-4 opacity-70" /></button>
        </div>

        <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Summary Card */}
          <div className="bg-white border text-gray-800 border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 relative">
             <div className="absolute -top-[12px] left-6">
                <span className="bg-[#2B8A3E] text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm flex items-center gap-1 leading-none shadow-emerald-900/10">
                   {selectedPlan.status}
                </span>
             </div>
             
             <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-start mt-2">
                <div className="flex-1 max-w-[300px]">
                  <h3 className="text-[22px] font-bold text-gray-900 mb-1 tracking-tight">{selectedPlan.name}</h3>
                  <div className="text-[13px] text-gray-500 font-medium flex items-center gap-2 mb-6">
                    Plan Code: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 border border-gray-200">{selectedPlan.code}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] font-medium text-gray-500">
                     <span className="text-[#2B8A3E] flex items-center gap-1.5">
                       <BarChart3 className="w-4 h-4" /> MRR : ₹0.00
                     </span>
                     <span className="w-1 h-1 bg-gray-300 rounded-full" />
                     <span>ARR : ₹0.00</span>
                  </div>
                </div>
                
                <div className="flex-1 lg:border-l border-gray-100 lg:pl-10">
                   <div className="text-[28px] font-bold text-gray-900 mb-1 tracking-tight">{formatINR(selectedPlan.price)}</div>
                   <p className="text-[13px] text-gray-500 font-medium">Bill Every {selectedPlan.cycle.toLowerCase().replace('(s)', 's')}</p>
                </div>
             </div>
          </div>

          {/* Tabs Container */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm text-gray-800">
             {/* Tabs Header */}
             <div className="flex flex-wrap items-center gap-x-8 px-8 border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
                {['Plan Details', 'Addons', 'Price Lists', 'Activity Logs'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`py-4 text-[13px] font-bold border-b-2 transition-all whitespace-nowrap outline-none ${activeTab === tab.toLowerCase() ? 'border-[#0070f3] text-[#0070f3]' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'}`}
                  >
                    {tab}
                  </button>
                ))}
             </div>

             {/* Plan Details Content */}
             {activeTab === 'plan details' && (
               <div className="p-8">
                  <div className="pb-10 border-b border-gray-100 mb-10">
                     {/* Info grid */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-7 gap-x-6">
                        <div className="space-y-1">
                          <div className="text-[13px] text-gray-500 font-medium">Plan Name</div>
                          <div className="text-[14px] font-bold text-gray-900">{selectedPlan.name}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[13px] text-gray-500 font-medium">Plan Code</div>
                          <div className="text-[14px] font-bold text-gray-900">{selectedPlan.code}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[13px] text-gray-500 font-medium">Product Name</div>
                          <div className="text-[14px] font-bold text-[#0070f3] cursor-pointer hover:underline">{selectedPlan.product}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[13px] text-gray-500 font-medium">Creation Date</div>
                          <div className="text-[14px] font-bold text-gray-900">{selectedPlan.creationDate || '23/03/2026'}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[13px] text-gray-500 font-medium">Billing Cycles</div>
                          <div className="text-[14px] font-bold text-gray-900">Auto-renews until canceled</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[13px] text-gray-500 font-medium">Billing Frequency</div>
                          <div className="text-[14px] font-bold text-gray-900">{selectedPlan.cycle}</div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-10">
                     {/* Section 1 */}
                     <div>
                       <h4 className="text-[16px] font-bold text-gray-900 mb-5">Pricing Details</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-6">
                         <div className="space-y-1">
                            <div className="text-[13px] text-gray-500 font-medium">Pricing Model</div>
                            <div className="text-[14px] font-bold text-gray-900">{selectedPlan.pricingModel}</div>
                         </div>
                         <div className="space-y-1">
                            <div className="text-[13px] text-gray-500 font-medium">Price</div>
                            <div className="text-[14px] font-bold text-gray-900">{formatINR(selectedPlan.price)}</div>
                         </div>
                       </div>
                     </div>

                     {/* Section 3 */}
                     <div>
                       <h4 className="text-[16px] font-bold text-gray-900 mb-5">Other Details</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-6">
                         <div className="space-y-1">
                            <div className="text-[13px] text-gray-500 font-medium">Account Name</div>
                            <div className="text-[14px] font-bold text-gray-900">Sales</div>
                         </div>
                         <div className="space-y-1">
                            <div className="text-[13px] text-gray-500 font-medium">Type</div>
                            <div className="text-[14px] font-bold text-gray-900">Goods</div>
                         </div>
                       </div>
                     </div>
                  </div>
               </div>
             )}

             {/* Empty tabs content */}
             {activeTab !== 'plan details' && (
               <div className="p-20 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                   <History className="w-8 h-8 text-gray-300" />
                 </div>
                 <h3 className="text-[16px] font-bold text-gray-900 mb-1.5 capitalize">{activeTab}</h3>
                 <p className="text-[13px] text-gray-500 font-medium">There is no information to show for this section.</p>
               </div>
             )}
          </div>
          
          <div className="pb-16" />
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand" /> Plans
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage plans mapped to your products.</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="bg-brand hover:brightness-90 text-white border-none shadow-sm gap-2 h-9 px-5 rounded-lg">
          <Plus className="w-4 h-4" /> New Plan
        </Button>
      </div>

      <div className="flex items-center mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search plans by name or code..."
            className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-lg"
          />
        </div>
      </div>

      {showNew && (
        <div className="bg-white border-2 border-brand rounded-xl p-6 mb-6 shadow-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              Create New Plan <span className="bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full uppercase tracking-widest border border-brand/20">Pro Form</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Product</label>
              <select
                value={newPlan.product}
                onChange={e => setNewPlan({ ...newPlan, product: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              >
                {products.length === 0 && <option value="">No products available...</option>}
                {products.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Plan Name *</label>
              <Input value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="e.g. Starter Monthly" className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Plan Code *</label>
              <Input value={newPlan.code} onChange={e => setNewPlan({ ...newPlan, code: e.target.value })} placeholder="e.g. starter_monthly" className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Pricing Model</label>
              <select
                value={newPlan.pricingModel}
                onChange={e => setNewPlan({ ...newPlan, pricingModel: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option>Flat Fee</option>
                <option>Volume/Unit</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Price (₹) *</label>
              <Input type="number" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} placeholder="e.g. 499" className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Billing Cycle</label>
              <select
                value={newPlan.cycle}
                onChange={e => setNewPlan({ ...newPlan, cycle: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-md h-9 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option>Every 1 Month</option>
                <option>Every 1 Year</option>
                <option>Every 1 Week</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Free Trial (Days)</label>
              <Input type="number" value={newPlan.trial} onChange={e => setNewPlan({ ...newPlan, trial: e.target.value })} className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Setup Fee (₹)</label>
              <Input type="number" value={newPlan.setupFee} onChange={e => setNewPlan({ ...newPlan, setupFee: e.target.value })} className="bg-white border-gray-200 h-9 text-sm focus:border-brand" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={createPlan} className="bg-brand hover:brightness-90 text-white border-none h-9 px-5 text-sm rounded-lg">Save Plan</Button>
            <Button variant="outline" onClick={() => setShowNew(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50 h-9 px-4 text-sm rounded-lg">Cancel</Button>
          </div>
        </div>
      )}

      {/* Plans List view */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Plan Name & Code</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Pricing Model</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4">Billing Cycle</th>
                <th className="px-6 py-4">Trial / Setup Fee</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((plan) => (
                <tr 
                  key={plan.id} 
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{plan.name}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5">{plan.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold border border-blue-100">
                      <Package className="w-3 h-3" /> {plan.product}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 font-medium">{plan.pricingModel}</span>
                    {plan.unitName && <span className="block text-[10px] text-gray-400 mt-0.5">Unit: {plan.unitName}</span>}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {formatINR(plan.price)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {plan.cycle}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{plan.trial > 0 ? `${plan.trial} Days` : 'None'}</div>
                    {plan.setupFee > 0 && <div className="text-[10px] text-gray-400 mt-0.5">Setup: {formatINR(plan.setupFee)}</div>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        onClick={(e) => { e.stopPropagation(); setSelectedPlanId(plan.id); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Layers className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium text-gray-900">No plans found</p>
                    <p className="text-xs">Adjust your search or create a new plan.</p>
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

