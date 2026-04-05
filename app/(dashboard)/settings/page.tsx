'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import {
  Save, LogOut, Building2, Settings, Receipt, Mail, Paintbrush,
  User, Globe, Clock, Percent, ChevronRight, CheckCircle, RefreshCw, FileText, Crown, Flashlight, ArrowRight, ShieldCheck, Upload, Trash2
} from 'lucide-react';

const TABS = [
  { id: 'company',  label: 'Company Profile',   icon: Building2 },
  { id: 'brand',    label: 'Brand & General',   icon: Paintbrush },
  { id: 'tax',      label: 'Tax Settings',      icon: Percent },
  { id: 'invoices', label: 'Invoice Preferences', icon: Receipt },
  { id: 'quotes',   label: 'Quote Preferences', icon: FileText },
  { id: 'email',    label: 'Email Integrations',icon: Mail },
  { id: 'plan',     label: 'Subscription Plan', icon: Crown },
  { id: 'account',  label: 'My Account',        icon: User },
];

const TIMEZONES = [
  'Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney',
];

const DATE_FORMATS = [
  { label: 'DD/MM/YYYY (22/03/2026)', value: 'dd/MM/yyyy' },
  { label: 'MM/DD/YYYY (03/22/2026)', value: 'MM/dd/yyyy' },
  { label: 'YYYY-MM-DD (2026-03-22)', value: 'yyyy-MM-dd' },
  { label: 'DD MMM YYYY (22 Mar 2026)', value: 'dd MMM yyyy' },
];

const CURRENCIES = [
  { code: 'INR', label: '₹ Indian Rupee' },
  { code: 'USD', label: '$ US Dollar' },
  { code: 'EUR', label: '€ Euro' },
  { code: 'GBP', label: '£ British Pound' },
  { code: 'AED', label: 'د.إ UAE Dirham' },
  { code: 'SGD', label: 'S$ Singapore Dollar' },
];

