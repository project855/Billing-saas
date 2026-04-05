'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-white text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
