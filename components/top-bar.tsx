'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Bell, Settings, ChevronDown, FileText, Users, Package, TrendingDown, X, Globe, HelpCircle, Book, MessageSquare, Keyboard, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/language-context';
import { toast } from 'sonner';

const getQuickAddOptions = (t: (k: string) => string) => [
  { label: t('quick.inv'),  href: '/invoices/new', icon: <FileText    className="w-4 h-4 text-blue-500" />,   desc: t('quick.inv_desc') },
  { label: t('quick.cus'),  href: '/customers',    icon: <Users       className="w-4 h-4 text-purple-500" />, desc: t('quick.cus_desc'), action: 'customer' },
  { label: t('quick.item'), href: '/items',        icon: <Package     className="w-4 h-4 text-amber-500" />,  desc: t('quick.item_desc'), action: 'item' },
  { label: t('quick.exp'),  href: '/expenses',     icon: <TrendingDown className="w-4 h-4 text-red-500" />,  desc: t('quick.exp_desc'), action: 'expense' },
];

const getHelpOptions = (t: (k: string) => string) => [
  { label: t('help.docs'),      href: '#', action: 'docs',       icon: <Book className="w-4 h-4 text-brand" />, desc: t('help.docs_desc') },
  { label: t('help.contact'),   href: '#', action: 'contact',    icon: <MessageSquare className="w-4 h-4 text-blue-500" />, desc: t('help.contact_desc') },
  { label: t('help.shortcuts'), href: '#', action: 'shortcuts',  icon: <Keyboard className="w-4 h-4 text-emerald-500" />, desc: t('help.shortcuts_desc') },
];

const NOTIF_ICONS: Record<string, any> = {
  payment: { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-50' },
  alert: { icon: <AlertTriangle className="w-4 h-4 text-brand" />, bg: 'bg-red-50' },
  system: { icon: <Info className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-50' },
};

export function TopBar({ title }: { title?: string }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [quickOpen,   setQuickOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen,    setLangOpen]    = useState(false);
  const [helpOpen,    setHelpOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [search,      setSearch]      = useState('');
  const [notifs,      setNotifs]      = useState<any[]>([]);

  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        const json = await res.json();
        if (json.data) setNotifs(json.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadNotifs();
  }, []);

  const quickRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);
  const helpRef    = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickRef.current   && !quickRef.current.contains(e.target as Node))   setQuickOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (langRef.current    && !langRef.current.contains(e.target as Node))    setLangOpen(false);
      if (helpRef.current    && !helpRef.current.contains(e.target as Node))    setHelpOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const user    = session?.user;
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/invoices?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="px-6 py-3.5 flex items-center justify-between gap-4">

        {/* Search Bar */}
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            suppressHydrationWarning
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearch}
            placeholder={t('top.search')}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10 transition-all"
          />
          {search && (
            <button suppressHydrationWarning onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {/* ── Quick Add Dropdown ──────── */}
          <div ref={quickRef} className="relative">
            <button
              suppressHydrationWarning
              onClick={() => { setQuickOpen(o => !o); setProfileOpen(false); setHelpOpen(false); setNotifOpen(false); }}
              className="flex items-center gap-2 bg-brand hover:brightness-90 text-white text-sm font-medium rounded-lg px-4 py-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('top.quick')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform hidden sm:block ${quickOpen ? 'rotate-180' : ''}`} />
            </button>

            {quickOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-1.5">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('top.create')}</p>
                  {getQuickAddOptions(t).map((opt, idx) => (
                    <Link
                      key={opt.label}
                      href={opt.href}
                      onClick={() => setQuickOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
                        {opt.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{opt.label}</p>
                        <p className="text-[11px] text-gray-400">{opt.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Language Dropdown ──────── */}
          <div ref={langRef} className="relative">
            <button
              suppressHydrationWarning
              onClick={() => { setLangOpen(o => !o); setQuickOpen(false); setProfileOpen(false); setHelpOpen(false); setNotifOpen(false); }}
              className="flex items-center gap-1 p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-semibold text-xs"
            >
              <Globe className="w-4 h-4" />
              {language}
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-1">
                  <button 
                    suppressHydrationWarning
                    onClick={() => { setLanguage('EN'); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${language === 'EN' ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    English (EN)
                  </button>
                  <button 
                    suppressHydrationWarning
                    onClick={() => { setLanguage('TA'); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${language === 'TA' ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    தமிழ் (TA)
                  </button>
                  <button 
                    suppressHydrationWarning
                    onClick={() => { setLanguage('HI'); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${language === 'HI' ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    हिन्दी (HI)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <div ref={helpRef} className="relative hidden sm:block">
            <button
              suppressHydrationWarning
              onClick={() => { setHelpOpen(o => !o); setQuickOpen(false); setProfileOpen(false); setLangOpen(false); setNotifOpen(false); }}
              className={`p-2 rounded-lg transition-colors ${helpOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
              title={t('help.title')}
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {helpOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-1.5">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('help.title')}</p>
                  {getHelpOptions(t).map((opt) => (
                    <button
                      key={opt.action}
                      onClick={() => {
                        setHelpOpen(false);
                        if (opt.action === 'contact') {
                           window.location.href = 'mailto:support@yourcompany.com?subject=Need%20Help%20With%20Billing%20Software';
                        } else {
                           toast.info(`${opt.label} feature coming soon!`);
                        }
                      }}
                      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
                        {opt.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{opt.label}</p>
                        <p className="text-[11px] text-gray-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bell */}
          <div ref={notifRef} className="relative">
            <button
              suppressHydrationWarning 
              onClick={() => { setNotifOpen(o => !o); setQuickOpen(false); setProfileOpen(false); setLangOpen(false); setHelpOpen(false); }}
              className={`p-2 rounded-lg transition-colors relative ${notifOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Bell className="w-4 h-4" />
              {notifs.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border border-white" />}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[400px]">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 text-sm">{t('top.notifications')}</h3>
                  <button onClick={() => setNotifs([])} className="text-xs text-brand hover:underline font-medium">{t('top.mark_read')}</button>
                </div>
                <div className="overflow-y-auto flex-1 p-1">
                  {notifs.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">All caught up!</p>
                      <p className="text-xs text-gray-400">No new notifications</p>
                    </div>
                  ) : (
                    notifs.map(n => {
                      const style = NOTIF_ICONS[n.type] || NOTIF_ICONS.system;
                      return (
                        <div key={n.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg}`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 truncate">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.desc}</p>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
                  <button className="text-xs font-semibold text-gray-600 hover:text-brand transition-colors w-full py-1.5">{t('top.view_all_notifs')}</button>
                </div>
              </div>
            )}
          </div>

          {/* Settings link */}
          <Link href="/settings" className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors" title={t('top.settings')}>
            <Settings className="w-4 h-4" />
          </Link>

          {/* ── User Profile Dropdown ─── */}
          <div ref={profileRef} className="relative">
            <button
              suppressHydrationWarning
              onClick={() => { setProfileOpen(o => !o); setQuickOpen(false); setHelpOpen(false); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#EF3A2A]/30 to-[#EF3A2A]/10 ring-1 ring-brand/20 flex items-center justify-center text-brand font-bold text-xs">
                {initial}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    suppressHydrationWarning
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-500 font-semibold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('top.logout')}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
