'use client';

import { Search, Plus, Settings, User, Bell } from 'lucide-react';
import Link from 'next/link';

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(0,0,0,0.04)] px-6 py-3.5 md:mx-0 mx-12 flex justify-between items-center gap-4">
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-4 py-2 bg-brand text-gray-900 rounded-lg text-sm font-medium hover:brightness-90 transition-colors shadow-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">Quick Add</span>
        </button>

        <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={16} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />
          </button>
          <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={16} className="text-gray-500" />
          </Link>
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors ml-1">
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-gray-900 font-semibold text-xs">
              U
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