const THEME_COLORS = [
  { label: 'Red (Default)', hex: '#EF3A2A' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Violet', hex: '#8B5CF6' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Slate', hex: '#475569' },
];

const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

const StyledInput = ({ ...props }) => (
  <Input
    {...props}
    className={`bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/30 h-10 ${props.className ?? ''}`}
  />
);

const StyledTextarea = ({ ...props }: any) => (
  <textarea
    {...props}
    className={`w-full bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 p-3 text-sm ${props.className ?? ''}`}
  />
);

const StyledSelect = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10 h-10"
  >
    {children}
  </select>
);

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);

  // Company
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [address,    setAddress]    = useState('');
  const [city,       setCity]       = useState('');
  const [state,      setState]      = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country,    setCountry]    = useState('India');
  const [taxId,      setTaxId]      = useState('');
  const [currency,   setCurrency]   = useState('INR');
  const [logo,       setLogo]       = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // General & Brand
  const [timezone,   setTimezone]   = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
  const [language,   setLanguage]   = useState('en');
  const [themeColor, setThemeColor] = useState('#EF3A2A');

  // Tax
  const [defaultTaxRate, setDefaultTaxRate] = useState('18');
  const [taxMethod,      setTaxMethod]      = useState('Exclusive');

  // Invoices
  const [invPrefix,       setInvPrefix]       = useState('INV-');
  const [invNextNumber,   setInvNextNumber]   = useState('1');
  const [invDueDays,      setInvDueDays]      = useState('30');
  const [invNotes,        setInvNotes]        = useState('');
  const [invTerms,        setInvTerms]        = useState('');
  const [invSignLine,     setInvSignLine]     = useState(true);
  const [invStatusStamp,  setInvStatusStamp]  = useState(true);

  // Quotes
  const [qtPrefix,        setQtPrefix]        = useState('QT-');
  const [qtNextNumber,    setQtNextNumber]    = useState('1');
  const [qtExpiryDays,    setQtExpiryDays]    = useState('15');
  const [qtNotes,         setQtNotes]         = useState('');
  const [qtTerms,         setQtTerms]         = useState('');

  // Email
  const [fromEmail, setFromEmail] = useState('');
  const [fromName,  setFromName]  = useState('');
  const [provider,  setProvider]  = useState('resend');
  const [apiKey,    setApiKey]    = useState('');

  // Plan
  const [planName, setPlanName] = useState('Free Plan');
  const [planStatus, setPlanStatus] = useState('Active');
  const [planAmount, setPlanAmount] = useState('0');

  // Account
  const [userName,  setUserName]  = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userSince, setUserSince] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/settings')
      .then(r => r.json())
      .then(j => {
        if (!j.data) return;
        const c  = j.data.company;
        const gs = c.settings    ?? {};
        const ts = c.taxSettings ?? {};
        const es = c.emailSettings ?? {};
        const inv = c.invoiceSettings ?? {};
        const qt = c.quoteSettings ?? {};
        const plan = c.companyPlan ?? {};
        const u  = j.data.user   ?? {};

        setName(c.name ?? '');
        setEmail(c.email ?? '');
        setPhone(c.phone ?? '');
        setAddress(c.address ?? '');
        setCity(c.city ?? '');
        setState(c.state ?? '');
        setPostalCode(c.postalCode ?? '');
        setCountry(c.country ?? 'India');
        setTaxId(c.taxId ?? '');
        setCurrency(c.currency ?? 'INR');
        setLogo(c.logo ?? '');

        setTimezone(gs.timezone ?? 'Asia/Kolkata');
        setDateFormat(gs.dateFormat ?? 'dd/MM/yyyy');
        setLanguage((gs.language || 'EN').toUpperCase());
        setThemeColor(gs.themeColor ?? '#EF3A2A');

        setDefaultTaxRate(String(ts.defaultTaxRate ?? 18));
        setTaxMethod(ts.taxMethod ?? 'Exclusive');

        setInvPrefix(inv.prefix ?? 'INV-');
        setInvNextNumber(String(inv.nextNumber ?? 1));
        setInvDueDays(String(inv.defaultDueDays ?? 30));
        setInvNotes(inv.defaultNotes ?? '');
        setInvTerms(inv.defaultTerms ?? '');
        setInvSignLine(inv.showSignLine ?? true);
        setInvStatusStamp(inv.showStatusStamp ?? true);

        setQtPrefix(qt.prefix ?? 'QT-');
        setQtNextNumber(String(qt.nextNumber ?? 1));
        setQtExpiryDays(String(qt.defaultExpiryDays ?? 15));
        setQtNotes(qt.defaultNotes ?? '');
        setQtTerms(qt.defaultTerms ?? '');

        setFromEmail(es.fromEmail ?? '');
        setFromName(es.fromName ?? '');
        setProvider(es.provider ?? 'resend');

        setPlanName(plan.planName ?? 'Free Plan');
        setPlanStatus(plan.status ?? 'Active');
        setPlanAmount(String(plan.amount ?? 0));

        setUserName(u.name ?? '');
        setUserEmail(u.email ?? '');
        setUserSince(u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '');
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (section: string, payload: object) => {
    setSaving(true);
    try {
      const res  = await fetch('/api/settings', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ section, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? 'Failed to save'); return; }
      toast.success(json.message ?? 'Settings saved!');
    } catch { toast.error('Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be less than 2MB'); return; }
    
    setUploadingLogo(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
      setLogo(data.url);
      toast.success('Logo uploaded! Click save to apply.');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <Button
      type="button"
      disabled={saving}
      onClick={onClick}
      className={`text-white font-semibold gap-2 shadow-sm border-none h-10 px-6 mt-2`}
      style={{ backgroundColor: themeColor }}
    >
      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {saving ? 'Saving...' : 'Save Settings'}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Organization Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage billing properties, visual branding, and application behaviors.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-60 flex-shrink-0">
          <nav className="bg-white border border-gray-100 rounded-xl shadow-sm p-2 space-y-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-left ${
                    active
                      ? 'bg-blue-50/50 text-gray-900 shadow-[inset_2px_0_0_0_gray] font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`}
                  style={active ? { boxShadow: `inset 3px 0 0 0 ${themeColor}`, backgroundColor: `${themeColor}10`, color: themeColor } : {}}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0`} style={active ? { color: themeColor } : {}} />
                  {tab.label}
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: themeColor }} />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* ── Company ─────────────────────────────── */}
              {activeTab === 'company' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Company Profile</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Shown on all invoices, estimates, and customer-facing pages.</p>
                  </div>

                  {/* Logo Upload */}
                  <div className="flex items-center gap-6 pb-2">
                    <div className="w-20 h-20 rounded-xl border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                      {logo ? (
                         <img src={logo} alt="Company Logo" className="w-full h-full object-contain" />
                      ) : (
                         <Building2 className="w-8 h-8 text-gray-300" />
                      )}
                      
                      <label className="absolute inset-0 bg-black/50 text-white flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex">
                        <Upload className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Upload</span>
                        <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Company Logo</h3>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] mb-2">Recommended size: 512x512px. Max 2MB (PNG, JPG).</p>
                      {logo && (
                        <button type="button" onClick={() => setLogo('')} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Remove Logo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-5">
                    <div className="md:col-span-2">
                      <FieldGroup label="Company Name / Business Name *">
                        <StyledInput value={name} onChange={(e: any) => setName(e.target.value)} placeholder="E.g., Augfox Solutions Pvt. Ltd." />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Contact Email">
                      <StyledInput type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="billing@yourcompany.com" />
                    </FieldGroup>
                    <FieldGroup label="Support Phone">
                      <StyledInput value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                    </FieldGroup>
                    <FieldGroup label="Tax Registration / GSTIN">
                      <StyledInput value={taxId} onChange={(e: any) => setTaxId(e.target.value)} placeholder="27AABCT1234H1Z0" className="font-mono uppercase" />
                    </FieldGroup>
                    <FieldGroup label="Default Currency">
                      <StyledSelect value={currency} onChange={(e: any) => setCurrency(e.target.value)}>
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                      </StyledSelect>
                    </FieldGroup>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Billing Address</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <FieldGroup label="Street Address">
                          <StyledInput value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="123 Business Park, MG Road" />
                        </FieldGroup>
                      </div>
                      <FieldGroup label="City">
                        <StyledInput value={city} onChange={(e: any) => setCity(e.target.value)} placeholder="Mumbai" />
                      </FieldGroup>
                      <FieldGroup label="State / Province">
                        <StyledInput value={state} onChange={(e: any) => setState(e.target.value)} placeholder="Maharashtra" />
                      </FieldGroup>
                      <FieldGroup label="Postal Config / ZIP">
                        <StyledInput value={postalCode} onChange={(e: any) => setPostalCode(e.target.value)} placeholder="400001" />
                      </FieldGroup>
                      <FieldGroup label="Country">
                        <StyledInput value={country} onChange={(e: any) => setCountry(e.target.value)} placeholder="India" />
                      </FieldGroup>
                    </div>
                  </div>
                  <div className="pt-2">
                    <SaveBtn onClick={() => save('company', { name, email: email || null, phone: phone || null, address: address || null, city: city || null, state: state || null, postalCode: postalCode || null, country: country || null, taxId: taxId || null, currency, logo: logo || null })} />
                  </div>
                </div>
              )}

              {/* ── Brand & General ──────────────────────── */}
              {activeTab === 'brand' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Brand & General Preferences</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Customize your workspace appearance and localization.</p>
                  </div>

                  <FieldGroup label="Accent Theme Color">
                    <div className="flex flex-wrap gap-3">
                      {THEME_COLORS.map(c => (
                        <button key={c.hex} onClick={() => setThemeColor(c.hex)}
                          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${themeColor === c.hex ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'}`}
                          style={themeColor === c.hex ? { borderColor: c.hex, '--tw-ring-color': c.hex } as React.CSSProperties : {}}
                        >
                          <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: c.hex }} />
                          <span className="text-sm font-medium text-gray-700">{c.label}</span>
                        </button>
                      ))}
                      {/* Custom color input fallback */}
                      <div className="flex items-center gap-2 border rounded-lg px-2 py-1 relative hover:bg-gray-50">
                        <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
                          className="w-6 h-6 p-0 border-0 rounded cursor-pointer absolute opacity-0" />
                        <div className="w-5 h-5 rounded-full shadow-sm pointer-events-none" style={{ backgroundColor: themeColor }} />
                        <span className="text-sm font-medium text-gray-700 pointer-events-none px-1">Custom</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">This color gets applied across the dashboard and outgoing documents.</p>
                  </FieldGroup>

                  <div className="border-t border-gray-100 my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldGroup label="System Language">
                      <StyledSelect value={language} onChange={e => setLanguage((e.target as any).value)}>
                        <option value="EN">English</option>
                        <option value="TA">Tamil</option>
                        <option value="HI">Hindi</option>
                      </StyledSelect>
                    </FieldGroup>
                    <FieldGroup label="Timezone">
                      <StyledSelect value={timezone} onChange={e => setTimezone((e.target as any).value)}>
                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                      </StyledSelect>
                    </FieldGroup>
                    <div className="md:col-span-2 mt-2">
                       <FieldGroup label="Date Format">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {DATE_FORMATS.map(f => (
                            <button key={f.value} type="button"
                              onClick={() => setDateFormat(f.value)}
                              className={`p-3 rounded-lg border text-xs text-left transition-all ${
                                dateFormat === f.value
                                  ? 'font-bold'
                                  : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'
                              }`}
                              style={dateFormat === f.value ? { backgroundColor: `${themeColor}10`, borderColor: themeColor, color: themeColor } : {}}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </FieldGroup>
                    </div>
                  </div>

                  <SaveBtn onClick={() => save('general', { language, timezone, dateFormat, themeColor })} />
                </div>
              )}

              {/* ── Tax ─────────────────────────────────── */}
              {activeTab === 'tax' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Tax Settings</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Control how taxes behave globally on new line items.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldGroup label="Global Default Tax Rate (%)">
                      <div className="relative">
                        <StyledInput type="number" min="0" max="100" step="0.5" value={defaultTaxRate} onChange={(e: any) => setDefaultTaxRate(e.target.value)} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {['0', '5', '12', '18', '28'].map(rate => (
                          <button key={rate} onClick={() => setDefaultTaxRate(rate)} className="px-2.5 py-1 text-xs border rounded-md bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium">GST {rate}%</button>
                        ))}
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Item Tax Calculation Method">
                       <div className="grid grid-cols-2 gap-2">
                        {['Exclusive', 'Inclusive'].map(m => (
                          <button key={m} type="button" onClick={() => setTaxMethod(m)}
                            className="p-3.5 rounded-xl border text-sm font-medium transition-all flex flex-col items-start gap-1 bg-gray-50 hover:border-gray-200"
                            style={taxMethod === m ? { backgroundColor: `${themeColor}10`, borderColor: themeColor, color: themeColor } : {}}
                          >
                            <div className="flex items-center gap-2">
                              {taxMethod === m && <CheckCircle className="w-3.5 h-3.5" />}
                              <span className="font-bold text-gray-900" style={taxMethod === m ? { color: themeColor } : {}}>{m}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-normal">
                              {m === 'Exclusive' ? 'Tax added on top of unit price' : 'Tax included inside unit price'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FieldGroup>
                  </div>
                  <SaveBtn onClick={() => save('tax', { defaultTaxRate, taxMethod })} />
                </div>
              )}

              {/* ── Invoices ────────────────────────────── */}
              {activeTab === 'invoices' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Invoice Preferences</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Automate numbering, terms, and visual elements on PDFs.</p>
                  </div>

                  <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 mb-4 flex items-center gap-4">
                     <Receipt className="w-8 h-8 text-blue-500" />
                     <div>
                       <p className="text-sm font-bold text-gray-900">Next Invoice Preview</p>
                       <p className="font-mono text-blue-600 bg-white px-2 py-0.5 border rounded mt-1 shadow-sm inline-block">{invPrefix}{String(invNextNumber).padStart(4, '0')}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="Invoice Number Prefix">
                      <StyledInput value={invPrefix} onChange={(e: any) => setInvPrefix(e.target.value)} placeholder="INV-" />
                    </FieldGroup>
                    <FieldGroup label="Next Sequence Number">
                      <StyledInput type="number" min="1" value={invNextNumber} onChange={(e: any) => setInvNextNumber(e.target.value)} />
                    </FieldGroup>
                  </div>

                  <div className="border-t border-gray-100 my-2" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="Default Payment Due To (Days)">
                       <div className="relative">
                        <StyledInput type="number" min="0" value={invDueDays} onChange={(e: any) => setInvDueDays(e.target.value)} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">Days</span>
                      </div>
                    </FieldGroup>
                    <div className="flex flex-col justify-end space-y-3 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={invSignLine} onChange={e => setInvSignLine(e.target.checked)} className="w-4 h-4 rounded text-blue-600 bg-gray-50 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Show Authorized Signature Line</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={invStatusStamp} onChange={e => setInvStatusStamp(e.target.checked)} className="w-4 h-4 rounded text-blue-600 bg-gray-50 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Show "PAID" / "VOID" Stamp on PDFs</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="Default Customer Notes">
                      <StyledTextarea rows={3} value={invNotes} onChange={(e: any) => setInvNotes(e.target.value)} placeholder="Thanks for your business!" />
                      <p className="text-xs text-gray-400 mt-1">Appears at the bottom of the invoice before terms.</p>
                    </FieldGroup>
                    <FieldGroup label="Default Terms & Conditions">
                      <StyledTextarea rows={3} value={invTerms} onChange={(e: any) => setInvTerms(e.target.value)} placeholder="1. Payment is due within standard timeframe..." />
                    </FieldGroup>
                  </div>

                  <SaveBtn onClick={() => save('invoiceSettings', { prefix: invPrefix, nextNumber: invNextNumber, defaultDueDays: invDueDays, defaultNotes: invNotes, defaultTerms: invTerms, showSignLine: invSignLine, showStatusStamp: invStatusStamp })} />
                </div>
              )}

              {/* ── Quotes ──────────────────────────────── */}
              {activeTab === 'quotes' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Quote Defaults</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Manage numbering and expiry rules for estimates.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="Quote Number Prefix">
                      <StyledInput value={qtPrefix} onChange={(e: any) => setQtPrefix(e.target.value)} placeholder="QT-" />
                    </FieldGroup>
                    <FieldGroup label="Next Sequence Number">
                       <StyledInput type="number" min="1" value={qtNextNumber} onChange={(e: any) => setQtNextNumber(e.target.value)} />
                    </FieldGroup>
                    <div className="md:col-span-2">
                       <FieldGroup label="Default Expiry / Validity (Days)">
                        <StyledInput type="number" min="0" value={qtExpiryDays} onChange={(e: any) => setQtExpiryDays(e.target.value)} className="w-1/2" />
                      </FieldGroup>
                    </div>
                    <FieldGroup label="Default Customer Notes">
                      <StyledTextarea rows={3} value={qtNotes} onChange={(e: any) => setQtNotes(e.target.value)} placeholder="This is an estimate, subject to change." />
                    </FieldGroup>
                    <FieldGroup label="Default Terms & Conditions">
                      <StyledTextarea rows={3} value={qtTerms} onChange={(e: any) => setQtTerms(e.target.value)} placeholder="Validity subject to inventory..." />
                    </FieldGroup>
                  </div>
                  <SaveBtn onClick={() => save('quoteSettings', { prefix: qtPrefix, nextNumber: qtNextNumber, defaultExpiryDays: qtExpiryDays, defaultNotes: qtNotes, defaultTerms: qtTerms })} />
                </div>
              )}

              {/* ── Email ───────────────────────────────── */}
              {activeTab === 'email' && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Email Gateway Integration</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Send custom domain emails directly from the dashboard.</p>
                  </div>

                  <FieldGroup label="Email Service Provider">
                    <div className="flex gap-2 w-full md:w-1/2">
                      {['resend', 'sendgrid'].map(p => (
                        <button key={p} type="button" onClick={() => setProvider(p)}
                          className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border font-bold capitalize transition-all ${
                            provider === p ? 'bg-gray-800 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </FieldGroup>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FieldGroup label="Sender Email (From) *">
                      <StyledInput type="email" value={fromEmail} onChange={(e: any) => setFromEmail(e.target.value)} placeholder="billing@yourdomain.com" />
                      <p className="text-xs text-gray-400 mt-1">Ensure this domain is verified in your provider dashboard.</p>
                    </FieldGroup>
                    <FieldGroup label="Sender Name (From Name)">
                       <StyledInput value={fromName} onChange={(e: any) => setFromName(e.target.value)} placeholder="Acme Team" />
                    </FieldGroup>
                    <div className="md:col-span-2">
                      <FieldGroup label="Mail API Key">
                        <StyledInput type="password" value={apiKey} onChange={(e: any) => setApiKey(e.target.value)} placeholder={`pk_xxxxxxxx`} />
                        <p className="text-xs text-gray-400 mt-1">If blank, standard fallback delivery will be used (not recommended for production).</p>
                      </FieldGroup>
                    </div>
                  </div>
                  <SaveBtn onClick={() => save('email', { fromEmail, fromName: fromName || null, provider, apiKey: apiKey || undefined })} />
                </div>
              )}

              {/* ── Subscription Plan ──────────────────── */}
              {activeTab === 'plan' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><Crown className="w-32 h-32" /></div>
                     <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Platform Plan</h2>
                     <div className="flex items-end gap-3 mb-6 relative z-10">
                       <h1 className="text-3xl font-black tracking-tight">{planName}</h1>
                       <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1.5">{planStatus}</span>
                     </div>

                     <div className="grid grid-cols-2 gap-4 relative z-10 max-w-md">
                       <div className="bg-white/10 rounded-lg p-3">
                         <p className="text-xs text-gray-400 font-medium">Monthly Charge</p>
                         <p className="text-lg font-bold">₹{planAmount} <span className="text-sm font-normal text-gray-400">/mo</span></p>
                       </div>
                       <div className="bg-white/10 rounded-lg p-3">
                         <p className="text-xs text-gray-400 font-medium">Billed Users</p>
                         <p className="text-lg font-bold">1 <span className="text-sm font-normal text-gray-400">Seat</span></p>
                       </div>
                     </div>
                  </div>

                  <div className="bg-white border text-center border-gray-100 rounded-xl shadow-sm p-8">
                     <Flashlight className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                     <h3 className="text-lg font-bold text-gray-900">Upgrade to Pro</h3>
                     <p className="text-sm text-gray-500 max-w-sm mx-auto mt-2">Get access to unlimited invoices, custom branding removal, API access, and multiple teammates.</p>
                     <Button className="mt-5 bg-gray-900 hover:bg-black text-white gap-2" onClick={() => save('companyPlan', { planName: 'Pro Tier', billingCycle: 'Annual' })}>
                       View Pro Features <ArrowRight className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
              )}

              {/* ── Account ─────────────────────────────── */}
              {activeTab === 'account' && (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /> Security & Profile</h2>
                      <p className="text-sm text-gray-400 mt-0.5">Your personal dashboard credentials.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-2xl border-2 border-gray-200">
                        {(userName || userEmail || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                         <FieldGroup label="Full Name">
                          <StyledInput value={userName} onChange={(e: any) => setUserName(e.target.value)} />
                        </FieldGroup>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldGroup label="Login Email">
                        <StyledInput value={userEmail} disabled className="bg-gray-50/50 border-gray-100 text-gray-400 h-10 select-none cursor-not-allowed" />
                      </FieldGroup>
                       <FieldGroup label="User Identifier">
                        <StyledInput value={`ID-${userEmail.length + 8931}`} disabled className="bg-gray-50 border-gray-100 text-gray-400 h-10 cursor-not-allowed font-mono" />
                      </FieldGroup>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Member since {userSince}</p>
                  </div>

                  {/* Danger zone */}
                  <div className="bg-white border border-red-100 rounded-xl shadow-sm p-6">
                    <h3 className="text-sm font-bold text-red-600 mb-1">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-4">Disconnect from the current session. To delete your account entirely, please contact support.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 gap-2 font-bold h-10 w-32 border"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
