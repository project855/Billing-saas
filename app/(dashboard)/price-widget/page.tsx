'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, LayoutTemplate, Settings2, Code, FileText, Check, ChevronLeft, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';

// Dummy plans representing data that would be fetched from API
const DUMMY_PLANS = [
  { id: '1', name: 'Starter', price: 0, cycle: '1 Month', features: ['1 User', 'Basic Support', '1GB Storage'] },
  { id: '2', name: 'Pro', price: 2999, cycle: '1 Month', features: ['5 Users', 'Priority Support', '10GB Storage', 'Advanced Analytics'] },
  { id: '3', name: 'Enterprise', price: 9999, cycle: '1 Month', features: ['Unlimited Users', '24/7 Dedicated Support', 'Unlimited Storage', 'Custom Integrations'] },
];

const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function PricingWidgetsPage() {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [widgets, setWidgets] = useState<{id: string; name: string; url: string}[]>([]);
  
  // Widget builder state
  const [widgetName, setWidgetName] = useState('New Pricing Table');
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(['1', '2', '3']);
  const [themeColor, setThemeColor] = useState('#EF3A2A');

  const handleSaveWidget = () => {
    if(!widgetName) { toast.error("Widget name required"); return; }
    if(selectedPlanIds.length === 0) { toast.error("Select at least one plan"); return; }
    
    setWidgets([...widgets, { id: Date.now().toString(), name: widgetName, url: `https://billing.zohosecure.in/widget/${Date.now()}` }]);
    toast.success("Widget created successfully!");
    setView('list');
  };

  const copyCode = (url: string) => {
    navigator.clipboard.writeText(`<iframe src="${url}" width="100%" height="800" frameborder="0" style="border:none;background:transparent;"></iframe>`);
    toast.success("Embed iframe code copied to clipboard!");
  };

  if (view === 'create') {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.16))] min-h-[800px] w-full bg-gray-50 overflow-hidden font-sans">
        {/* Left Toolbar */}
        <div className="w-[360px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
           <div className="p-5 border-b border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <button onClick={() => setView('list')} className="p-1.5 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors rounded-lg text-gray-500">
                 <ChevronLeft className="w-5 h-5"/>
               </button>
               <h2 className="font-bold text-gray-900 text-lg">Configure Widget</h2>
             </div>
           </div>

           <div className="p-6 flex-1 overflow-y-auto space-y-8 bg-gray-50/30">
             <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Widget Name</label>
                <Input value={widgetName} onChange={e => setWidgetName(e.target.value)} className="h-10 border-gray-200 focus-visible:ring-emerald-500 font-semibold" />
             </div>

             <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Select Plans to Display</label>
                <div className="space-y-2.5">
                  {DUMMY_PLANS.map(plan => (
                    <label key={plan.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlanIds.includes(plan.id) ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${selectedPlanIds.includes(plan.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}>
                        {selectedPlanIds.includes(plan.id) && <Check className="w-3.5 h-3.5 font-bold" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-[15px] text-gray-900 leading-none mb-1.5">{plan.name}</div>
                        <div className="text-[13px] text-gray-500 font-semibold">{formatINR(plan.price)} / {plan.cycle.split(' ')[1]}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={selectedPlanIds.includes(plan.id)}
                        onChange={(e) => {
                          if(e.target.checked) setSelectedPlanIds([...selectedPlanIds, plan.id]);
                          else setSelectedPlanIds(selectedPlanIds.filter(id => id !== plan.id));
                        }}
                      />
                    </label>
                  ))}
                </div>
             </div>

             <div className="space-y-3">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Theme Color</label>
                <div className="flex gap-3">
                  {['#EF3A2A', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#111827'].map(color => (
                     <button 
                       key={color}
                       onClick={() => setThemeColor(color)}
                       className={`w-9 h-9 rounded-full outline-offset-2 transition-all shadow-sm border border-black/10 flex items-center justify-center text-white ${themeColor === color ? 'outline outline-2 outline-gray-400 scale-110' : 'hover:scale-110'}`}
                       style={{ backgroundColor: color }}
                     >
                        {themeColor === color && <Check className="w-5 h-5 drop-shadow-md" />}
                     </button>
                  ))}
                </div>
             </div>
             
             <div className="pt-4">
                 <div className="bg-blue-50 border border-blue-200/60 p-4 rounded-xl">
                    <p className="text-[12px] font-semibold text-blue-800 leading-relaxed">
                        Customize how your pricing plans look on your actual website. All changes here will instantly update the code provided after saving.
                    </p>
                 </div>
             </div>
           </div>

           <div className="p-5 border-t border-gray-200 bg-white flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
             <Button onClick={handleSaveWidget} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-11 text-[15px] font-bold rounded-xl">Save & Get Code</Button>
           </div>
        </div>

        {/* Right Preview */}
        <div className="flex-1 bg-[#F1F5F9] relative overflow-y-auto w-full custom-scrollbar">
           {/* Topbar of preview container */}
           <div className="sticky top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 gap-2 z-20 shadow-sm">
             <LayoutTemplate className="w-4 h-4 text-gray-400" /> LIVE WIDGET PREVIEW
           </div>

           {/* Preview Canvas */}
           <div className="pt-20 pb-20 px-4 sm:px-12 min-h-full flex justify-center selection:bg-black/10">
              <div className="w-full max-w-[1000px]">
                <div className="text-center mb-16">
                  <h3 className="text-[40px] font-black text-gray-900 mb-4 tracking-tight">{widgetName}</h3>
                  <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">Choose the perfect plan for your business needs. Simple, transparent pricing.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 items-start relative z-10">
                  {DUMMY_PLANS.filter(p => selectedPlanIds.includes(p.id)).map((plan, idx, arr) => {
                    const isMiddle = arr.length === 3 && idx === 1;
                    return (
                      <div key={plan.id} className={`bg-white rounded-3xl relative transition-all duration-300 ${isMiddle ? 'border-2 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] scale-[1.03] z-10' : 'border border-gray-200 shadow-sm'}`} style={{ borderColor: isMiddle ? themeColor : undefined }}>
                        {isMiddle && (
                          <div className="absolute -top-[15px] left-0 right-0 flex justify-center">
                            <span className="text-[11px] font-black uppercase tracking-widest text-white px-4 py-1.5 rounded-full shadow-md" style={{ backgroundColor: themeColor }}>
                              Most Popular
                            </span>
                          </div>
                        )}
                        <div className="p-8 sm:p-10">
                           <h4 className="text-xl font-black text-gray-900 mb-3">{plan.name}</h4>
                           <div className="flex items-baseline gap-1 mb-6">
                             <span className="text-[44px] leading-none font-black text-gray-900 tracking-tight">{formatINR(plan.price).replace('.00', '')}</span>
                             {plan.price > 0 && <span className="text-gray-500 text-[15px] font-semibold">/{plan.cycle.split(' ')[1] || 'mo'}</span>}
                           </div>
                           <p className="text-[13px] font-medium text-gray-500 mb-8 border-b border-gray-100 pb-8 h-[60px]">
                              {plan.price === 0 ? "Everything you need to get started." : "Advanced features for growing businesses."}
                           </p>
                           
                           <Button className={`w-full h-12 rounded-xl text-[15px] font-bold mb-10 transition-all ${isMiddle ? 'text-white shadow-md hover:shadow-lg' : 'bg-[#F3F4F6] text-gray-900 hover:bg-[#E5E7EB]'}`} style={{ backgroundColor: isMiddle ? themeColor : undefined, color: isMiddle ? '#fff' : undefined }}>
                             Choose {plan.name}
                           </Button>
                           
                           <div className="space-y-4.5">
                             {plan.features.map((feat, i) => (
                               <div key={i} className="flex items-start gap-4">
                                 <div className="mt-0.5 w-[20px] h-[20px] rounded-full flex items-center justify-center bg-gray-50" style={{ color: themeColor }}>
                                    <CheckCircle2 className="w-5 h-5" />
                                 </div>
                                 <span className="text-[14px] font-semibold text-gray-700 leading-tight block">{feat}</span>
                               </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {selectedPlanIds.length === 0 && (
                    <div className="col-span-3 text-center py-24 bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-3xl">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                         <LayoutTemplate className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Plans Selected</h3>
                      <p className="text-[15px] text-gray-500 font-medium">Select plans from the sidebar to preview how your widget will look.</p>
                    </div>
                  )}
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <LayoutTemplate className="w-6 h-6 text-brand" /> Pricing Widgets
          </h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium">Create beautiful, embeddable pricing tables for your public website.</p>
        </div>
        <Button onClick={() => setView('create')} className="bg-brand hover:brightness-90 text-white border-none shadow-sm gap-2 h-10 px-6 rounded-xl text-[14px] font-bold">
          <Plus className="w-4 h-4" /> Create Widget
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
        {widgets.length === 0 ? (
          <div className="text-center py-32 flex flex-col items-center justify-center border-t border-gray-50">
             <div className="w-24 h-24 bg-red-50/50 rounded-full flex flex-col items-center justify-center mb-6 border border-red-100 shadow-inner">
               <Settings2 className="w-10 h-10 text-brand" />
             </div>
             <h3 className="text-[20px] font-black text-gray-900 mb-3 tracking-tight">No widgets created yet</h3>
             <p className="text-[15px] text-gray-500 max-w-sm mb-8 font-medium">Design your first beautiful pricing table to embed on your landing page and start getting subscribers.</p>
             <Button onClick={() => setView('create')} className="bg-brand hover:brightness-90 text-white border-none shadow-md hover:shadow-lg transition-all gap-2 h-11 px-8 rounded-xl text-[15px] font-bold">
                <Plus className="w-5 h-5" /> Build Pricing Widget
             </Button>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F8F9FA] border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-8 py-5 font-bold text-[12px] uppercase tracking-wider">Widget Name</th>
                <th className="px-8 py-5 font-bold text-[12px] uppercase tracking-wider">Hosted Embed Code</th>
                <th className="px-8 py-5 font-bold text-[12px] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {widgets.map(w => (
                 <tr key={w.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-8 py-5 font-black text-[15px] text-gray-900">{w.name}</td>
                    <td className="px-8 py-5">
                      <button 
                        className="inline-flex items-center gap-2 bg-gray-50 text-gray-600 px-3.5 py-2 rounded-lg text-[13px] font-mono border border-gray-200 cursor-pointer hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all" 
                        onClick={() => copyCode(w.url)}
                      >
                        <Code className="w-4 h-4 text-blue-500" /> Click to Copy iFrame <Copy className="w-3.5 h-3.5 opacity-40 ml-2" />
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <Button variant="outline" className="h-9 px-5 rounded-lg text-[13px] font-bold border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50" onClick={() => toast.info('Edit mode coming soon')}>Edit Options</Button>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
