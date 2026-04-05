'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  ChevronDown, Home, Users, Package, ShoppingCart, DollarSign,
  TrendingDown, FileText, BarChart3, LogOut,
  Menu, X, Settings, Tag, Layers, Gift, Repeat, LayoutDashboard, Truck, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/language-context';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: NavItem[];
  badge?: string;
}

interface NavLinkProps {
  item: NavItem;
  isChild?: boolean;
  pathname: string;
  expandedItems: Set<string>;
  toggle: (label: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

// ── Moved outside Sidebar to give a stable component reference ──────────────
function NavLink({ item, isChild = false, pathname, expandedItems, toggle, isMobileOpen, setIsMobileOpen }: NavLinkProps) {
  const active      = !!item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));
  const hasChildren = !!item.children?.length;

  if (hasChildren) {
    const isExpanded     = expandedItems.has(item.label);
    const anyChildActive = item.children!.some(
      c => !!c.href && (pathname === c.href || pathname.startsWith(c.href + '/'))
    );
    return (
      <div>
        <button
          onClick={() => toggle(item.label)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-all mx-1 my-0.5',
            anyChildActive ? 'text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
          )}
        >
          <span className={anyChildActive ? 'text-brand' : 'text-gray-400'}>{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform duration-200', isExpanded ? 'rotate-180' : '')} />
        </button>
        <div className={cn('ml-3 border-l border-gray-100 pl-1 overflow-hidden transition-all duration-200', isExpanded ? 'max-h-96' : 'max-h-0')}>
          {item.children!.map(child => (
            <NavLink
              key={child.label}
              item={child}
              isChild
              pathname={pathname}
              expandedItems={expandedItems}
              toggle={toggle}
              isMobileOpen={isMobileOpen}
              setIsMobileOpen={setIsMobileOpen}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={() => isMobileOpen && setIsMobileOpen(false)}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-all mx-1 my-0.5',
        isChild ? 'pl-[18px] text-[12px]' : '',
        active ? 'bg-brand/8 text-brand font-semibold' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
      )}
    >
      <span className={active ? 'text-brand' : 'text-gray-400'}>{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-[9px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>
      )}
      {active && !isChild && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
    </Link>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname           = usePathname();
  const { data: session }  = useSession();
  const { t }              = useLanguage();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileOpen,  setIsMobileOpen]  = useState(false);

  const navigationItems: NavItem[] = [
    { label: t('nav.dashboard'), href: '/dashboard', icon: <Home      className="w-4 h-4" /> },
    { label: t('nav.customers'), href: '/customers', icon: <Users     className="w-4 h-4" /> },
    {
      label: t('nav.catalog'),
      icon: <Package className="w-4 h-4" />,
      children: [
        { label: t('nav.items'), href: '/items',         icon: <Package        className="w-3.5 h-3.5" /> },
        { label: 'Plans',        href: '/plans',         icon: <Layers         className="w-3.5 h-3.5" /> },
        { label: 'Addons',       href: '/addons',        icon: <Gift           className="w-3.5 h-3.5" /> },
        { label: 'Coupons',      href: '/coupons',       icon: <Tag            className="w-3.5 h-3.5" /> },
        { label: 'Price Widget', href: '/price-widget',  icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
      ],
    },
    {
      label: 'Sales',
      icon: <ShoppingCart className="w-4 h-4" />,
      children: [
        { label: t('nav.invoices'),   href: '/invoices',          icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Subscriptions',     href: '/subscriptions',     icon: <Repeat   className="w-3.5 h-3.5" /> },
        { label: 'Delivery Challans', href: '/delivery-challans', icon: <Truck    className="w-3.5 h-3.5" /> },
        { label: 'Credit Notes',      href: '/credit-notes',      icon: <FileText className="w-3.5 h-3.5" /> },
        { label: 'Quotes',            href: '/quotes',            icon: <FileText className="w-3.5 h-3.5" /> },
      ],
    },
    { label: t('nav.payments'), href: '/payments', icon: <DollarSign  className="w-4 h-4" /> },
    {
      label: t('nav.expenses'),
      icon: <TrendingDown className="w-4 h-4" />,
      children: [
        { label: t('nav.expenses'), href: '/expenses', icon: <TrendingDown className="w-3.5 h-3.5" /> },
      ],
    },
    { label: 'Events',          href: '/events',   icon: <Activity   className="w-4 h-4" /> },
    { label: t('nav.reports'),  href: '/reports',  icon: <BarChart3  className="w-4 h-4" /> },
    { label: t('nav.settings'), href: '/settings', icon: <Settings   className="w-4 h-4" /> },
  ];

  // Auto-expand the section whose child is currently active
  useEffect(() => {
    for (const item of navigationItems) {
      if (item.children?.some(c => !!c.href && (pathname === c.href || pathname.startsWith(c.href + '/')))) {
        setExpandedItems(prev => new Set([...prev, item.label]));
        break;
      }
    }
  }, [pathname]);

  const toggle = (label: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const user    = session?.user;
  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  const sharedProps = { pathname, expandedItems, toggle, isMobileOpen, setIsMobileOpen };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar panel */}
      <aside className={cn(
        'fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 overflow-y-auto transition-transform z-30 flex flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.04)]',
        'md:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-0">
            <Image src="/augfox-logo.svg" alt="Augfox" width={130} height={34} priority />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 px-3 mb-2 mt-1">Main Menu</p>
          {navigationItems.map(item => (
            <NavLink key={item.label} item={item} {...sharedProps} />
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EF3A2A]/30 to-[#EF3A2A]/10 ring-1 ring-brand/20 flex items-center justify-center text-brand font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  );
}
